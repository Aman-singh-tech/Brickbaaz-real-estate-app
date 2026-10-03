# Brickbaaz

Next.js PWA: Buy/resale, Rent and builder Projects, with one shared PostgreSQL backend and a private owner/admin app.

## Local development

1. Copy `.env.example` to `.env`, configure PostgreSQL and the owner credentials.
2. `npm install`
3. `npm run db:deploy`
4. `npm run dev`

Customer app: `/`. Owner app: `/owner/login`. For separate domains use `APP_URL` (customer origin) and `OWNER_HOST` (owner hostname).

## Builder projects

Owner app → Builder Projects → Add project. Enter builder, city, state, locality, possession and RERA details. Add configurations (label, BHK, area, price or price on request), images, floor plans, video and PDF brochure. Set a map pin, payment plan and amenities. Save as Draft, Published or Archived. Published projects appear at `/projects`; customer city filters derive from published projects only. A builder can have projects in multiple cities.

Customer projects support city/BHK/budget/possession filters, map pins, comparison, saved projects, galleries, brochures, EMI estimates and enquiry/site-visit requests without login. A requested visit is not automatically confirmed. The admin manages the lead in the CRM.

Owner app → Project Leads: New, Contacted, Visit Scheduled, Visit Completed, Negotiation, Booked or Lost; notes, next follow-up, visit time, source/campaign, pickup address and call/WhatsApp links. Summary counts and due follow-ups are displayed. Dates are saved as UTC instants and displayed for India in admin reports. Existing property inquiries/chat remain separate.

## Uploads and hosting

Cloudinary credentials enable signed direct browser uploads. Project brochures use the `raw` resource type; floor plans use images. Local uploads are for development only. No existing production inventory is seeded or reset by the new migration.

The Render service runs `npm install && npm run build`, then `npx prisma migrate deploy && npm start`. The new Projects migration only creates tables/enums/indexes/relations. Keep the existing database, domains and secrets. Do not run `db:seed` against production: the legacy demo seed replaces inventory.

Google, Resend, Cloudinary and domain settings are listed in `.env.example`. No new environment variables are needed for Projects.

## Verification

`npm run lint` and `npm run build`.

For integration tests: `npx playwright install chromium`, then `npm run test:projects` after building. The test uses a unique `bb_e2e_<timestamp>` PostgreSQL schema, migrates it, runs a local server on port 3417 and removes only that schema afterwards. The database user needs schema-create permission. Never run this test against a production database; use a local/test PostgreSQL instance. Screenshots/logs are written to ignored `.tmp-projects/`. Cloudinary delivery and real email/OAuth credentials require a separate production smoke test.

## Later upgrades

Team accounts/lead assignment, commission accounting, persistent distributed rate limiting, background push/email reminders and market-price analytics are not part of this release. Existing Terms/Privacy content should be reviewed for public project lead collection before promotion.
