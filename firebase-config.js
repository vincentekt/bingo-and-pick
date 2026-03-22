/* ────────────────────────────────────────────────────────────────
   BingoPick – firebase-config.js
   ────────────────────────────────────────────────────────────────

   HOW TO SET UP (5 minutes, free):
   ─────────────────────────────────
   1. Go to https://console.firebase.google.com
   2. Click "Add project" → give it any name → Continue
   3. Disable Google Analytics (not needed) → Create project
   4. Click "Web" icon (</>)  → register app with any nickname
   5. Copy the firebaseConfig object shown → paste below
   6. In the left sidebar: Build → Realtime Database → Create Database
      → Choose region (e.g. us-central1) → Start in TEST MODE → Enable
   7. Save this file and reload BingoPick

   ──────────────────────────────────────────────────────────────── */

const FIREBASE_CONFIG = {
  // ↓↓↓  PASTE YOUR CONFIG HERE  ↓↓↓
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
  // ↑↑↑  END OF CONFIG  ↑↑↑
};

/* Set to true once you have pasted your real config above */
const FIREBASE_ENABLED = false;
