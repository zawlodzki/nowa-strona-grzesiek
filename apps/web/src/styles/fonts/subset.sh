#!/bin/sh
# Rebuilds the WOFF2 files in this folder from the variable TTFs on the old
# Webflow CDN (the same files the live site serves), cut to Latin + Latin Extended.
# Needs pyftsubset (pip install fonttools brotli). Usage: subset.sh [<ttf-dir>]
set -eu

out=$(cd "$(dirname "$0")" && pwd)
src=${1:-$(mktemp -d)}
cdn=https://cdn.prod.website-files.com/62e8050a7ce936c2cad0d6a1

# Google Fonts' latin + latin-ext ranges; keep in sync with fonts.css.
unicodes='U+0000-00FF,U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2000-206F,U+2020,U+20A0-20C0,U+2113,U+2122,U+2191,U+2193,U+2212,U+2215,U+2C60-2C7F,U+A720-A7FF,U+FEFF,U+FFFD'

while read -r id name; do
  [ -f "$src/$name.ttf" ] || curl -sSfo "$src/$name.ttf" "$cdn/${id}_$name.ttf"
  pyftsubset "$src/$name.ttf" \
    --unicodes="$unicodes" \
    --layout-features='*' \
    --flavor=woff2 \
    --output-file="$out/$name.woff2"
  echo "$name.woff2 $(wc -c < "$out/$name.woff2") bytes"
done <<EOF
64a65f4b08bc7f2ce50f33a3 Erode-Variable
64a6643115899abfa357b125 Erode-VariableItalic
64a661852958e73937ff8efe Satoshi-Variable
64a6640e8508ed5a8b4a61ad Satoshi-VariableItalic
EOF
