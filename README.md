# SIONA

A restrained, responsive website for **Siona Group LLC**, built with Next.js App Router, TypeScript, and Tailwind CSS. The homepage is statically rendered; only navigation and the contact form need client JavaScript. The metallic ribbon S and layered onyx backgrounds are optimized local WebP assets, paired with self-hosted DM Sans and Instrument Serif fonts. No external image, font, or analytics requests are needed to render the page.

## Local development

Use Node.js **24 LTS** (see `.nvmrc`) and npm. This task already has an isolated checkout; work in it without creating an additional Git worktree.

```sh
cd /workspace/Siona-website # or your local clone
npm ci
test -e .env.local || cp .env.example .env.local
npm run dev
```

The development server uses port 3000. The homepage works without credentials. Sending a real message requires email configuration; the endpoint returns an honest unavailable response until configured.

## Contact configuration

Set these values in `.env.local` for development and in the Vercel project's environment settings for deployment. Keep credentials out of source control and out of all `NEXT_PUBLIC_` variables.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your actual canonical HTTPS website URL, without a trailing slash. Used for canonical metadata, sitemap, and origin validation. If absent on Vercel, metadata uses `VERCEL_PROJECT_PRODUCTION_URL`. |
| `RESEND_API_KEY` | An API key with permission to send email through Resend. |
| `CONTACT_FROM_EMAIL` | A plain email address on your **verified Resend sender domain**; display names are not accepted. |
| `CONTACT_TO_EMAIL` | The real inbox that should receive inquiries. |
| `CONTACT_SECURITY_SECRET` | A random secret of at least 32 characters. Generate with `openssl rand -hex 32`. Required in production. |
| `UPSTASH_REDIS_REST_URL` | HTTPS REST endpoint for an Upstash Redis database. Required in production. |
| `UPSTASH_REDIS_REST_TOKEN` | The database's read/write REST token (not a read-only token). Required in production. |

1. Verify your sending domain in Resend, including its required DNS records. Configure a real sender and recipient; the repository intentionally supplies neither.
2. Create an Upstash Redis database and copy its REST URL and read/write token into your secure environment settings.
3. Generate the security secret and set all required variables. Restart the local server or redeploy after changing environment settings.
4. Send a real inquiry from the deployed website, check the recipient inbox, and confirm that Reply uses the visitor's email address. This final delivery check requires your credentials; automated tests use a simulated provider.

The server posts plain-text messages to `https://api.resend.com/emails`. The visitor's email is `reply_to`, never the sender. API credentials are referenced exclusively in server-side code. The application does not log message contents, email addresses, provider responses, or credentials. Email providers and the receiving inbox retain messages according to their settings. Avoid submitting sensitive health or patient information through a general contact form.

### Validation and spam protection

- Shared client/server validation: name 2–100 characters, valid email up to 254 characters, message 10–5,000 characters. Validation errors are associated with their inputs, and the first invalid input receives focus.
- Same-origin JSON submissions only, a 24 KB streamed body limit, hidden honeypot, HMAC-signed form token, two-second minimum token age, one-hour expiry, and replay protection.
- Atomic Redis quotas: five submissions per client per 15 minutes and 100 total per hour. IPs are HMAC-hashed before use as Redis keys. Keys expire automatically. Rate limits include provider failures to prevent repeated downstream requests.
- Production fails closed if required configuration or Redis is unavailable. Development uses an in-memory limiter and a development-only signing key; these are **never** used as production fallbacks.
- Provider timeouts and idempotency keys limit duplicate email. A delivery timeout can mean a provider accepted a message before the response was lost; check the inbox/provider dashboard before retrying.

Vercel supplies a trusted `x-forwarded-for` header. For another hosting platform, use a reverse proxy that overwrites this header and prevents direct access to the application server. These protections reduce automated abuse; higher-risk public campaigns may also need Vercel WAF rules or a CAPTCHA. No CAPTCHA service is required for the default workflow.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm test` exercises the actual endpoint handlers with Node's test runner: successful provider requests, normalization, invalid input, body limits, same-origin enforcement, signed tokens, honeypots, replay prevention, quotas, production fail-closed behavior, Redis failures, and provider errors. No real emails are sent.

Browser tests cover desktop/mobile navigation, overflow, keyboard access, validation, retained input on failure, the success state, and automated WCAG 2.2 AA accessibility checks:

```sh
npx playwright install chromium
npm run test:e2e
# Or use an existing Chromium installation:
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

