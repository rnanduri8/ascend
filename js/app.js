// ============================================================================
// Ascend. — application logic
// Vanilla JS. Firebase Firestore (optional) + localStorage cache.
// ============================================================================

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Date helpers
  // ---------------------------------------------------------------------
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function monthKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1); }
  function yearKey(d) { return "" + d.getFullYear(); }
  function weekKey(d) {
    // ISO-ish: Monday of the current week, as a date key
    const copy = new Date(d);
    const day = (copy.getDay() + 6) % 7; // 0 = Monday
    copy.setDate(copy.getDate() - day);
    return dateKey(copy);
  }
  function startOfWeek(d) {
    const copy = new Date(d);
    const day = (copy.getDay() + 6) % 7;
    copy.setDate(copy.getDate() - day);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }
  function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  const TODAY = new Date();
  const TODAY_KEY = dateKey(TODAY);
  const WEEK_KEY = weekKey(TODAY);
  const MONTH_KEY = monthKey(TODAY);
  const YEAR_KEY = yearKey(TODAY);

  // Simple deterministic hash so "today's" quote/reading is stable all day
  // but different from other days, without needing server logic.
  function dayHash(key, mod) {
    let h = 0;
    for (let i = 0; i < key.length; i++) { h = (h * 31 + key.charCodeAt(i)) >>> 0; }
    return h % mod;
  }

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const LS_KEY = "ascend_state_v1";

  function defaultState() {
    return {
      tasks: {},
      weeklyGoals: {},
      monthlyGoals: {},
      yearlyGoals: {},
      progressGoals: [],
      habits: [],
      habitLogs: {},
      journal: {},
      calendarUrl: "",
      interests: ["Stoicism", "Discipline & Habits", "Productivity"],
      readingState: {},
      quoteState: {}
    };
  }

  let state = loadLocal() || defaultState();
  let saveTimer = null;
  let firestoreDoc = null; // set once Firebase is ready
  let applyingRemote = false; // guards against write-loop when snapshot arrives

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed);
    } catch (e) { return null; }
  }

  function saveLocal() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* ignore quota errors */ }
  }

  function persist() {
    saveLocal();
    if (applyingRemote) return; // don't echo remote-triggered renders back up
    if (!firestoreDoc) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      firestoreDoc.set(state, { merge: false }).catch(function (err) {
        console.warn("Ascend: cloud save failed", err);
        setSyncStatus("err", "sync error");
      });
    }, 500);
  }

  // ---------------------------------------------------------------------
  // Firebase (optional — falls back to localStorage-only silently)
  // ---------------------------------------------------------------------
  const syncStatusEl = document.getElementById("syncStatus");
  function setSyncStatus(cls, text) {
    syncStatusEl.className = "sync-status " + cls;
    syncStatusEl.textContent = text;
  }

  function initFirebase() {
    const cfg = window.FIREBASE_CONFIG;
    const configured = cfg && cfg.apiKey && cfg.projectId;
    if (!configured) {
      setSyncStatus("", "local only");
      document.getElementById("firebaseStatusText").textContent =
        "Not connected — data is saved to this browser only. Add your Firebase config in js/firebase-config.js to sync across devices.";
      return;
    }
    try {
      firebase.initializeApp(cfg);
      setSyncStatus("", "connecting…");
      firebase.auth().signInAnonymously().catch(function (err) {
        console.warn("Ascend: auth failed", err);
        setSyncStatus("err", "auth error");
      });
      firebase.auth().onAuthStateChanged(function (user) {
        if (!user) return;
        const db = firebase.firestore();
        firestoreDoc = db.collection("users").doc(user.uid);
        document.getElementById("firebaseStatusText").textContent =
          "Connected — syncing to Firestore (user " + user.uid.slice(0, 8) + "…).";
        firestoreDoc.onSnapshot(function (snap) {
          if (!snap.exists) {
            // first run for this user — push current (likely local) state up
            firestoreDoc.set(state).catch(function () {});
            setSyncStatus("ok", "synced");
            return;
          }
          applyingRemote = true;
          state = Object.assign(defaultState(), snap.data());
          saveLocal();
          renderAll();
          applyingRemote = false;
          setSyncStatus("ok", "synced");
        }, function (err) {
          console.warn("Ascend: snapshot error", err);
          setSyncStatus("err", "sync error");
        });
      });
    } catch (e) {
      console.warn("Ascend: firebase init failed", e);
      setSyncStatus("err", "config error");
    }
  }

  // ---------------------------------------------------------------------
  // Generic checklist helper (tasks / weekly / monthly / yearly goals)
  // ---------------------------------------------------------------------
  function renderChecklist(listEl, items, labelEl, onToggle, onDelete, emptyTitle, emptySub) {
    listEl.innerHTML = "";
    if (!items || items.length === 0) {
      const li = document.createElement("li");
      li.style.border = "none";
      li.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state-title">' + (emptyTitle || "Nothing yet") + '</div>' +
          '<div class="empty-state-sub">' + (emptySub || "Add one above when you’re ready.") + '</div>' +
        '</div>';
      listEl.appendChild(li);
    } else {
      items.forEach(function (item) {
        const li = document.createElement("li");
        if (item.done) li.classList.add("done");

        const check = document.createElement("button");
        check.className = "check" + (item.done ? " done" : "");
        check.textContent = "✓";
        check.addEventListener("click", function () { onToggle(item.id); });

        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = item.text;

        const del = document.createElement("button");
        del.className = "del-btn";
        del.textContent = "✕";
        del.addEventListener("click", function () { onDelete(item.id); });

        li.appendChild(check);
        li.appendChild(text);
        li.appendChild(del);
        listEl.appendChild(li);
      });
    }
    if (labelEl) {
      const done = (items || []).filter(function (i) { return i.done; }).length;
      labelEl.textContent = done + "/" + (items || []).length;
    }
  }

  // ---------------------------------------------------------------------
  // Daily Task Planner
  // ---------------------------------------------------------------------
  const taskForm = document.getElementById("taskForm");
  const taskInput = document.getElementById("taskInput");
  const taskList = document.getElementById("taskList");
  const taskProgressLabel = document.getElementById("taskProgressLabel");

  function getTasks() { return state.tasks[TODAY_KEY] || []; }
  function setTasks(arr) { state.tasks[TODAY_KEY] = arr; persist(); }

  function renderTasks() {
    renderChecklist(taskList, getTasks(), taskProgressLabel,
      function toggle(id) {
        setTasks(getTasks().map(function (t) { return t.id === id ? Object.assign({}, t, { done: !t.done }) : t; }));
        renderTasks(); updateStreak();
      },
      function del(id) {
        setTasks(getTasks().filter(function (t) { return t.id !== id; }));
        renderTasks(); updateStreak();
      },
      "Nothing planned yet", "Add your first task for today.");
  }

  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const val = taskInput.value.trim();
    if (!val) return;
    setTasks(getTasks().concat([{ id: uid(), text: val, done: false }]));
    taskInput.value = "";
    renderTasks();
  });

  // ---------------------------------------------------------------------
  // Weekly Goals
  // ---------------------------------------------------------------------
  const weeklyForm = document.getElementById("weeklyForm");
  const weeklyInput = document.getElementById("weeklyInput");
  const weeklyList = document.getElementById("weeklyList");
  const weeklyProgressLabel = document.getElementById("weeklyProgressLabel");

  function getWeekly() { return state.weeklyGoals[WEEK_KEY] || []; }
  function setWeekly(arr) { state.weeklyGoals[WEEK_KEY] = arr; persist(); }

  function renderWeekly() {
    renderChecklist(weeklyList, getWeekly(), weeklyProgressLabel,
      function toggle(id) {
        setWeekly(getWeekly().map(function (g) { return g.id === id ? Object.assign({}, g, { done: !g.done }) : g; }));
        renderWeekly();
      },
      function del(id) {
        setWeekly(getWeekly().filter(function (g) { return g.id !== id; }));
        renderWeekly();
      },
      "No goals yet", "Add your first goal for this week.");
  }

  weeklyForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const val = weeklyInput.value.trim();
    if (!val) return;
    setWeekly(getWeekly().concat([{ id: uid(), text: val, done: false }]));
    weeklyInput.value = "";
    renderWeekly();
  });

  // ---------------------------------------------------------------------
  // Monthly / Yearly Goals (tabbed)
  // ---------------------------------------------------------------------
  const monthlyForm = document.getElementById("monthlyForm");
  const monthlyInput = document.getElementById("monthlyInput");
  const monthlyList = document.getElementById("monthlyList");
  const yearlyForm = document.getElementById("yearlyForm");
  const yearlyInput = document.getElementById("yearlyInput");
  const yearlyList = document.getElementById("yearlyList");
  const goalTabs = document.getElementById("goalTabs");

  function getMonthly() { return state.monthlyGoals[MONTH_KEY] || []; }
  function setMonthly(arr) { state.monthlyGoals[MONTH_KEY] = arr; persist(); }
  function getYearly() { return state.yearlyGoals[YEAR_KEY] || []; }
  function setYearly(arr) { state.yearlyGoals[YEAR_KEY] = arr; persist(); }

  function renderMonthly() {
    renderChecklist(monthlyList, getMonthly(), null,
      function toggle(id) { setMonthly(getMonthly().map(function (g) { return g.id === id ? Object.assign({}, g, { done: !g.done }) : g; })); renderMonthly(); },
      function del(id) { setMonthly(getMonthly().filter(function (g) { return g.id !== id; })); renderMonthly(); },
      "No goals yet", "Add your first goal for this month.");
  }
  function renderYearly() {
    renderChecklist(yearlyList, getYearly(), null,
      function toggle(id) { setYearly(getYearly().map(function (g) { return g.id === id ? Object.assign({}, g, { done: !g.done }) : g; })); renderYearly(); },
      function del(id) { setYearly(getYearly().filter(function (g) { return g.id !== id; })); renderYearly(); },
      "No goals yet", "Add your first goal for this year.");
  }

  monthlyForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const val = monthlyInput.value.trim();
    if (!val) return;
    setMonthly(getMonthly().concat([{ id: uid(), text: val, done: false }]));
    monthlyInput.value = ""; renderMonthly();
  });
  yearlyForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const val = yearlyInput.value.trim();
    if (!val) return;
    setYearly(getYearly().concat([{ id: uid(), text: val, done: false }]));
    yearlyInput.value = ""; renderYearly();
  });

  goalTabs.addEventListener("click", function (e) {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    const tab = btn.dataset.tab;
    goalTabs.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t === btn); });
    document.querySelectorAll(".goal-pane").forEach(function (p) { p.classList.toggle("hidden", p.dataset.pane !== tab); });
  });

  // ---------------------------------------------------------------------
  // Visual Goal Progress
  // ---------------------------------------------------------------------
  const progressList = document.getElementById("progressList");
  const addProgressGoalBtn = document.getElementById("addProgressGoalBtn");
  const progressGoalModal = document.getElementById("progressGoalModal");
  const progressNameInput = document.getElementById("progressNameInput");
  const progressTargetInput = document.getElementById("progressTargetInput");
  const progressUnitInput = document.getElementById("progressUnitInput");
  const progressSaveBtn = document.getElementById("progressSaveBtn");

  function renderProgress() {
    progressList.innerHTML = "";
    if (!state.progressGoals.length) {
      progressList.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state-title">No progress goals yet</div>' +
          '<div class="empty-state-sub">Click + New to add one, e.g. “Read 24 books this year.”</div>' +
        '</div>';
      return;
    }

    state.progressGoals.forEach(function (g) {
      const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;

      const wrap = document.createElement("div");
      wrap.className = "progress-item";

      const del = document.createElement("button");
      del.className = "del-btn"; del.textContent = "✕"; del.title = "Delete goal";
      del.addEventListener("click", function () { deleteProgressGoal(g.id); });
      wrap.appendChild(del);

      const head = document.createElement("div");
      head.className = "progress-item-head";
      const name = document.createElement("span");
      name.className = "progress-item-name";
      name.textContent = g.name;
      const val = document.createElement("span");
      val.className = "progress-item-val";
      val.textContent = g.current + " / " + g.target + (g.unit ? " " + g.unit : "");
      head.appendChild(name); head.appendChild(val);
      wrap.appendChild(head);

      const track = document.createElement("div");
      track.className = "progress-track";
      const fill = document.createElement("div");
      fill.className = "progress-fill";
      fill.style.width = pct + "%";
      track.appendChild(fill);
      wrap.appendChild(track);

      const foot = document.createElement("div");
      foot.className = "progress-item-foot";
      const pctLabel = document.createElement("span");
      pctLabel.className = "progress-pct";
      pctLabel.textContent = pct + "%";
      const controls = document.createElement("div");
      controls.className = "progress-controls";
      const minus = document.createElement("button"); minus.textContent = "–";
      minus.addEventListener("click", function () { updateProgressGoal(g.id, -1); });
      const plus = document.createElement("button"); plus.textContent = "+";
      plus.addEventListener("click", function () { updateProgressGoal(g.id, 1); });
      controls.appendChild(minus); controls.appendChild(plus);
      foot.appendChild(pctLabel); foot.appendChild(controls);
      wrap.appendChild(foot);

      progressList.appendChild(wrap);
    });
  }

  function updateProgressGoal(id, delta) {
    state.progressGoals = state.progressGoals.map(function (g) {
      if (g.id !== id) return g;
      const next = Math.max(0, Math.min(g.target, g.current + delta));
      return Object.assign({}, g, { current: next });
    });
    persist(); renderProgress();
  }
  function deleteProgressGoal(id) {
    state.progressGoals = state.progressGoals.filter(function (g) { return g.id !== id; });
    persist(); renderProgress();
  }

  addProgressGoalBtn.addEventListener("click", function () {
    progressNameInput.value = ""; progressTargetInput.value = ""; progressUnitInput.value = "";
    openModal(progressGoalModal);
  });
  progressSaveBtn.addEventListener("click", function () {
    const name = progressNameInput.value.trim();
    const target = parseFloat(progressTargetInput.value);
    if (!name || !target || target <= 0) return;
    state.progressGoals.push({ id: uid(), name: name, target: target, current: 0, unit: progressUnitInput.value.trim() });
    persist(); renderProgress(); closeModal(progressGoalModal);
  });

  // ---------------------------------------------------------------------
  // Habit Tracker
  // ---------------------------------------------------------------------
  const habitGrid = document.getElementById("habitGrid");
  const addHabitBtn = document.getElementById("addHabitBtn");
  const habitModal = document.getElementById("habitModal");
  const habitNameInput = document.getElementById("habitNameInput");
  const habitSaveBtn = document.getElementById("habitSaveBtn");
  const habitColorSwatches = document.getElementById("habitColorSwatches");
  const HABIT_COLORS = ["#8291ff", "#4fae8a", "#c9974a", "#d9686c", "#c084fc", "#5eb8d9"];
  let selectedHabitColor = HABIT_COLORS[0];

  HABIT_COLORS.forEach(function (c, i) {
    const sw = document.createElement("div");
    sw.className = "swatch" + (i === 0 ? " active" : "");
    sw.style.background = c;
    sw.addEventListener("click", function () {
      selectedHabitColor = c;
      habitColorSwatches.querySelectorAll(".swatch").forEach(function (s) { s.classList.remove("active"); });
      sw.classList.add("active");
    });
    habitColorSwatches.appendChild(sw);
  });

  function weekDates() {
    const start = startOfWeek(TODAY);
    const days = [];
    for (let i = 0; i < 7; i++) days.push(addDays(start, i));
    return days;
  }
  function logKey(habitId, dKey) { return habitId + "|" + dKey; }
  function isLogged(habitId, dKey) { return !!state.habitLogs[logKey(habitId, dKey)]; }
  function toggleLog(habitId, dKey) {
    const k = logKey(habitId, dKey);
    if (state.habitLogs[k]) delete state.habitLogs[k]; else state.habitLogs[k] = true;
    persist();
  }
  function habitStreak(habitId) {
    let streak = 0;
    let cursor = new Date(TODAY);
    // if today not logged yet, start counting from yesterday so an unbroken
    // streak isn't reset to 0 just because the day isn't over
    if (!isLogged(habitId, dateKey(cursor))) cursor = addDays(cursor, -1);
    while (isLogged(habitId, dateKey(cursor))) { streak++; cursor = addDays(cursor, -1); }
    return streak;
  }

  function renderHabits() {
    habitGrid.innerHTML = "";
    const days = weekDates();
    const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

    const head = document.createElement("div");
    head.className = "habit-row head";
    head.appendChild(document.createElement("span"));
    dayLabels.forEach(function (l) { const s = document.createElement("span"); s.textContent = l; head.appendChild(s); });
    const streakHead = document.createElement("span"); streakHead.textContent = "🔥";
    head.appendChild(streakHead);
    head.appendChild(document.createElement("span"));
    habitGrid.appendChild(head);

    if (!state.habits.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.style.padding = "2px 18px 16px";
      empty.innerHTML =
        '<div class="empty-state-title">No habits yet</div>' +
        '<div class="empty-state-sub">Click + New to start tracking one.</div>';
      habitGrid.appendChild(empty);
      return;
    }

    state.habits.forEach(function (habit) {
      const row = document.createElement("div");
      row.className = "habit-row";

      const nameWrap = document.createElement("div");
      nameWrap.className = "habit-name";
      const dot = document.createElement("span");
      dot.className = "habit-dot-swatch";
      dot.style.background = habit.color;
      const nameText = document.createElement("span");
      nameText.textContent = habit.name;
      nameWrap.appendChild(dot); nameWrap.appendChild(nameText);
      row.appendChild(nameWrap);

      days.forEach(function (d) {
        const dKey = dateKey(d);
        const cell = document.createElement("button");
        cell.className = "habit-cell" + (isLogged(habit.id, dKey) ? " filled" : "") + (dKey === TODAY_KEY ? " today" : "");
        if (isLogged(habit.id, dKey)) cell.style.background = habit.color;
        cell.addEventListener("click", function () {
          toggleLog(habit.id, dKey);
          renderHabits();
          updateStreak();
        });
        row.appendChild(cell);
      });

      const streakEl = document.createElement("span");
      streakEl.className = "habit-streak";
      streakEl.textContent = habitStreak(habit.id);
      row.appendChild(streakEl);

      const delBtn = document.createElement("button");
      delBtn.className = "habit-del";
      delBtn.textContent = "✕";
      delBtn.title = "Delete habit";
      delBtn.addEventListener("click", function () {
        state.habits = state.habits.filter(function (h) { return h.id !== habit.id; });
        persist(); renderHabits();
      });
      row.appendChild(delBtn);

      habitGrid.appendChild(row);
    });
  }

  addHabitBtn.addEventListener("click", function () {
    habitNameInput.value = "";
    selectedHabitColor = HABIT_COLORS[0];
    habitColorSwatches.querySelectorAll(".swatch").forEach(function (s, i) { s.classList.toggle("active", i === 0); });
    openModal(habitModal);
  });
  habitSaveBtn.addEventListener("click", function () {
    const name = habitNameInput.value.trim();
    if (!name) return;
    state.habits.push({ id: uid(), name: name, color: selectedHabitColor });
    persist(); renderHabits(); closeModal(habitModal);
  });

  // ---------------------------------------------------------------------
  // Daily Journal
  // ---------------------------------------------------------------------
  const journalText = document.getElementById("journalText");
  const journalHintLabel = document.getElementById("journalHintLabel");
  const journalHistoryBtn = document.getElementById("journalHistoryBtn");
  const journalHistoryModal = document.getElementById("journalHistoryModal");
  const journalHistoryBody = document.getElementById("journalHistoryBody");
  let journalDebounce = null;

  function renderJournal() {
    journalText.value = state.journal[TODAY_KEY] || "";
  }
  journalText.addEventListener("input", function () {
    clearTimeout(journalDebounce);
    journalDebounce = setTimeout(function () {
      state.journal[TODAY_KEY] = journalText.value;
      persist();
      journalHintLabel.textContent = "Saved just now";
    }, 400);
  });
  journalHistoryBtn.addEventListener("click", function () {
    journalHistoryBody.innerHTML = "";
    const keys = Object.keys(state.journal).filter(function (k) { return state.journal[k] && state.journal[k].trim(); }).sort().reverse();
    if (!keys.length) {
      journalHistoryBody.innerHTML = '<div class="empty-state"><div class="empty-state-title">No journal entries yet</div></div>';
    } else {
      keys.forEach(function (k) {
        const item = document.createElement("div");
        item.className = "journal-history-item";
        const d = document.createElement("div"); d.className = "journal-history-date"; d.textContent = k;
        const t = document.createElement("div"); t.className = "journal-history-text"; t.textContent = state.journal[k];
        item.appendChild(d); item.appendChild(t);
        journalHistoryBody.appendChild(item);
      });
    }
    openModal(journalHistoryModal);
  });

  // ---------------------------------------------------------------------
  // Daily Motivation Quote
  // ---------------------------------------------------------------------
  const quoteText = document.getElementById("quoteText");
  const quoteAuthor = document.getElementById("quoteAuthor");
  const shuffleQuoteBtn = document.getElementById("shuffleQuoteBtn");

  // Cycles to the next quote every time the page loads (not stable per-day
  // like the reading pick) — advanced once here, at script start.
  let quoteIndex = (typeof state.quoteIndex === "number" ? state.quoteIndex + 1 : dayHash(TODAY_KEY, QUOTES.length)) % QUOTES.length;
  state.quoteIndex = quoteIndex;
  saveLocal();

  function renderQuote() {
    const q = QUOTES[quoteIndex % QUOTES.length];
    quoteText.textContent = "“" + q.text + "”";
    quoteAuthor.textContent = "— " + q.author;
  }
  shuffleQuoteBtn.addEventListener("click", function () {
    let next = Math.floor(Math.random() * QUOTES.length);
    if (next === quoteIndex && QUOTES.length > 1) next = (next + 1) % QUOTES.length;
    quoteIndex = next;
    state.quoteIndex = next;
    persist(); renderQuote();
  });

  // ---------------------------------------------------------------------
  // Daily Reading
  // ---------------------------------------------------------------------
  const readingTag = document.getElementById("readingTag");
  const readingTitle = document.getElementById("readingTitle");
  const readingBody = document.getElementById("readingBody");
  const readingContinueBtn = document.getElementById("readingContinueBtn");
  const readingShuffleBtn = document.getElementById("readingShuffleBtn");
  const readingDoneCheck = document.getElementById("readingDoneCheck");
  const readingInterestsBtn = document.getElementById("readingInterestsBtn");
  const interestChecks = document.getElementById("interestChecks");
  const READING_EXCERPT_LEN = 190;
  let readingExpanded = false;

  function matchingReadings() {
    const active = state.interests || [];
    const matched = READING_BANK.filter(function (r) { return r.tags.some(function (t) { return active.indexOf(t) !== -1; }); });
    return matched.length ? matched : READING_BANK;
  }

  function currentReadingEntry() {
    const saved = state.readingState[TODAY_KEY];
    const pool = matchingReadings();
    if (saved && pool.some(function (r) { return r.id === saved.id; })) {
      return { entry: pool.filter(function (r) { return r.id === saved.id; })[0], done: !!saved.done };
    }
    const idx = dayHash(TODAY_KEY, pool.length);
    const entry = pool[idx];
    state.readingState[TODAY_KEY] = { id: entry.id, done: false };
    persist();
    return { entry: entry, done: false };
  }

  function renderReading() {
    const cur = currentReadingEntry();
    readingTag.textContent = cur.entry.tags[0];
    readingTitle.textContent = cur.entry.title;
    const full = cur.entry.body;
    const needsTruncation = full.length > READING_EXCERPT_LEN;
    if (readingExpanded || !needsTruncation) {
      readingBody.textContent = full;
      readingContinueBtn.classList.add("hidden");
    } else {
      readingBody.textContent = full.slice(0, READING_EXCERPT_LEN).replace(/\s+\S*$/, "") + "…";
      readingContinueBtn.classList.remove("hidden");
      readingContinueBtn.textContent = "Continue reading →";
    }
    readingDoneCheck.checked = cur.done;
  }
  readingContinueBtn.addEventListener("click", function () {
    readingExpanded = true;
    renderReading();
  });
  readingShuffleBtn.addEventListener("click", function () {
    const pool = matchingReadings();
    const current = state.readingState[TODAY_KEY] ? state.readingState[TODAY_KEY].id : null;
    let candidate = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) { while (candidate.id === current) candidate = pool[Math.floor(Math.random() * pool.length)]; }
    state.readingState[TODAY_KEY] = { id: candidate.id, done: false };
    readingExpanded = false;
    persist(); renderReading();
  });
  readingDoneCheck.addEventListener("change", function () {
    const rs = state.readingState[TODAY_KEY] || {};
    rs.done = readingDoneCheck.checked;
    state.readingState[TODAY_KEY] = rs;
    persist(); updateStreak();
  });

  function renderInterestChips() {
    interestChecks.innerHTML = "";
    READING_INTERESTS.forEach(function (topic) {
      const chip = document.createElement("div");
      chip.className = "chip" + (state.interests.indexOf(topic) !== -1 ? " active" : "");
      chip.textContent = topic;
      chip.addEventListener("click", function () {
        const idx = state.interests.indexOf(topic);
        if (idx === -1) state.interests.push(topic); else state.interests.splice(idx, 1);
        persist();
        chip.classList.toggle("active");
        delete state.readingState[TODAY_KEY];
        renderReading();
      });
      interestChecks.appendChild(chip);
    });
  }
  readingInterestsBtn.addEventListener("click", function () { openModal(document.getElementById("settingsModal")); });

  // ---------------------------------------------------------------------
  // Calendar — a native, dark, custom month grid. Google's iframe embed
  // can't be recolored (cross-origin, no dark-mode option), so instead of
  // visually embedding it, Ascend. renders its own month view and links
  // out to the connected calendar for the full view / event details.
  // ---------------------------------------------------------------------
  const calendarWidget = document.getElementById("calendarWidget");
  const calendarModal = document.getElementById("calendarModal");
  const calendarUrlInput = document.getElementById("calendarUrlInput");
  const calendarUrlInput2 = document.getElementById("calendarUrlInput2");
  const calendarSaveBtn = document.getElementById("calendarSaveBtn");
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  let calendarViewDate = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);

  function renderCalendar() {
    calendarUrlInput.value = state.calendarUrl || "";

    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
    const gridStart = addDays(firstOfMonth, -startOffset);

    let html = '<div class="calendar-toolbar">' +
      '<span class="calendar-month-label">' + MONTH_NAMES[month] + ' ' + year + '</span>' +
      '<div class="calendar-nav">' +
        '<button class="icon-btn btn-small" id="calPrevBtn">‹</button>' +
        '<button class="icon-btn btn-small" id="calTodayBtn">•</button>' +
        '<button class="icon-btn btn-small" id="calNextBtn">›</button>' +
      '</div>' +
    '</div>';

    html += '<div class="calendar-grid">';
    ["M","T","W","T","F","S","S"].forEach(function (d) { html += '<div class="calendar-weekday">' + d + '</div>'; });
    for (let i = 0; i < 42; i++) {
      const d = addDays(gridStart, i);
      const isOtherMonth = d.getMonth() !== month;
      const isToday = dateKey(d) === TODAY_KEY;
      html += '<div class="calendar-cell' + (isOtherMonth ? ' other-month' : '') + (isToday ? ' today' : '') + '">' + d.getDate() + '</div>';
    }
    html += '</div>';

    html += '<div class="calendar-footer">' +
      '<span class="calendar-footer-hint">' + (state.calendarUrl ? "Connected" : "No calendar connected") + '</span>' +
      (state.calendarUrl
        ? '<a class="btn-secondary" href="' + state.calendarUrl.replace(/"/g, "&quot;") + '" target="_blank" rel="noopener">Open Google Calendar</a>'
        : '<button class="btn-secondary" id="calConnectBtn">Connect</button>') +
    '</div>';

    calendarWidget.innerHTML = html;

    document.getElementById("calPrevBtn").addEventListener("click", function () {
      calendarViewDate = new Date(year, month - 1, 1); renderCalendar();
    });
    document.getElementById("calNextBtn").addEventListener("click", function () {
      calendarViewDate = new Date(year, month + 1, 1); renderCalendar();
    });
    document.getElementById("calTodayBtn").addEventListener("click", function () {
      calendarViewDate = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); renderCalendar();
    });
    const connectBtn = document.getElementById("calConnectBtn");
    if (connectBtn) connectBtn.addEventListener("click", function () {
      calendarUrlInput2.value = state.calendarUrl || "";
      openModal(calendarModal);
    });
  }
  function saveCalendarUrl(url) {
    state.calendarUrl = url.trim();
    persist(); renderCalendar();
  }
  calendarSaveBtn.addEventListener("click", function () {
    saveCalendarUrl(calendarUrlInput2.value);
    closeModal(calendarModal);
  });
  calendarUrlInput.addEventListener("change", function () { saveCalendarUrl(calendarUrlInput.value); });

  // ---------------------------------------------------------------------
  // Streak badge (top bar) — consecutive days with any habit logged
  // or, if no habits exist yet, any task completed
  // ---------------------------------------------------------------------
  const streakBadge = document.getElementById("streakBadge");
  function updateStreak() {
    let best = 0;
    if (state.habits.length) {
      state.habits.forEach(function (h) { best = Math.max(best, habitStreak(h.id)); });
    } else {
      // fallback: streak of days with at least one completed task
      let streak = 0; let cursor = new Date(TODAY);
      function dayHasCompletedTask(dKey) { return (state.tasks[dKey] || []).some(function (t) { return t.done; }); }
      if (!dayHasCompletedTask(dateKey(cursor))) cursor = addDays(cursor, -1);
      while (dayHasCompletedTask(dateKey(cursor))) { streak++; cursor = addDays(cursor, -1); }
      best = streak;
    }
    streakBadge.textContent = (best > 0 ? "🔥 " : "") + best + " day" + (best === 1 ? "" : "s") + " streak";
    updateSummaryStrip();
  }

  // ---------------------------------------------------------------------
  // Header greeting + compact summary strip
  // ---------------------------------------------------------------------
  function updateSummaryStrip() {
    const el = document.getElementById("summaryStrip");
    if (!el) return;
    const tasksLeft = getTasks().filter(function (t) { return !t.done; }).length;
    const habitsLeft = state.habits.filter(function (h) { return !isLogged(h.id, TODAY_KEY); }).length;
    const goalsInProgress = getWeekly().filter(function (g) { return !g.done; }).length;
    const parts = [];
    parts.push(tasksLeft + (tasksLeft === 1 ? " task" : " tasks") + " left today");
    if (state.habits.length) parts.push(habitsLeft + (habitsLeft === 1 ? " habit" : " habits") + " left today");
    if (getWeekly().length) parts.push(goalsInProgress + (goalsInProgress === 1 ? " goal" : " goals") + " in progress");
    el.innerHTML = parts.join('<span class="dot">·</span>');
  }

  // ---------------------------------------------------------------------
  // Modals (generic open/close)
  // ---------------------------------------------------------------------
  function openModal(el) { el.classList.add("open"); }
  function closeModal(el) { el.classList.remove("open"); }
  document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(overlay); });
    overlay.querySelectorAll("[data-close]").forEach(function (btn) { btn.addEventListener("click", function () { closeModal(overlay); }); });
  });
  document.getElementById("settingsBtn").addEventListener("click", function () { openModal(document.getElementById("settingsModal")); });

  // ---------------------------------------------------------------------
  // Export / Import
  // ---------------------------------------------------------------------
  document.getElementById("exportDataBtn").addEventListener("click", function () {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ascend-backup-" + TODAY_KEY + ".json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  document.getElementById("importDataInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(reader.result);
        state = Object.assign(defaultState(), parsed);
        persist(); renderAll();
      } catch (err) { alert("Could not read that file — make sure it's a Ascend. export."); }
    };
    reader.readAsText(file);
  });

  // ---------------------------------------------------------------------
  // Top bar: greeting + date
  // ---------------------------------------------------------------------
  document.getElementById("todayDate").textContent = TODAY.toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric"
  });
  (function setGreeting() {
    const hour = TODAY.getHours();
    const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    document.getElementById("greetingText").textContent = "Good " + part + ".";
  })();

  // ---------------------------------------------------------------------
  // Render everything
  // ---------------------------------------------------------------------
  function renderAll() {
    renderTasks();
    renderWeekly();
    renderMonthly();
    renderYearly();
    renderProgress();
    renderHabits();
    renderJournal();
    renderQuote();
    renderInterestChips();
    renderReading();
    renderCalendar();
    updateStreak();
  }

  renderAll();
  initFirebase();
})();
