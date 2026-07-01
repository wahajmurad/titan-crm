#!/bin/bash
# Convert all Titan components from dark to light theme
DIR="/home/z/my-project/src/components/titan"
cd "$DIR"

# Background replacements (dark → light)
find . -name "*.tsx" -exec sed -i \
  -e 's/bg-slate-950/bg-gray-50/g' \
  -e 's/bg-slate-900\/50/bg-gray-50\/80/g' \
  -e 's/bg-slate-900\/30/bg-white\/60/g' \
  -e 's/bg-slate-900\([^/]\)/bg-white\1/g' \
  -e 's/bg-slate-800\/80/bg-gray-100/g' \
  -e 's/bg-slate-800\/60/bg-gray-100\/80/g' \
  -e 's/bg-slate-800\/50/bg-gray-100\/70/g' \
  -e 's/bg-slate-800\([^/]\|$\)/bg-gray-100\1/g' \
  -e 's/bg-slate-700\/50/bg-gray-200\/70/g' \
  -e 's/bg-slate-700\([^/]\|$\)/bg-gray-200\1/g' \
  {} +

# Text replacements (dark → light)  
find . -name "*.tsx" -exec sed -i \
  -e 's/text-white/text-gray-900/g' \
  -e 's/text-slate-300/text-gray-600/g' \
  -e 's/text-slate-400/text-gray-500/g' \
  -e 's/text-slate-500/text-gray-400/g' \
  -e 's/text-slate-600/text-gray-300/g' \
  {} +

# Border replacements
find . -name "*.tsx" -exec sed -i \
  -e 's/border-slate-800\/50/border-gray-200/g' \
  -e 's/border-slate-800\([^/]\|$\)/border-gray-200\1/g' \
  -e 's/border-slate-700\/50/border-gray-200/g' \
  -e 's/border-slate-700\([^/]\|$\)/border-gray-200\1/g' \
  -e 's/border-slate-600/border-gray-300/g' \
  {} +

# Hover states
find . -name "*.tsx" -exec sed -i \
  -e 's/hover:bg-slate-800\([^/]\|$\)/hover:bg-gray-100\1/g' \
  -e 's/hover:bg-slate-800\//hover:bg-gray-100\//g' \
  -e 's/hover:bg-slate-700/hover:bg-gray-200/g' \
  -e 's/hover:text-white/hover:text-gray-900/g' \
  -e 's/hover:text-slate-300/hover:text-gray-700/g' \
  -e 's/hover:border-slate-600/hover:border-gray-300/g' \
  -e 's/hover:border-slate-700/hover:border-gray-300/g' \
  {} +

# Placeholder & focus states
find . -name "*.tsx" -exec sed -i \
  -e 's/placeholder:text-slate-500/placeholder:text-gray-400/g' \
  -e 's/focus-visible:ring-violet-500\/50/focus-visible:ring-violet-500\/30/g' \
  -e 's/focus-visible:border-violet-500\/50/focus-visible:border-violet-500\/30/g' \
  {} +

# Input/Select backgrounds
find . -name "*.tsx" -exec sed -i \
  -e 's/bg-white border-gray-300 text-gray-700/bg-white border-gray-300 text-gray-700/g' \
  -e 's/focus:bg-slate-700/focus:bg-gray-100/g' \
  -e 's/focus:text-white/focus:text-gray-900/g' \
  {} +

# Shadow adjustments for light theme
find . -name "*.tsx" -exec sed -i \
  -e 's/shadow-violet-500\/20/shadow-violet-500\/10/g' \
  -e 's/shadow-2xl shadow-violet-500\/30/shadow-lg shadow-violet-500\/15/g' \
  {} +

# Ring & accent
find . -name "*.tsx" -exec sed -i \
  -e 's/ring-2 ring-gray-200/ring-2 ring-gray-200/g' \
  -e 's/ring-gray-300/ring-gray-300/g' \
  {} +

# Also convert home-client.tsx and page files
cd /home/z/my-project/src/app
sed -i \
  -e 's/bg-slate-950/bg-gray-50/g' \
  -e 's/bg-slate-900\/50/bg-gray-50\/80/g' \
  -e 's/bg-slate-900\([^/]\)/bg-white\1/g' \
  -e 's/text-white/text-gray-900/g' \
  -e 's/text-slate-400/text-gray-500/g' \
  -e 's/text-slate-300/text-gray-600/g' \
  -e 's/border-slate-800\/50/border-gray-200/g' \
  -e 's/border-slate-800\([^/]\|$\)/border-gray-200\1/g' \
  -e 's/bg-slate-800/bg-gray-100/g' \
  -e 's/text-slate-500/text-gray-400/g' \
  home-client.tsx

echo "Theme conversion done!"