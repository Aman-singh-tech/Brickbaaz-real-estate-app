# Brickbaaz

Next.js PWA: Buy/resale, Rent and builder Projects, with one shared PostgreSQL backend and a private owner/admin app.

## Local development

1. Copy `.env.example` to `.env`, configure PostgreSQL and the owner credentials.
2. `npm install`
3. `npm run db:deploy`
4. `npm run dev`

Customer app: `/`. Owner app: `/owner/login`. For separate domains use `APP_URL` (customer origin) and `OWNER_HOST` (owner hostname).

## Builder projects

Owner app → Builder Projects → Add project. Enter builder, city, state, locality, possession and RERA details. Add configurations (label, BHK, area, price or price on request), images, floor plans, video and PDF brochure. Set a map pin, payment plan and amenities. Save as Draft, Published or Archived. The customer app currently searches Gurugram only and treats Gurgaon as the same city; owner records can still contain other cities.

Customer projects support city/BHK/budget/possession filters, map pins, comparison, saved projects, galleries, brochures, EMI estimates and enquiry/site-visit requests without login. A requested visit is not automatically confirmed. The admin manages the lead in the CRM.

Owner app → Lead CRM unifies property, project, loan and imported contacts. Original property conversations and project enquiry pages remain available. The additive CRM migration copies existing enquiries, project leads and project notes without deleting them; future enquiries are mirrored transactionally. CRM edits synchronize the linked legacy stage/visit fields. Dates are UTC instants; reports display India time and editors use the device's local time.

## Services, testimonials and lead CRM

Customer `/services` offers home, property-backed, personal, business, vehicle, education, gold and other loan assistance. This collects enquiries only, with no lender approval/disbursement integration. Public property/project interest forms require contact consent and do not require login. Sources/campaigns are captured as attribution supplied by the visitor (not verified).

Owner `/owner/crm`: list/board views, stage/type/source/search filters, due-today and overdue follow-ups, manual contacts, notes/activity history, Call and WhatsApp links. The board is paginated (50 contacts per page); reminders appear in-app on the dashboard and CRM, not via scheduled email/SMS. Stages: New, Contacted, Follow-up, Visit Scheduled, Negotiation, Converted, Lost.

`/owner/crm/import` accepts UTF-8 CSV, up to 1 MB/1,000 contacts. Map name/phone and optional email, interest, message, source columns; preview all rows before confirming. Invalid contacts and existing/within-file phone duplicates are skipped. Imports are transactionally rechecked, retain provenance and do not invent customer consent. Meta CSV exports are supported; automatic Meta API synchronization is not included. All imported rows initially use type Other and stage New.

Owner `/owner/testimonials`: add/edit, publish/unpublish and display order; feedback text, property/project reference, image and video. Published items appear on `/testimonials` and the homepage. Cloudinary uses existing signed image/video uploads; local uploads are for development. Only publish feedback/media you have permission to use.

Deployment requires `prisma migrate deploy` before starting the new app. No new environment variables or production seed are required.

## Uploads and hosting

Cloudinary credentials enable signed direct browser uploads. Project brochures use the `raw` resource type; floor plans use images. Local uploads are for development only. No existing production inventory is seeded or reset by the new migration.

The Render service runs `npm install && npm run build`, then `npx prisma migrate deploy && npm start`. The new Projects migration only creates tables/enums/indexes/relations. Keep the existing database, domains and secrets. Do not run `db:seed` against production: the legacy demo seed replaces inventory.

Google, Resend, Cloudinary and domain settings are listed in `.env.example`. No new environment variables are needed for Projects.

## Verification

`npm run lint` and `npm run build`.

`npm run test:crm` checks all four services/CRM features with a temporary `bb_crm_test_<timestamp>` schema on a local PostgreSQL database: legacy backfill, guest enquiries, follow-up timezones, CSV validation/deduplication, testimonial image/video uploads and publishing, authorization and responsive layouts. No production data is changed. Real Cloudinary account permissions and lender/Meta integrations are outside this local test.

For integration tests: `npx playwright install chromium`, then `npm run test:projects` after building. The test uses a unique `bb_e2e_<timestamp>` PostgreSQL schema, migrates it, runs a local server on port 3417 and removes only that schema afterwards. The database user needs schema-create permission. Never run this test against a production database; use a local/test PostgreSQL instance. Screenshots/logs are written to ignored `.tmp-projects/`. Cloudinary delivery and real email/OAuth credentials require a separate production smoke test.

## Later upgrades

Team accounts/lead assignment, commission accounting, persistent distributed rate limiting, background push/email reminders and market-price analytics are not part of this release. Existing Terms/Privacy content should be reviewed for public project lead collection before promotion.

## Customer homepage and business information

The customer homepage opens directly for first-time visitors with Gurugram as the default. It includes About, live property categories and cards, published builder projects, services, the four-step enquiry/visit process, published customer stories, a guest contact form, and policy links. Drawer section links use native smooth scrolling. Reveal animations and Back to top respect reduced-motion settings; all content remains available without reveal JavaScript.

Homepage contact enquiries require contact consent and create `OTHER` / `Property assistance` leads in the existing owner CRM, with a desk notification and visitor-provided source/campaign attribution. No new database migration is required for this homepage change; previous CRM/testimonial migrations must already be applied.

Default About/service text is included. Optional Render environment variables customize public information: `BRICKBAAZ_ABOUT`, `BRICKBAAZ_OFFICE_ADDRESS`, `BRICKBAAZ_WORKING_HOURS`, `SUPPORT_EMAIL`, `SUPPORT_WHATSAPP` (international number). Calls use a valid `SUPPORT_PHONE`, falling back to the existing public `OWNER_PHONE`. Only configured contact information is displayed. No email/password, private account email, fabricated office details or reviews are shown. Update these values and redeploy to change them. Publish testimonials and properties/projects through the owner app to update inventory and stories.

After `npm run build`, `npm run test:homepage` checks the new homepage against a temporary local database schema, including inventory visibility, guest consent-to-CRM, public contact links, scrolling, mobile/desktop layout and reduced motion. It removes only its own test schema afterward and never seeds production.

The homepage hero uses `public/videos/brickbaaz-promotional.mp4`, supplied by the owner, when present. Its portrait framing stays fully visible beside desktop copy and below mobile copy. Playback is muted and looped with Pause/Play and a full-video link. Reduced-motion visitors get manual playback, autoplay failures retain the Play control, and video errors retain the photo fallback. Replace that file and redeploy to update the promotional clip.
