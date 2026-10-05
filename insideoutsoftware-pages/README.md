# Inside Out Software

Static portfolio hosted on Cloudflare Workers Static Assets. Node.js generates the
HTML at build time; the deployed site does not need a .NET server or Worker script.

## Local development

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Wrangler builds the site before starting the local preview. After editing content,
run `npm run build` to regenerate the files served by the preview.

```sh
npm run build  # Generate dist/ and validate referenced portfolio assets
npm run check  # Build and validate the Cloudflare configuration without publishing
```

## Deploy from your computer

Run these commands in this directory:

```sh
npx wrangler login
npm run deploy
```

The deploy command builds the site and uploads `dist/`. The `wrangler.jsonc`
configuration attaches `insideoutsoftware.com` as a Worker Custom Domain. Your
Cloudflare account must manage that domain and have permission to deploy Workers
and configure the zone. If there is an existing DNS record for the hostname,
Wrangler may ask to replace it; review the record before accepting.

The site uses `https://insideoutsoftware.com` for canonical and social metadata,
matching the original .NET site's preferred hostname.

### Redirect www to the primary domain

In the Cloudflare dashboard for `insideoutsoftware.com`:

1. Add or update a **proxied** DNS record for `www`. For an originless redirect,
   use an `A` record with value `192.0.2.0`.
2. Under **Rules > Redirect Rules**, create a rule matching hostname
   `www.insideoutsoftware.com`.
3. Set a dynamic destination expression to
   `concat("https://insideoutsoftware.com", http.request.uri.path)`.
4. Use status **301** and enable **Preserve query string**.

The redirect is a zone setting; the static site does not include a Worker script
that runs on every request. Cloudflare manages the Custom Domain's DNS and TLS
certificate.

## Automatic deployments

The static site is part of the `ahoffmandevelopment/InsideOutSoftware` repository.
Connect that repository through **Workers & Pages > your Worker > Settings > Build**.
After connecting, edit the build configuration and set the root directory below.

Use these settings:

| Setting | Value |
| --- | --- |
| Worker name | `insideoutsoftware` |
| Production branch | `main` |
| Root directory | `insideoutsoftware-pages` |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |

Cloudflare installs dependencies using the committed `package-lock.json`.
Workers Builds requires the explicit build command even though local Wrangler
commands use the `build.command` in `wrangler.jsonc`.

The root `.github/workflows/check-static-site.yml` workflow checks the build and
deployment configuration when static site files change. Publishing is handled by
Cloudflare's Git integration.

## Content and routing

- `src/data/site.json`: site content, metadata, experience, and contact links
- `src/data/projects.json`: project cards, galleries, and demo paths
- `src/static/`: fonts, images, HTML demos, and base CSS
- `src/templates/`: page rendering and static-site CSS overrides
- `scripts/build.mjs`: generates `dist/`
- `wrangler.jsonc`: deployment, domain, and static asset routing

Project detail pages are generated at `/project/<id>/`. Requests without the final
slash redirect to the folder URL. Demo HTML files are served at clean URLs, with
requests ending in `.html` redirected automatically. Missing URLs return the
generated `404.html` with HTTP status 404.

Changes to the original Razor components are not copied into this static site.
Update the JSON, templates, or static assets here for future portfolio changes.

## Cloudflare documentation

- [Static assets configuration](https://developers.cloudflare.com/workers/static-assets/binding/)
- [HTML routing and trailing slashes](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- [Custom 404 pages](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)
- [Custom Domains and www redirects](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
