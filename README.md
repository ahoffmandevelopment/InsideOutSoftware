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

Cloudflare is the only configured hosting provider. `InsideOutSoftware.Web/`
retains the original .NET application for reference and local development.
