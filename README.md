# Inside Out Software

The live portfolio is hosted on Cloudflare Workers Static Assets from
`insideoutsoftware-pages/`. See [the static site README](insideoutsoftware-pages/README.md)
for content edits, local development, deployment, and domain settings.

```sh
cd insideoutsoftware-pages
npm ci
npm run dev
```

Cloudflare builds the `main` branch with root directory `insideoutsoftware-pages`,
build command `npm run build`, and deploy command `npx wrangler deploy`.

`InsideOutSoftware.Web/` retains the original .NET application. Its existing Azure
deployment workflow still runs on pushes to `main`; disable it separately when
retiring Azure. Cloudflare's Git integration deploys the static portfolio from
the same branch.
