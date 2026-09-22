#!/usr/bin/env bash
# Build, then swap the served release and restart pm2.
# The live site keeps serving .next-live while `next build` writes .next.
set -euo pipefail

cd "$(dirname "$0")/.."

npm run build

rm -rf .next-next .next-prev
cp -a .next .next-next
if [ -d .next-live ]; then mv .next-live .next-prev; fi
mv .next-next .next-live

sudo -u henk -H pm2 startOrRestart ecosystem.config.cjs --update-env
sudo -u henk -H pm2 save

for path in / /nl/haarlem /nl/leaderboard; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --retry 5 --retry-delay 1 --retry-all-errors "http://127.0.0.1:3002$path")
  echo "$path $code"
  if [ "$code" != 200 ]; then
    echo "deploy: $path returned $code; roll back with: mv .next-live .next-bad && mv .next-prev .next-live && sudo -u henk -H pm2 restart bragfast" >&2
    exit 1
  fi
done
