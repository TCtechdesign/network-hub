This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Firebase Admin Editing

The homepage can be edited at `/admin/homepage`, commands at
`/admin/commands`, tools and Guide Assistant settings at `/admin/tools`, the
Port Forward Wizard at `/admin/port-forward-wizard`, and guides at
`/admin/guides`.

Create a Firebase Web App, enable Firestore, and enable Email/Password sign-in
in Firebase Authentication. Add these values to `.env.local`, then restart the
Next.js server:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-web-app-id
```

Use Firestore rules like this, replacing the email with your Firebase Auth
admin user:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /networkHubContent/homepage {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email == "you@example.com";
    }

    match /networkHubContent/commands {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email == "you@example.com";
    }

    match /networkHubContent/tools {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email == "you@example.com";
    }

    match /networkHubContent/portForwardWizard {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email == "you@example.com";
    }

    match /networkHubContent/guides {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email == "you@example.com";
    }
  }
}
```

After signing in on the admin page, save once to create the Firestore document.
The public homepage at `/`, command library at `/commands`, public wizard at
`/tools/port-forward-wizard`, tools directory at `/tools`, and public guides at
`/guides` fall back to the built-in starter content until Firebase is configured
and the documents exist.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