The browser runner starts a development server on port 3000, or reuses an existing one outside CI. Browser delivery responses are mocked; successful live inbox delivery is a separate deployment check.

## Deploy to Vercel

1. Push the project to your Git repository and import it into Vercel.
2. Select the **Next.js** framework preset, repository root as the root directory, and Node.js **24.x**. Keep the default install/build/output settings (`npm ci`, `npm run build`, and Next.js output).
3. Add the environment variables above to the appropriate Production and Preview scopes. Use a separate recipient/database for previews if desired. Set the production site's actual URL for canonical metadata; Vercel's deployment protection should protect private previews.
4. Deploy, attach your domain, and complete the live contact delivery check. No custom Vercel configuration file is needed. The contact route uses the Node.js runtime; a static export cannot send email.

The site provides metadata, canonical URLs when configured, a sitemap, robots rules, an SVG favicon, a generated PNG Open Graph image, semantic sections, visible keyboard focus, a skip link, reduced-motion support, and self-hosted fonts. No company addresses, personnel claims, partnerships, or achievements are included.

## Structure

```text
src/app/                    App Router pages, metadata, global styles
src/app/api/contact/        Server-only GET challenge / POST submission route
src/components/             Reusable brand, layout, and form components
src/lib/contact-schema.ts   Shared field validation
src/lib/server/contact.ts  Email delivery, signatures, and rate limiting
tests/contact.test.ts       Endpoint tests with a simulated provider
tests/e2e/                  Desktop/mobile browser tests
```

Design tokens and responsive layouts live in `src/app/globals.css`; `BrandSymbol` shares the metallic symbol across the homepage and navigation. The refreshed assets are reconstructed from the supplied LinkedIn screenshot; see `public/brand/README.md` for provenance and replacement guidance. The same symbol is used in the favicon, app/Apple icons, and generated social image. The charcoal, ivory, sandstone, champagne, and sage treatment preserves the existing copy and contact functionality. Footer copyright text follows the supplied 2026 brand copy.

Font licenses are retained in `public/licenses/`.

## Internal intelligence workspace

The Siona Evolution Engine is at `/workspace/intelligence` (invitation-only Supabase Auth plus active internal membership). See [setup and workflow](docs/evolution-engine.md) and [architecture/security](docs/evolution-engine-architecture.md). SQL migrations and explicit rollback scripts are under `supabase/`. The public Passport demonstration remains at `/platform`.

## Practice and supply operations

`/workspace/operations` adds practice onboarding, a supplier-linked catalog, state/channel eligibility reviews and business coordination requests to the same application and Supabase project. Open it from Evo's **Operations workspace** link. It needs the additional `202611100001_operations.sql` migration; do not repeat the installed Evo setup. See [activation, workflow, preview and limits](docs/operations.md). The interactive fictional rehearsal at `/workspace/operations/preview` is available only during development.

The invitation-only practice portal at `/practice` adds location-scoped accounts, a deliberately published catalog, coordination requests and public progress updates. It needs `202611100002_practice_portal.sql` after Operations. See [practice access, security and deployment](docs/practice-portal.md). A separate interactive rehearsal is at `/practice/preview` in development only. Patient-specific clinical workflows and a public consumer checkout remain outside these modules.

The homepage globe, Approach ribbons, Vision neurons, and Biologics DNA helix are local procedural Canvas illustrations. The shared `SignalEngine` manages eased scroll/pointer motion, independent pause controls, off-screen/background suspension, a 30 fps ceiling, and a pixel ratio capped at 2. Reduced-motion preferences produce static illustrations. The globe carries branching electrical cascades and longer surface arcs; Vision sequences dendritic inputs, central activation, and outgoing axonal signals. Scene geometry lives in `src/lib/visuals/scientific-scenes.ts`; it is illustrative rather than a visualization of research data. Browser tests check animation, pause/resume, reduced motion, and responsive overflow across all four scenes.
