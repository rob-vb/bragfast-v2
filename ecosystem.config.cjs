// pm2 app for https://brag.fast. Runs as henk; scripts/deploy.sh reloads it.
module.exports = {
  apps: [
    {
      name: "bragfast",
      cwd: __dirname,
      script: "node_modules/.bin/next",
      args: "start -H 127.0.0.1 -p 3002",
      env: {
        // Serve the release copy so `next build` can rewrite .next safely.
        NEXT_DIST_DIR: ".next-live",
        // Convex over IPv6 from this VPS times out; prefer IPv4.
        NODE_OPTIONS: "--dns-result-order=ipv4first",
      },
    },
  ],
};
