# Ascend.

A single-page, dark/minimalist personal operating system: daily task
planner, Google Calendar view, weekly/monthly/yearly goals, a visual
progress tracker, a habit tracker, a daily journal, a rotating motivation
quote, and a daily reading recommendation — all in one page, all synced to
your own private Firebase project so your data follows you across devices.

It's a fully static site (plain HTML/CSS/JS, no build step), so it deploys
straight to GitHub Pages. This folder is already a git repo, committed and
ready to push.

## 1. Run it locally, right now

No setup required to try it — it works immediately using only your browser's
local storage (data stays on this one browser until you connect Firebase).

```bash
cd ascend
python3 -m http.server 8080
# open http://localhost:8080
```

Or just double-click `index.html` — it works opened directly from disk too.

## 2. Connect cross-device cloud sync (Firebase — free tier)

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project** (free "Spark" plan is enough).
2. In the new project: **Build → Firestore Database → Create database**. Choose any region close to you; "Start in production mode" is fine.
3. **Build → Authentication → Sign-in method → Anonymous → Enable.** This gives Ascend. a private user ID with no login screen.
4. **Firestore Database → Rules**, replace the contents with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

   Click **Publish**.

5. **Project settings (gear icon, top left) → General → Your apps → Add app → Web (`</>`)**. Give it any nickname, skip hosting, click **Register app**. Copy the `firebaseConfig` object it shows you.
6. Open `js/firebase-config.js` and paste your values into `FIREBASE_CONFIG`.
7. Reload the page. The sync badge in the top-right will go from "local only" to "synced" once it's connected. Open the site in a different browser and your data will already be there.

Until you do this, everything still works — it just stays on the one browser
you're using (open Settings → Data → Export JSON any time as a manual backup).

## 3. Connect your Google Calendar

1. Open [Google Calendar](https://calendar.google.com) on desktop.
2. Settings (gear icon) → click your calendar's name under **Settings for my calendars**.
3. Scroll to **Integrate calendar** → copy the **Embed code**'s `src="..."` URL (or the "Public URL to this calendar").
   - Your calendar needs "Make available to public" turned on under **Access permissions** for this to work.
4. In Ascend., click the gear icon (Settings) or the "Connect Google Calendar" button on the Daily Calendar card, and paste the URL in.

## 4. Publish to GitHub Pages (`yourname.github.io`)

This folder is already a git repo with everything committed on branch `main`.
To publish it:

1. On GitHub, create a new repository.
   - For a **user site** (lives at `https://yourname.github.io`), the repo must be named exactly `yourname.github.io`.
   - For a **project site** instead (lives at `https://yourname.github.io/ascend/`), name it anything, e.g. `ascend`.
2. Point this repo at it and push:

   ```bash
   cd ascend
   git remote add origin https://github.com/yourname/REPO-NAME.git
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / root → Save.**
4. Give it a minute, then visit the URL GitHub shows you.

Because this is a static site, there's no backend to keep running and no
hosting cost — Firebase's free tier handles the sync, and GitHub Pages hosts
the files for free.

## Notes

- **Data model**: everything is stored as one JSON document (tasks, goals,
  habits, journal entries, etc.) both in `localStorage` and, once connected,
  in your Firestore `users/{yourUserId}` document.
- **Privacy**: Firestore rules restrict your document to only your anonymous
  auth UID — nobody else can read or write it, and there's no email/password
  to leak. Anyone with your site's URL can *use* their own separate Ascend.
  (they'd get their own anonymous UID and empty data) — nothing is shared
  between visitors.
- **Editing content**: the motivation quotes and reading snippets live in
  `js/data.js` — add, remove, or rewrite any of them freely.
- **No build step**: everything is plain HTML/CSS/JS. Edit, save, refresh.
