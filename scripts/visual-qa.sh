#!/usr/bin/env bash
set -euo pipefail

# Visual QA Runner for CareerCraft AI
# Captures responsive screenshots in LTR (en) and RTL (ar) viewports using headless Google Chrome.

BASE_URL="${1:-http://localhost:3000}"
OUTPUT_DIR="scratch/qa"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Error: Google Chrome not found at $CHROME_BIN" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "=== CareerCraft AI Visual QA ==="
echo "Target: $BASE_URL"
echo "Output: $OUTPUT_DIR"

# Check if target is responding
if ! curl -s -f -o /dev/null "$BASE_URL" 2>/dev/null; then
  echo "Warning: Target server at $BASE_URL did not respond. Ensure 'npm run dev' is running." >&2
fi

# Viewport definitions (Width x Height)
declare -a VIEWPORTS=(
  "desktop:1440,900"
  "tablet:768,1024"
  "mobile:375,812"
)

# Locales (LTR and RTL)
declare -a LOCALES=("en" "ar")

for locale in "${LOCALES[@]}"; do
  target_url="${BASE_URL}/${locale}"
  echo "Capturing locale: $locale ($target_url)..."

  for vp_entry in "${VIEWPORTS[@]}"; do
    vp_name="${vp_entry%%:*}"
    vp_dims="${vp_entry##*:}"
    vp_width="${vp_dims%%,*}"
    vp_height="${vp_dims##*,}"

    out_file="${OUTPUT_DIR}/${locale}-${vp_name}-${vp_width}x${vp_height}.png"

    "$CHROME_BIN" \
      --headless \
      --disable-gpu \
      --hide-scrollbars \
      --virtual-time-budget=3000 \
      --window-size="${vp_width},${vp_height}" \
      --screenshot="$out_file" \
      "$target_url" 2>/dev/null || true

    if [[ -f "$out_file" ]]; then
      echo "  [OK] $vp_name ($vp_dims) -> $out_file ($(stat -f%z "$out_file" 2>/dev/null || wc -c < "$out_file") bytes)"
    else
      echo "  [FAIL] $vp_name ($vp_dims) -> could not capture"
    fi
  done
done

echo "Visual QA capture complete."
