# SyllabusDB

Know your class before you enroll.

[SyllabusDB](https://syllabusdb.com) is a student-built library of past college syllabi. Browse course expectations, grading policies, and workloads using documents shared by students.

## Features

- **Find your college:** search by name or abbreviation, or browse the alphabetical college directory.
- **Explore courses:** college pages list courses directly. A horizontally scrollable filter row offers Popular (most published syllabi first) and first-letter filters (course-code order), alongside course-code/name search. Open a course to see its syllabi.
- **Read a syllabus:** browse syllabus rows with document icons, read the full PDF within SyllabusDB, or copy its SyllabusDB link to share it.
- **Mark helpful syllabi:** sign in to vote once per syllabus, or tap again to undo. Helpful counts are public.
- **Learn from student experiences:** view optional class ratings and written reviews attached to submissions.
- **Contribute:** upload a syllabus PDF up to 5 MB, with its college, course, professor, term, and year.
- **Request a college:** submit a school that is missing from the directory.
- **Manage submissions:** sign in with Google to access My uploads and email notification preferences.
- **Moderate contributions:** the admin interface supports reviewing submissions, editing course details, and approving or rejecting uploads and college requests.

Browsing does not require sign-in. Submissions made without Google sign-in use Firebase anonymous authentication. Uploads and college requests are reviewed before being listed publicly.

The frontend now uses **TanStack Start + file-based TanStack Router**, **Tailwind CSS 4**, and locally owned **shadcn/ui components built on Radix**. Public college, subject, course, syllabus, directory, and home pages render on the server. Firebase browser authentication and account/submission workflows hydrate on the client. The separate Node service and its existing URLs are unchanged.

### Migration setup and verification

Use Node **22.12+** (Netlify selects the maintained Node 22 line). Copy `.env.example` to `.env.development.local` and fill in the existing `VITE_FIREBASE_*` web configuration. All original Firebase variable names are preserved. Do not place Admin credentials, private keys, or backend secrets in `VITE_*` variables.

`VITE_SITE_ORIGIN` is the canonical **production** origin, normally `https://syllabusdb.com`, even on previews. `VITE_NOINDEX=true` disables indexing and sitemap responses for nonproduction builds. Netlify deploy-preview and branch-deploy contexts set this automatically; the Vite configuration also forces it whenever Netlify's `CONTEXT` is nonproduction, and emits an `X-Robots-Tag` header file.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
npm run test:ssr
npx playwright install chromium
npm run test:browser
```

`test:ssr` inspects the **built server's actual HTML** with isolated public Firestore fixtures: useful content without JavaScript, metadata, missing and unpublished records, optional metadata, permanent redirects retaining queries, sitemaps, private-field exclusion, and temporary upstream failures. Browser tests serve the production bundle with those fixtures and block external network requests. They cover navigation/history/refresh, themes, responsive layout, review display, and dialog focus. They intentionally do not sign in or write to live Firebase. Run the build before either integration suite. `typecheck` checks the generated typed router; existing JavaScript pages are covered by lint, not a full strict TypeScript conversion.

### Netlify deployment (manual)

The supported `@netlify/vite-plugin-tanstack-start` adapter generates the SSR function. Use the repository's `netlify.toml`: build `npm run build`, publish **`dist/client`**. Deploy the generated function as well as assets through Netlify's normal build pipeline; uploading only static files is insufficient. The obsolete `/* /index.html 200` SPA fallback has been removed. Remove any equivalent catch-all configured in the Netlify dashboard before release. `npm run preview` previews the production build locally; `npm run dev` is the normal development entry. Local Edge Function emulation is disabled because this frontend uses Node SSR functions and no Edge Functions; Deno is not required. Netlify's dev adapter may write its own user configuration outside the repository.

Configure existing Firebase web variables in Netlify's build environment. Keep the canonical origin set to production on every context. Confirm Firebase Authentication authorized domains and email-link return domains for production and any previews where sign-in is needed. No live resources are modified by this migration.

### Public data, routes, and security

Existing public URLs remain `/college/:collegeId`, `/college/:collegeId/subject/:subject`, and `/college/:collegeId/subject/:subject/course/:courseId/syllabus/:syllabusId`. The new course URL is `/college/:collegeId/subject/:subject/course/:courseId`. College slug/alias and subject-case variants permanently redirect to canonical URLs while retaining queries. The existing `?course=` subject search remains supported; query variants canonicalize to the clean URL and use `noindex`. Private, administrative, sign-in, and submission routes are excluded from sitemaps and use `noindex`.

Public loaders use the Firestore **REST API without an auth token**, so existing anonymous security rules still apply. There is no Admin SDK or service account. Only an explicit allowlist of public fields is serialized; ownership, storage paths, profiles, and pending records are excluded. Legacy college records without `approved` remain visible, matching the old frontend. Course and syllabus records require `approved === true`. Optional syllabus metadata and absent course metadata do not prevent a published syllabus detail page from rendering.

Requests read exact college/course/syllabus paths where possible. Subject extraction currently requires reading **approved courses within one college** because no subject field exists in the existing schema. Collection reads are paged in batches of 100, capped at 10,000 per scoped collection, with a 60-second public-only cache. The cap fails explicitly rather than silently dropping records. The UI initially displays 50 results with a Show more control. The sitemap index partitions public URLs by college and course; generating the index reads approved course lists, never the entire syllabus collection. Sitemap URL sets enforce the 50,000-URL protocol limit. Missing records return 404; upstream permission, network, and query failures return errors, not 404s. Sitemap failures return 503 with Retry-After.

**Manual Firebase checks:** this checkout does not contain `firestore.rules`, Storage rules, or an index manifest despite older documentation mentioning them. Confirm the existing anonymous read rules and indexes in the console; do not weaken rules. Public queries use existing `approved == true` filters and document-name ordering. If Firebase reports a missing index, create the specific index suggested by its console error after review. Existing upload duplicate detection (`term`, `year`, `professor`, `approved`) and owner/moderation queries retain their original index requirements. No new subject field or data rewrite is required. For a much larger catalog, a separately reviewed subject projection and sitemap generation job would reduce scoped scans.

Course normalization and subject extraction live in `src/utils/courseCode.js` and are shared by upload, editing, search, and routing. Compact CUNY codes, hyphenated subjects, suffixes, and explicitly separated digit-bearing subjects are preserved. Ambiguous compact digit-bearing subjects are left unchanged. Existing noncanonical course document IDs are retained in links; any duplicate legacy records or missing parent metadata require a separate data cleanup, not an automatic rewrite.

### Themes and UI

The navigation control offers System (default), Light, and Dark. Explicit preferences persist in localStorage. A pre-paint script applies the theme before hydration, system mode follows OS changes, and all page styles use shared semantic tokens. The PDF iframe keeps a light document surface; document pixels are never inverted. Shared controls live under `src/components/ui`, with shadcn configuration in `components.json`. Dialogs and account menus use Radix for keyboard/focus handling; native select, autocomplete, and form controls retain accessible labels and validation. Mantine and React Router dependencies have been removed.

Course syllabi appear in horizontal rows with a small square document icon. Each row opens the on-site syllabus reader; public course and syllabus pages have no external Open PDF links.

On desktop, the header keeps the app name on the left and upload, an icon-only theme toggle, and sign-in/account access on the right. At widths of 768px and below, only the app name and hamburger are shown; navigation, upload, account, and appearance controls move into a sidebar. Signed-out users see a Sign in button. Desktop account toggles show the user's photo and name, with initials if the photo is unavailable. The mobile sidebar shows signed-in user information at the top and direct My uploads, Settings, and Sign out options. The theme menu offers Light, Dark, and System.

Authenticated Google/email-link sign-in, anonymous uploads, helpful votes, review editing, notification preferences, and moderation still use the original Firebase browser APIs and backend endpoints. Complete a release smoke test with a test account/project for these write workflows and actual PDF downloads/viewing before production release. Fixture tests cannot establish live Firebase authorization or PDF delivery behavior.

The dependency audit still reports inherited Firebase transitive advisories (including protobufjs and websocket-driver). Firebase was deliberately retained at the existing version; review dependency remediation separately before release rather than applying an indiscriminate major upgrade.

### Migration validation record

Verified on Node 26.13.0: lint without warnings, generated-router type checking, 47 utility tests, production build, fixture SSR checks (including cursor pagination), and seven Chromium browser tests. Light/dark desktop and mobile screenshots were inspected. A preview build passed noindex metadata, canonical-origin, robots, sitemap-disable, and header checks. Development SSR served `/aboutpage` successfully.

Read-only live checks confirmed initial HTML for Baruch College, its CIS subject, CIS 2200, and a published syllabus; the PDF HEAD response was `200 application/pdf`. Actual authenticated writes, Google/email-link sign-in, moderation authorization, and full PDF rendering/download behavior still require a test-project smoke test. No deployment, live configuration change, or data rewrite was performed.

Official references used: [TanStack Start setup](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch), [server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes), [shadcn/ui for Start](https://ui.shadcn.com/docs/installation/tanstack), [Netlify integration](https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/), and [Firestore REST security](https://firebase.google.com/docs/firestore/use-rest-api).

## Contact

Questions, feedback, or removal requests: [katophh@gmail.com](mailto:katophh@gmail.com).
