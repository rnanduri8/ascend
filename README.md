# Ascend.

A single-page, dark/minimalist personal operating system: daily task
planner, Google Calendar view, weekly/monthly/yearly goals, a visual
progress tracker, a habit tracker, a daily journal, a rotating motivation
quote, and a daily reading recommendation — all in one page.

It's a fully static site (plain HTML/CSS/JS, no build step, no backend,
no account) — everything you enter is saved straight to your browser's
local storage. This repo is already set up as a git repository, ready to
push to GitHub Pages.

## 1. Run it locally

```bash
cd ascend
python3 -m http.server 8080
# open http://localhost:8080
```

Or just double-click `index.html` — it works opened directly from disk too.

## 2. Connect your Google Calendar

1. Open [Google Calendar](https://calendar.google.com) on desktop.
2. Settings (gear icon) → click your calendar's name under **Settings for my calendars**.
3. Scroll to **Integrate calendar** → copy the **Embed code**'s `src="..."` URL (or the "Public URL to this calendar").
   - Your calendar needs "Make available to public" turned on under **Access permissions** for this to work.
4. In Ascend., click the gear icon (Settings) or the "Connect Google Calendar" button on the Daily Calendar card, and paste the URL in.

## 3. Publish to GitHub Pages (`yourname.github.io`)

This folder is already a git repo with everything committed. To publish it:

1. On GitHub, create a new repository.
   - For a **user site** (lives at `https://yourname.github.io`), the repo must be named exactly `yourname.github.io`.
   - For a **project site** instead (lives at `https://yourname.github.io/ascend/`), name it anything, e.g. `ascend`.
2. Point this repo at it and push:

   ```bash
   cd ascend
   git remote add origin https://github.com/yourname/REPO-NAME.git
   git branch -M main
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / root → Save.**
4. Give it a minute, then visit the URL GitHub shows you.

Because this is a static site, there's no hosting cost and nothing to keep
running — GitHub Pages just serves the files.

## Notes

- **Data lives in this browser only.** Nothing leaves your machine, there's
  no login, and there's no server — which also means data doesn't sync
  between devices or browsers. Use Settings → Data → **Export JSON**
  regularly as a backup, and **Import JSON** to restore it (or move it to
  another browser/device).
- **Editing content**: the motivation quotes and reading snippets live in
  `js/data.js` — add, remove, or rewrite any of them freely.
- **No build step**: everything is plain HTML/CSS/JS. Edit, save, refresh.
- Want cross-device sync later? The data model is a single JSON blob
  (see `defaultState()` in `js/app.js`), so it's a small lift to wire up
  a backend of your choice — but it isn't required to use or publish this
  as-is.
