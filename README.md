# DeepSeek Harness Dot Background

A plug-and-play [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web plugin that replaces the conversation-area backdrop with a living, dot-matrix DeepSeek whale rendered on canvas.

![demo](docs/demo.gif)

## Features

- **Whale-shaped dot matrix** — 1,196 dots sampled from the built-in DeepSeek FishLogo path on a `54 × 40` grid.
- **Breathing motion** — the whole whale slowly scales up and down on a `5.5s` loop.
- **Per-dot color rhythm** — every dot has its own spatial phase, so color depth travels across the whale like a soft wave instead of flashing uniformly.
- **Relative dot motion** — dots drift as a traveling wave and push slightly outward from the whale center during the inhale.
- **Light / dark aware** — switches palette automatically with the Harness `data-ds-dark-theme` attribute.
- **Reduced-motion friendly** — `prefers-reduced-motion: reduce` renders a static frame.
- **Zero frontend patching** — installed as a normal `dsh` profile bundle/plugin; no `dist/index.html` edits.

## Demo

The GIF above shows one breathing cycle (light theme, rendered at reduced size). In the actual plugin, the animation runs at native resolution and follows the browser frame rate.

## Requirements

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) `0.1.0-rc.6` web profile (the plugin targets this version's layout classes)
- `dsh` on `PATH`
- `pnpm` on `PATH` (used by `dsh plugin`)

## Install

Clone the repository and install it into the `web` profile:

```bash
git clone https://github.com/Zh-U-hB/dsh-dot-background.git
cd dsh-dot-background
./install.sh
```

Or install directly without cloning:

```bash
dsh plugin --profile web add /absolute/path/to/dsh-dot-background
```

The package declares `dsh.bundle.patch`, so `dsh plugin add` automatically appends it to the profile bundle list and inserts the plugin row:

```yaml
- id: dot-background
  name: '@deepseek-ai/dsh-dot-background'
```

Then restart the web surface:

```bash
dsh web
```

Open the Harness UI and hard-refresh once (`Ctrl+Shift+R` / `Cmd+Shift+R`). If the plugin source was already running, the built-in client HMR usually picks up bundle changes automatically.

## Uninstall

```bash
./uninstall.sh
# or
dsh plugin --profile web remove @deepseek-ai/dsh-dot-background
```

Then restart `dsh web`.

## Configuration

Animation constants live at the top of [`lib/client.template.js`](lib/client.template.js):

| Constant | Default | Meaning |
| --- | --- | --- |
| `BREATH_MS` | `5500` | Duration of one breathing cycle |
| `SCALE_MAX` | `1.045` | Maximum global scale during inhale |
| `ALPHA_MIN` | `0.88` | Minimum global opacity during exhale |
| `LOGO_WIDTH_RATIO` | `0.82` | Whale width relative to the conversation column |
| `LOGO_VERTICAL_ALIGN` | `0.76` | Vertical placement of the whale |

The dot field itself (positions, base radius, base alpha) is generated from the DeepSeek FishLogo path. After changing sampling parameters, regenerate the client bundle:

```bash
python3 scripts/generate_client.py
```

The generator looks for `@deepseek-ai/dsh-client-ui-primitives` under the active `dsh` npx cache, or accepts an explicit path:

```bash
DSH_PRIMITIVES=/path/to/dsh-client-ui-primitives/lib/index.js \
  python3 scripts/generate_client.py
```

The generator needs `cairosvg` and `pillow`:

```bash
python3 -m pip install cairosvg pillow
```

## How it works

```text
dsh profile boot
        │
        ├─ dsh-dot-background bundle patch inserts the plugin row
        │
        ├─ lib/index.js      host half (no-op mount point)
        │
        └─ lib/client.js     browser half
              ├─ injects layout CSS
              ├─ finds .pI_x6G_centerCol
              ├─ creates a z-index:-1 canvas behind conversation content
              └─ render loop:
                   global breath  → scale + opacity
                   per-dot phase  → color depth + alpha + radius
                   per-dot drift  → wave + radial offset
```

The canvas is a child of the conversation center column with negative z-index, so the whale sits behind messages, composer cards, and all interactive UI without intercepting pointer events.

## Project layout

```text
.
├── lib/
│   ├── index.js             # host-side plugin entry
│   ├── client.template.js   # browser-side source template
│   └── client.js            # generated browser bundle (checked in)
├── scripts/
│   └── generate_client.py   # samples the FishLogo and regenerates client.js
├── docs/
│   └── demo.gif             # rendered preview
├── cordis.patch.yml         # profile bundle patch
├── package.json             # dsh.client + dsh.bundle manifest
├── install.sh               # dsh plugin add helper
├── uninstall.sh             # dsh plugin remove helper
└── LICENSE
```

## Compatibility

- Targets DeepSeek Harness `0.1.0-rc.6`.
- The CSS selectors follow that version's hashed conversation/layout class names. If a future Harness release renames those classes, update the selectors in `lib/client.template.js` and regenerate.

## License

[MIT](LICENSE)

The whale path is derived from `@deepseek-ai/dsh-client-ui-primitives` (MIT, Copyright (c) 2026 DeepSeek). This project is not an official DeepSeek product.
