# SyllabusDB

Know your class before you enroll.

[SyllabusDB](https://syllabusdb.com) is a student-built library of past college syllabi. Browse course expectations, grading policies, and workloads using documents shared by students.

## Features

- **Find your college:** search by name or abbreviation, or browse the alphabetical college directory.
- **Explore subjects and courses:** search course codes and names, then expand a course to see available syllabi.
- **Read a syllabus:** preview the PDF, open it in a new tab, or copy a link to share it.
- **Learn from student experiences:** view optional class ratings and written reviews attached to submissions.
- **Contribute:** upload a syllabus PDF up to 5 MB, with its college, course, professor, term, and year.
- **Request a college:** submit a school that is missing from the directory.
- **Manage submissions:** sign in with Google to access My uploads and email notification preferences.
- **Moderate contributions:** the admin interface supports reviewing submissions, editing course details, and approving or rejecting uploads and college requests.

Browsing does not require sign-in. Submissions made without Google sign-in use Firebase anonymous authentication. Uploads and college requests are reviewed before being listed publicly.

## Local development

### Requirements

- Node.js 22 or newer and npm.
- A Firebase project with Firestore, Storage, Authentication, and an Analytics configuration.
- Google and Anonymous authentication providers enabled for the submission flows.
- Firestore and Storage access rules and any required indexes configured for your project. This repository does not include their deployment configuration.

### Setup

```sh
git clone https://github.com/Nawang17/SyllabusDB.git
cd SyllabusDB
npm ci
```

Create `.env.development.local` in the project root with your Firebase web app configuration:

```dotenv
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Use the exact values from your Firebase web app settings. Vite exposes `VITE_` variables to the browser; do not put service-account credentials or backend secrets in them. Local environment files are ignored by Git.

```sh
npm run dev
```

Open the local URL printed by Vite. For local work, use a separate Firebase project from production. Development mode displays a banner, but it does not switch Firebase projects automatically.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm test` | Run the Node.js utility tests |
| `npm run lint` | Run ESLint |
| `npm run build` | Create the production build in `dist/` |
| `npm run preview` | Preview the production build locally |

The test suite covers course-code handling, upload validation, college search and directory behavior, college requests, and admin editing utilities. It does not cover the full browser or Firebase integration flows.

## Services and deployment

The frontend uses **React 19**, **Vite 6**, **React Router 7**, **Mantine 8**, and **Tabler Icons**. Firebase provides authentication, Firestore data, PDF storage, and analytics.

Notification and admin PDF-scan requests currently call `https://syllabusdbserver-agza.onrender.com`. That backend is maintained separately and is not included here. If you run your own deployment, update those endpoints in the sign-in, upload, college-request, and admin pages to use your backend.

For production, set the Firebase environment variables in your hosting environment or `.env.production.local`, then run `npm run build`. Deploy `dist/` to your static host and configure an SPA fallback to `index.html` so direct links to colleges, subjects, and syllabi work. Configure your deployed domain in Firebase Authentication's authorized domains as needed.

## Project structure

```text
firebaseConfig.js       Firebase initialization and environment configuration
src/
  components/           Shared header and navigation
  pages/
    HomePage/           Homepage search and college browsing
    AllColleges/        College directory
    CollegePage/        College overview and subject browsing
    Subjects/           Course list and syllabus PDF viewer
    UploadSyllabusPage.jsx/
                        Upload form and submission review
    RequestCollege/     College request form
    Account/            My uploads and account settings
    Admin/              Moderation tools
    Footer/             Footer, About, guidelines, and policy pages
  utils/                Shared data helpers, validation, and unit tests
```

Core Firestore paths include `colleges/{collegeId}`, nested `courses/{courseId}/syllabi/{syllabusId}`, user profiles in `users/{uid}`, and homepage statistics in `stats/global`. PDFs are stored in Firebase Storage.

## Contributing responsibly

Share only syllabi you have the right and any required permission to publish. Remove private information and access codes before uploading. Do not submit exams, answer keys, homework solutions, or restricted materials. Keep student reviews respectful and based on your own experience.

Past syllabi are reference material and may not reflect current course requirements. Confirm current details with your instructor or institution. SyllabusDB is an independent project.

- [Upload guidelines](https://syllabusdb.com/guidelines)
- [Terms of service](https://syllabusdb.com/termsofservice)
- [Privacy policy](https://syllabusdb.com/privacy-policy)
- [Takedown and removal requests](https://syllabusdb.com/takedown)

For code contributions, open an issue or pull request with a clear description and relevant validation. Run `npm test`, `npm run lint`, and `npm run build`, and report any existing failures separately from your changes.

## Contact

Questions, feedback, or removal requests: [katophh@gmail.com](mailto:katophh@gmail.com).
