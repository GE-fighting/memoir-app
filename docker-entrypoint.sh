#!/bin/sh
set -e

# Generate runtime config for the browser at container start.
node - <<'NODE'
const fs = require('fs');
const env = {
  NEXT_PUBLIC_API_BASE_URL: process.env.RUNTIME_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "",
  NEXT_PUBLIC_API_PREFIX: process.env.RUNTIME_API_PREFIX || process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1",
  NEXT_PUBLIC_APP_URL: process.env.RUNTIME_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "",
  NEXT_PUBLIC_AMAP_API_KEY: process.env.RUNTIME_AMAP_API_KEY || process.env.NEXT_PUBLIC_AMAP_API_KEY || "",
};
fs.writeFileSync('/app/public/env.js', `window.__ENV__ = ${JSON.stringify(env)};`);
NODE

exec "$@"
