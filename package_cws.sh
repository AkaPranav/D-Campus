#!/bin/bash
# package_cws.sh — Packages COER Retro OS into a Chrome Web Store compliant ZIP archive

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION=$(node -e "console.log(require('$PROJECT_ROOT/extension/manifest.json').version)")
DIST_DIR="$PROJECT_ROOT/dist"
OUTPUT="$DIST_DIR/coer-retro-os-webstore-v${VERSION}.zip"

mkdir -p "$DIST_DIR"

echo "[+] Packaging COER Retro OS v${VERSION} for Chrome Web Store..."

# Remove previous build
rm -f "$OUTPUT"

# Package files directly from extension/ root so manifest.json is at the ZIP root
(
  cd "$PROJECT_ROOT/extension" && \
  zip -r "$OUTPUT" . \
    -x "*.DS_Store*" \
    -x "*Thumbs.db*" \
    -x "*.git*"
)

echo "[✓] Archive created successfully: $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
echo "[*] Ready to upload to https://chrome.google.com/webstore/devconsole"
