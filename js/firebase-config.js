// ============================================================================
// Ascend. — Firebase configuration
//
// 1. Go to https://console.firebase.google.com → Create a project (free).
// 2. In your project: Build → Firestore Database → Create database
//    (start in "production mode" is fine — rules are handled below).
// 3. Build → Authentication → Sign-in method → enable "Anonymous".
// 4. Project settings (gear icon) → General → "Your apps" → Add app → Web (</>)
//    → register app → copy the firebaseConfig object it gives you into
//    FIREBASE_CONFIG below.
// 5. Firestore → Rules, paste:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /users/{userId} {
//          allow read, write: if request.auth != null && request.auth.uid == userId;
//        }
//      }
//    }
//
// That's it — Ascend. will sign you in anonymously (no login screen) and
// store all your data under your own private document, synced across
// every browser/device where you open this site.
//
// Until you fill this in, Ascend. runs fine on localStorage alone
// (per-browser only, no cross-device sync).
// ============================================================================

const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

window.FIREBASE_CONFIG = FIREBASE_CONFIG;
