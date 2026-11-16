#!/bin/bash
# Compatibility entry point for the existing pre-commit hook.
# Factual review dates and event deadlines are edited only after an actual review.
# Run validation instead of manufacturing current verification dates.
set -euo pipefail
cd "$(dirname "$0")"
python3 scripts/check-site.py
