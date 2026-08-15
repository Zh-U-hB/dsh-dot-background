window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-dot-background",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    //#region lib/types/client.js
    /**
     * @deepseek-ai/dsh-dot-background — browser half.
     *
     * Renders the DeepSeek whale as a live canvas dot field behind the
     * conversation column. Every dot owns a spatial phase, so the whole whale
     * breathes (global scale + opacity) while each dot independently shifts
     * color depth, alpha, size and position on the same rhythm.
     */
    const name = "dot-background";
    const inject = [];

    const GRID_W = 54;
    const GRID_H = 40;
    const BREATH_MS = 5500;
    const SCALE_MAX = 1.045;
    const ALPHA_MIN = 0.88;
    const LOGO_WIDTH_RATIO = 0.82;
    const LOGO_VERTICAL_ALIGN = 0.76;
    const ALPHA_DEPTH_MIN = 0.02;
    const ALPHA_DEPTH_MAX = 1;
    const SIZE_DEPTH_MIN = 0.52;
    const SIZE_DEPTH_MAX = 1;
    const TAU = Math.PI * 2;

    /* i,j,r(base radius in cell units),alpha(base opacity) — generated from
       the built-in DeepSeek FishLogo path on a 54x40 grid. */
    const DOTS_RAW = "__DOTS_RAW__";
    const dots = [];
    for (const part of DOTS_RAW.split(";")) {
      if (part === "") continue;
      const [i, j, r, alpha] = part.split(",").map(Number);
      dots.push({
        x: (i + 0.5) / GRID_W,
        y: (j + 0.5) / GRID_H,
        r: r / 1000,
        alpha: alpha / 1000,
        phase: ((i + 0.5) / GRID_W * 1.35 + (j + 0.5) / GRID_H * 1.75) * TAU
      });
    }

    const PALETTES = {
      light: {
        deep: [65, 118, 230],
        bright: [154, 188, 248],
        gain: 0.22
      },
      dark: {
        deep: [76, 126, 245],
        bright: [185, 210, 255],
        gain: 0.30
      }
    };

    const css = `
.pI_x6G_centerCol {
  position: relative !important;
  isolation: isolate;
  background-color: var(--dsw-alias-bg-base) !important;
}
.dsh-dot-background-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}
/* Legacy dist-patch fallback used the same pseudo-element. The canvas owns
   the backdrop now, so make sure any pre-plugin pseudo layer stays hidden. */
.pI_x6G_centerCol::before {
  display: none !important;
}
.wSkVaW_root {
  background: transparent !important;
}
.wSkVaW_heroGlow,
svg[viewBox="0 0 1051 468"] {
  display: none !important;
}`;

    const tagId = "@deepseek-ai/dsh-dot-background/dot-background.css";
    if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "@deepseek-ai/dsh-dot-background";
      tag.dataset.pluginCss = tagId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }

    const mix = (from, to, amount) => [
      from[0] + (to[0] - from[0]) * amount,
      from[1] + (to[1] - from[1]) * amount,
      from[2] + (to[2] - from[2]) * amount
    ];
    const rgba = (rgb, alpha) => `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${alpha.toFixed(3)})`;

    const motionQuery = typeof matchMedia !== "undefined" ? matchMedia("(prefers-reduced-motion: reduce)") : null;

    /**
     * Browser plugin body. Mounts and owns the canvas backdrop lifecycle.
     * @param ctx - browser plugin context.
     */
    function apply(ctx) {
      ctx.effect(() => {
        let disposed = false;
        let canvas = null;
        let resizeObserver = null;
        let raf = 0;
        let phase = Math.PI / 2;
        let dark = false;
        let start = performance.now();

        const isDark = () => document.body?.hasAttribute("data-ds-dark-theme") === true;
        const reducedMotion = () => motionQuery?.matches === true;

        const draw = () => {
          const host = canvas?.parentElement;
          if (host === null || host === void 0 || disposed) return;
          const rect = host.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) return;

          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const pixelWidth = Math.max(1, Math.round(rect.width * dpr));
          const pixelHeight = Math.max(1, Math.round(rect.height * dpr));
          if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
          }

          const ctx = canvas.getContext("2d");
          if (ctx === null) return;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, rect.width, rect.height);

          const logoWidth = rect.width * LOGO_WIDTH_RATIO;
          const logoHeight = logoWidth * GRID_H / GRID_W;
          const logoLeft = (rect.width - logoWidth) / 2;
          const logoTop = (rect.height - logoHeight) * LOGO_VERTICAL_ALIGN;
          const logoCenterX = logoLeft + logoWidth / 2;
          const logoCenterY = logoTop + logoHeight / 2;
          const cell = logoWidth / GRID_W;

          const breath = reducedMotion() ? 0.5 : 0.5 - 0.5 * Math.cos(phase);
          const globalScale = 1 + (SCALE_MAX - 1) * breath;
          const globalAlpha = ALPHA_MIN + (1 - ALPHA_MIN) * breath;
          const palette = PALETTES[dark ? "dark" : "light"];
          const pulse = reducedMotion() ? 0.5 : phase;

          ctx.save();
          ctx.translate(logoCenterX, logoCenterY);
          ctx.scale(globalScale, globalScale);
          ctx.translate(-logoCenterX, -logoCenterY);

          for (let index = 0; index < dots.length; index += 1) {
            const dot = dots[index];
            const wave = pulse + dot.phase;

            /* Per-dot color depth follows the global breathing rhythm, offset by
               the dot's spatial phase so a soft wave travels across the whale. */
            const spatialPulse = reducedMotion() ? 0.5 : 0.5 + 0.5 * Math.sin(wave);
            const colorDepth = 0.12 + 0.72 * (0.45 * breath + 0.55 * spatialPulse);
            /* Wide per-dot alpha range: at the wave trough a dot fades almost
               completely out (0.02), while the crest keeps the original full
               strength. */
            const alphaDepth = ALPHA_DEPTH_MIN + (ALPHA_DEPTH_MAX - ALPHA_DEPTH_MIN) * (0.40 * breath + 0.60 * spatialPulse);
            /* Wide per-dot radius range so the dots visibly swell and shrink
               along the same breathing wave. */
            const sizeDepth = SIZE_DEPTH_MIN + (SIZE_DEPTH_MAX - SIZE_DEPTH_MIN) * (0.40 * breath + 0.60 * spatialPulse);

            /* Relative motion: dots drift as a traveling wave and also push
               slightly outward from the whale center during the inhale. */
            const radial = 0.14 * breath;
            const offsetX = cell * (
              Math.cos(wave) * 0.12 +
              (dot.x - 0.5) * radial
            );
            const offsetY = cell * (
              Math.sin(pulse * 0.93 + dot.phase * 1.07) * 0.10 +
              (dot.y - 0.5) * radial
            );

            const x = logoLeft + dot.x * logoWidth + offsetX;
            const y = logoTop + dot.y * logoHeight + offsetY;
            const radius = Math.max(0.5, cell * dot.r * sizeDepth);
            const alpha = Math.max(0, Math.min(1, dot.alpha * palette.gain * globalAlpha * alphaDepth));

            ctx.fillStyle = rgba(mix(palette.deep, palette.bright, colorDepth), alpha);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
        };

        const stopLoop = () => {
          if (raf !== 0) {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        };

        const startLoop = () => {
          stopLoop();
          if (reducedMotion()) {
            phase = Math.PI / 2;
            draw();
            return;
          }
          start = performance.now();
          const tick = (now) => {
            if (disposed) return;
            phase = (now - start) / BREATH_MS * TAU;
            draw();
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        };

        const updateTheme = () => {
          const next = isDark();
          if (next === dark) return;
          dark = next;
          draw();
        };

        const ensureCanvas = () => {
          const host = document.querySelector(".pI_x6G_centerCol");
          if (host === null) return;
          if (canvas !== null && canvas.parentElement === host) return;
          canvas?.remove();
          canvas = document.createElement("canvas");
          canvas.className = "dsh-dot-background-canvas";
          canvas.setAttribute("aria-hidden", "true");
          host.appendChild(canvas);
          resizeObserver?.disconnect();
          resizeObserver = new ResizeObserver(() => draw());
          resizeObserver.observe(host);
          startLoop();
        };

        const observer = new MutationObserver(() => {
          if (disposed) return;
          updateTheme();
          ensureCanvas();
        });
        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["data-ds-dark-theme"]
        });

        dark = isDark();
        ensureCanvas();

        const onMotionChange = () => startLoop();
        motionQuery?.addEventListener?.("change", onMotionChange);
        motionQuery?.addListener?.(onMotionChange);

        return () => {
          disposed = true;
          stopLoop();
          observer.disconnect();
          resizeObserver?.disconnect();
          motionQuery?.removeEventListener?.("change", onMotionChange);
          motionQuery?.removeListener?.(onMotionChange);
          canvas?.remove();
        };
      }, "dot-background: canvas layer");
    }
    //#endregion

    exports.apply = apply;
    exports.inject = inject;
    exports.name = name;
    return module.exports;
  }
});
