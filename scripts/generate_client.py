#!/usr/bin/env python3
"""Regenerate lib/client.js dot data from the built-in DeepSeek FishLogo path."""
from __future__ import annotations

import glob
import io
import math
import os
from pathlib import Path

try:
    import cairosvg
    from PIL import Image
except ImportError as exc:  # pragma: no cover - build-time only
    raise SystemExit("generator needs cairosvg and pillow: pip install cairosvg pillow") from exc

PLUGIN_DIR = Path(__file__).resolve().parents[1]


def resolve_primitives() -> Path:
    override = os.environ.get("DSH_PRIMITIVES")
    if override:
        return Path(override)
    candidates = sorted(glob.glob("/home/jump/.npm/_npx/*/node_modules/@deepseek-ai/dsh-client-ui-primitives/lib/index.js"))
    if candidates:
        return Path(candidates[-1])
    raise SystemExit("set DSH_PRIMITIVES to @deepseek-ai/dsh-client-ui-primitives/lib/index.js")


PRIMITIVES = resolve_primitives()

C, R = 54, 40
RENDER_W, RENDER_H = 1080, 800
THRESHOLD = 0.08


def fish_path() -> str:
    source = PRIMITIVES.read_text(encoding="utf-8")
    segment = source[source.find("function FishLogo"):]
    line = next(line for line in segment.splitlines() if line.strip().startswith('d: "'))
    return line.split('d: "', 1)[1].rsplit('"', 1)[0]


def sample_dots() -> list[str]:
    path = fish_path()
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.16 17.04"><path d="{path}" fill="#000"/></svg>'
    png = cairosvg.svg2png(bytestring=svg, output_width=RENDER_W, output_height=RENDER_H)
    alpha = Image.open(io.BytesIO(png)).convert("RGBA").split()[3]
    parts: list[str] = []
    for j in range(R):
        for i in range(C):
            box = alpha.crop((
                int(i * RENDER_W / C),
                int(j * RENDER_H / R),
                int((i + 1) * RENDER_W / C),
                int((j + 1) * RENDER_H / R),
            ))
            hist = box.histogram()
            total = sum(hist)
            weight = sum(k * n for k, n in enumerate(hist)) / (255 * total) if total else 0.0
            if weight <= THRESHOLD:
                continue
            v = math.pow(min(1.0, weight * 1.6), 0.75)
            base_alpha = 0.16 + 0.84 * v
            base_radius = 0.30 + 0.10 * v
            parts.append(f"{i},{j},{round(base_radius * 1000)},{round(base_alpha * 1000)}")
    return parts


def main() -> None:
    raw = ";".join(sample_dots())
    template = (PLUGIN_DIR / "lib" / "client.template.js").read_text(encoding="utf-8")
    client = template.replace('"__DOTS_RAW__"', json_dumps(raw))
    (PLUGIN_DIR / "lib" / "client.js").write_text(client, encoding="utf-8")
    print(f"generated lib/client.js with {raw.count(';') + 1} dots ({len(raw)} chars)")


def json_dumps(value: str) -> str:
    # Keep the generated file plain and deterministic; the value is digits/commas/semicolons only.
    import json
    return json.dumps(value)


if __name__ == "__main__":
    main()
