# Bubble — Your Life, Visualized

A life visualization and time intelligence app. Track where your time goes across life categories using an interactive bubble map.

## Tech Stack

- React 18 + TypeScript + Vite
- Firebase (Auth, Firestore, Analytics)
- Tailwind CSS + shadcn/ui
- Recharts
- React Router v6

## Local Development

1. Install dependencies: `npm install`
2. Copy env template and fill in your Firebase values: `cp .env.example .env`
3. Start dev server: `npm run dev`

## Deploy to Vercel

### 1. Push to GitHub

Push your code to a GitHub repository.

### 2. Import on Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework preset: Vite (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`

### 3. Set Environment Variables

In Vercel project Settings > Environment Variables, add all values from `.env.example`:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID

### 4. Add your Vercel domain to Firebase

In Firebase Console > Authentication > Settings > Authorized domains, add your Vercel deployment URL (e.g. `bubble.vercel.app`).

### 5. Firestore Security Rules

In Firebase Console > Firestore Database > Rules, publish rules that allow authenticated users to read/write only their own data (users/{userId}, bubbles/{bubbleId}, timeLogs/{logId} where request.auth.uid == resource.data.userId).

The Firestore rules must cover 4 collections: users, bubbles, timeLogs, and sessions.

Example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /bubbles/{bubbleId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /timeLogs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```
