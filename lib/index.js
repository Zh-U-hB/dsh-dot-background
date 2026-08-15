//#region lib/types/index.js
/**
 * @deepseek-ai/dsh-dot-background — host half.
 *
 * The plugin is browser-only: all rendering and animation lives in the
 * client bundle. This host-side module exists so the package can be mounted
 * as a normal dual-face dsh client row in the profile tree.
 */
/** Cordis plugin name. */
const name = "dot-background";
/** Required services: none. */
const inject = [];
/**
 * Host plugin body. Deliberately empty: the browser half owns the backdrop.
 */
function apply() {}
//#endregion
export { apply, inject, name };
