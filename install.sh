#!/usr/bin/env bash
set -euo pipefail
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DSH_BIN="${DSH_BIN:-dsh}"
exec "$DSH_BIN" plugin --profile web add "$PLUGIN_DIR"
