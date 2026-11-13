#!/bin/sh
# Builds page.html (the published page) and index.html (a standalone copy that works offline) from src/.
cd "$(dirname "$0")" || exit 1
HEAD=$(sed '/<!--BODY-->/,$d' src/head.html)
BODY=$(sed '1,/<!--BODY-->/d' src/head.html)
{ cat src/head.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
  echo '<script>'; cat src/core.js; echo '</script>'
  echo '<script>'; cat src/app.js; echo '</script>'; } > page.html
{ echo '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>'
  printf '%s\n' "$HEAD"; echo '</head><body>'; printf '%s\n' "$BODY"
  echo '<script src="three.min.js"></script>'
  echo '<script>'; cat src/core.js; echo '</script>'
  echo '<script>'; cat src/app.js; echo '</script></body></html>'; } > index.html
