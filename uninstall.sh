#!/usr/bin/env bash
set -euo pipefail
DSH_BIN="${DSH_BIN:-dsh}"
exec "$DSH_BIN" plugin --profile web remove @deepseek-ai/dsh-dot-background
