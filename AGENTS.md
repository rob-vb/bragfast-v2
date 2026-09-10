# brag.fast

Product and v1 build rules: `SPEC.md`. Read it before implementing or changing product behaviour.

If `SPEC.md` and the code disagree, `SPEC.md` wins until a human edits it.

Boards are Dutch BAG woonplaatsen (stad and dorp). Visitors add spots. Rank is like count. Auth is Better Auth Google plus `emailAndPassword`. Instagram, magic link, maker votes, and the Places catalog crawl are out of v1.

This tree lives on a VPS. The owner-facing preview is **http://77.42.31.66/** (nginx → `127.0.0.1:3002` → henk's pm2 process `bragfast` running `next start`). Never send the human to `localhost` or `127.0.0.1`. A Cursor `next dev` on 3010 is not what the owner sees. After UI changes: `next build` then `sudo -u henk -H pm2 restart bragfast`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
