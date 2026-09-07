# Security / deployment notes

The Telegram bot token and GitHub token were intentionally NOT written into this project.
They were exposed in chat, so rotate/revoke both tokens and create replacements before deployment.

## Prevent direct browser access to the backend

This app is designed so GitHub and Telegram credentials remain server-side.
The browser only talks to `/api/*`.

For production:
- Put the app behind HTTPS and a reverse proxy.
- Do not expose the Node process port directly.
- Keep `.env` outside the public web root.
- Do not serve `server.js`, `.env`, or repository files as static assets.
- Use a firewall/security group so only the reverse proxy can reach Node.
- Add rate limiting/WAF if the service is public.
- Restrict CORS if you later expose APIs to other origins.

## About curl

You cannot reliably make a public HTTP endpoint impossible to `curl`.
If an endpoint is reachable by a browser, it can generally also be requested by curl.

What you can do is require authentication/authorization and avoid exposing secrets:
- `/api/accounts` requires CEO JWT.
- `/api/tokens` requires RESS JWT.
- GitHub and Telegram credentials never go to the client.
- Do not add a fake `User-Agent` or JavaScript-only protection; those are not security controls.

## Telegram

Set `TELEGRAM_OWNER_IDS` to the numeric developer/owner IDs that may use owner-only bot commands.

## Deploying to Vercel

Vercel runs serverless functions, not a long-lived process, so this project
uses two different Telegram bot modes:

- `server.js` — local/Termux/VPS runner, uses long-polling (`bot.launch()`).
  Not used on Vercel.
- `api/index.js` — the Vercel serverless entry point, uses a **webhook**
  instead. Telegram pushes updates to `/api/telegram-webhook`.

Steps:
1. Push this project to the private GitHub repo, import it into Vercel.
2. In Vercel → Project → Settings → Environment Variables, add every key
   from `.env` (do **not** commit `.env` itself).
3. Deploy. Note the resulting URL, e.g. `https://your-app.vercel.app`.
4. Once, from your machine (with `.env` filled in locally), run:
   `npm run set-webhook -- https://your-app.vercel.app`
   This tells Telegram to send updates to your deployed webhook.
5. Re-run step 4 any time your deployment URL changes.

Known limitation: account data lives in memory during a function
invocation and is persisted to/loaded from the private GitHub repo on
every write/cold start. This is fine for light admin use, but it is not a
high-throughput database — every account create/update makes a GitHub API
commit.

`INITIAL_CEO_PASSWORD` should be a strong, non-guessable password before
this goes live publicly — it protects an account that can create and
disable other accounts.
