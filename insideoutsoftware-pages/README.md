# Inside Out Software

Static portfolio hosted on Cloudflare Workers Static Assets. Node.js generates the
HTML at build time; the deployed site does not need a .NET server or Worker script.

## Local development

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Wrangler builds the site before starting the local preview and rebuilds when
`src/` changes. Let each rebuild finish before reloading the preview. Run
`npm run build` separately when the preview is stopped.

```sh
npm run build  # Generate pages and validate local assets
npm test       # Build and test routes, galleries, escaping, and storage fallbacks
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
- `src/data/projects.json`: project content, gallery image metadata, and demo paths
- `src/data/demo-news.json` and `demo-newsletters.json`: retained local sample datasets
- `src/static/`: self-hosted fonts and licenses, original gallery screenshots, WebP previews, SVG branding, CSS, and browser scripts
- `src/templates/render.mjs`: shared portfolio templates and escaped content
- `src/templates/demos.mjs`: standalone and embedded demo templates
- `scripts/build.mjs`: generates `dist/`
- `wrangler.jsonc`: deployment, domain, and static asset routing

Project detail pages are generated at `/project/<id>/`. Requests without the final
slash redirect to the folder URL. Demo HTML files are served at clean URLs, with
requests ending in `.html` redirected automatically. Missing URLs return the
generated `404.html` with HTTP status 404.

Changes to the original Razor components are not copied into this static site.
Update the JSON, templates, or static assets here for future portfolio changes.

## Adding a gallery project

1. Add your images under `src/static/Images/<ProjectName>/`.
2. Add an entry to `src/data/projects.json`. Its position in the array determines
   the homepage and previous/next project order:

```json
{
  "id": "new-app",
  "type": "imageGallery",
  "title": "New App",
  "category": "Mobile",
  "description": "What the app does.",
  "technologies": [".NET MAUI"],
  "galleryImages": [
    {
      "src": "/Images/NewApp/home.webp",
      "alt": "Home screen showing recent activity",
      "width": 450,
      "height": 1000
    }
  ]
}
```

3. Run `npm test` and `npm run check`, then preview with `npm run dev`.

Use a unique lowercase ID with hyphens between words. A gallery needs at least one
image; there is no fixed screenshot or project count. The first image supplies
the homepage card. Portrait covers use a phone frame; landscape covers use the
web preview layout. `width` and `height` are the pixel dimensions of the file in
`src`; image resizing and format conversion are manual.

Optional fields:

- An image's `original`, such as `/Images/NewApp/home.png`, supplies a larger file
  for the viewer and fallback link. Without it, both use `src`. Smaller previews
  are useful for large screenshots but are not required.
- `summary` supplies shorter homepage copy; otherwise the card uses `description`.
- `websiteUrl` adds a “Visit website” link to the project page.
- `overview` adds the “What it does” section to the project page.
- `socialImage` supplies a custom share image; otherwise the shared site image is used.

All image paths start with `/` and resolve under `src/static/`. The build checks
project IDs, required content, image dimensions, and referenced files. Gallery
additions require no template, build-script, or test changes.

## Copper Studio interface

`app.css` owns the shared palette, typography, forms, buttons, and dialogs.
`portfolio-components.css` and `demo-components.css` own their respective layouts.
The two variable font families are self-hosted with their SIL Open Font License
files in `src/static/fonts/`. There are no external styling or icon dependencies.

Gallery thumbnails link to original screenshots when JavaScript is unavailable.
With JavaScript, a native dialog provides full-size images, visible navigation,
keyboard arrows, Escape, focus containment, and focus restoration.

Project demos use `embedded=1` at 768px and above. Their frames are 800px tall;
the source is assigned only when this larger-screen layout applies. Phones receive
a preview and full-demo link. Standalone demos retain their clean URLs and project
back links. Saved data uses the existing `savedArticles`, `savedNewsletterItems`,
and `newsletterSortPreference` keys. News theme preferences are ignored. Storage
failures fall back to in-memory state without deleting unrelated data.

## Browser verification

`scripts/browser-check.cjs` is an optional local verification runner. It uses a
separately installed Playwright package and Chrome; neither is deployed or needed
for the site build. Set `PLAYWRIGHT_MODULE` to a local Playwright package if it is
not installed in this project, and `CHROME_PATH` if Chrome is elsewhere.

For a repeatable optional setup, install the pinned browser-test package without
changing the project dependencies or lockfile:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
```

Start `npm run dev -- --port 8766 --ip 127.0.0.1`, then run the browser check after
that initial build finishes:

```sh
node scripts/browser-check.cjs
```

The runner checks all routes at desktop and 375px, representative boundaries at
320/768/1024/1440px, keyboard and dialog interactions, embedded presentations,
persistence, malformed and unavailable storage, failed imagery, no-JavaScript
fallbacks, redirects, HTTP 404, reduced motion, and a 720px viewport at 2× pixel
density for effective 200% zoom reflow. Screenshots and its report are written to
`/private/tmp/copper-qa` by default (`QA_OUTPUT` changes the location).

Do not run overlapping builds against a preview during an interaction test.
After a rebuild, reload the browser before checking the new version.

## Release and rollback

Keep the prior production version ID before publishing. Run the build, Node
tests, deployment dry run, and browser checks before `npm run deploy`. After
publishing, verify clean project/demo URLs, `.html` redirects, section anchors,
assets, and an unknown URL returning HTTP 404. Cloudflare version history retains
the previous revision; use `wrangler rollback <version-id>` to restore it.
The original .NET application remains reference material outside this redesign.

## Cloudflare documentation

- [Static assets configuration](https://developers.cloudflare.com/workers/static-assets/binding/)
- [HTML routing and trailing slashes](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- [Custom 404 pages](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)
- [Custom Domains and www redirects](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
