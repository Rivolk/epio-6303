/* ==========================================================================
   ЭПиО 6303 — общий код для всех страниц.
   Данные сайта лежат в папке data/, этот файл при обновлении трогать не нужно.
   ========================================================================== */

(function () {
  "use strict";

  const TZ = "Asia/Tashkent";
  const TZ_OFFSET = "+05:00"; // В Узбекистане нет перехода на летнее время

  /* ---------- Иконки (в subjects.json указывается имя из этого списка) ---------- */

  const ICONS = {
    // предметы
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/><path d="M16 8h4v4"/>',
    scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    sigma: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    landmark: '<path d="M3 21h18M5 18v-7M9.5 18v-7M14.5 18v-7M19 18v-7M12 3l9 5H3z"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    dumbbell: '<path d="M6.5 6.5 17.5 17.5M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/>',
    laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
    pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    flask: '<path d="M10 2v7.31M14 9.3V2M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0M5.52 16h12.96"/>',
    pen: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    // интерфейс
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    coffee: '<path d="M10 2v2M14 2v2M6 2v2M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>'
  };

  function icon(name, cls) {
    const body = ICONS[name] || ICONS.file;
    return '<svg class="icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------- Загрузка данных ---------- */

  async function loadJSON(path) {
    let response;
    try {
      response = await fetch(path, { cache: "no-cache" });
    } catch (e) {
      throw new Error(location.protocol === "file:"
        ? "Сайт открыт как файл. Запустите «Открыть сайт локально.bat» — так браузер сможет прочитать данные."
        : "Не удалось загрузить " + path + ". Проверьте подключение к интернету.");
    }
    if (!response.ok) throw new Error("Файл " + path + " не найден (ошибка " + response.status + ").");
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error("Ошибка в файле " + path + ": " + e.message + ". Скорее всего, пропущена запятая или кавычка.");
    }
  }

  let dataPromise = null;
  function loadData() {
    if (dataPromise) return dataPromise;
    dataPromise = Promise.all([
      loadJSON("data/subjects.json"),
      loadJSON("data/lectures.json"),
      loadJSON("data/schedule.json")
    ]).then(function ([subjectsFile, lecturesFile, schedule]) {
      const subjects = subjectsFile.subjects || [];
      const subjectMap = {};
      subjects.forEach(function (s) { subjectMap[s.id] = s; });
      const lectures = (lecturesFile.lectures || []).slice().sort(function (a, b) {
        return (b.date || "").localeCompare(a.date || "") || (b.topic || 0) - (a.topic || 0);
      });
      return { group: subjectsFile.group || {}, subjects, subjectMap, lectures, schedule: normalizeWeek(schedule) };
    });
    return dataPromise;
  }

  function loadArchiveIndex() {
    return loadJSON("data/schedule-archive/index.json")
      .then(function (d) { return (d.weeks || []).map(function (w) { return typeof w === "string" ? w : w.weekStart; }).sort().reverse(); })
      .catch(function () { return []; });
  }

  function loadArchiveWeek(weekStart) {
    return loadJSON("data/schedule-archive/" + weekStart + ".json").then(normalizeWeek);
  }

  function normalizeWeek(week) {
    week = week || {};
    const days = (week.days || []).slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    days.forEach(function (day) {
      day.lessons = (day.lessons || []).slice().sort(function (a, b) { return a.start.localeCompare(b.start); });
    });
    return { weekStart: week.weekStart || (days[0] && days[0].date) || "", note: week.note || "", days };
  }

  function getSubject(data, id) {
    return data.subjectMap[id] || { id: id, name: id || "Без названия", teacher: "", color: "#64748b", icon: "file" };
  }

  /* ---------- Время (Asia/Tashkent) ---------- */

  // Для проверки можно открыть страницу с ?now=2026-09-28T09:30 — время по Ташкенту
  let timeShift = 0;
  (function () {
    const param = new URLSearchParams(location.search).get("now");
    if (!param) return;
    const t = Date.parse(param.length <= 16 ? param + ":00" + TZ_OFFSET : param);
    if (!isNaN(t)) timeShift = t - Date.now();
  })();

  function now() { return Date.now() + timeShift; }

  function isoInTZ(ms) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
  }
  function todayISO() { return isoInTZ(now()); }

  function at(date, time) { return Date.parse(date + "T" + (time || "00:00") + ":00" + TZ_OFFSET); }

  function addDays(iso, n) { return isoInTZ(at(iso, "12:00") + n * 86400000); }

  function fmtDate(iso, options) {
    return new Intl.DateTimeFormat("ru-RU", Object.assign({ timeZone: TZ }, options)).format(new Date(at(iso, "12:00")));
  }
  function weekday(iso) { return fmtDate(iso, { weekday: "long" }); }
  function weekdayShort(iso) { return fmtDate(iso, { weekday: "short" }).replace(".", ""); }
  function dayMonth(iso) { return fmtDate(iso, { day: "numeric", month: "long" }); }
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function weekRange(week) {
    if (!week.days.length) return "";
    const first = week.days[0].date;
    const last = week.days[week.days.length - 1].date;
    const sameMonth = first.slice(0, 7) === last.slice(0, 7);
    return (sameMonth ? fmtDate(first, { day: "numeric" }) : dayMonth(first)) + " – " + dayMonth(last);
  }

  function relativeDay(iso) {
    const today = todayISO();
    if (iso === today) return "Сегодня";
    if (iso === addDays(today, 1)) return "Завтра";
    if (iso === addDays(today, -1)) return "Вчера";
    return capitalize(weekday(iso));
  }

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  // Обратный отсчёт: «2 д 4 ч», «1 ч 12 мин», «12:05»
  function countdownHTML(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = function (n) { return String(n).padStart(2, "0"); };
    if (d > 0) return d + "<small>д</small>" + h + "<small>ч</small>" + m + "<small>мин</small>";
    if (h > 0) return h + "<small>ч</small>" + pad(m) + "<small>мин</small>";
    return pad(m) + ":" + pad(s);
  }

  function durationText(ms) {
    const mins = Math.max(1, Math.round(ms / 60000));
    if (mins < 60) return mins + " мин";
    const h = Math.floor(mins / 60), m = mins % 60;
    return h + " ч" + (m ? " " + m + " мин" : "");
  }

  /* ---------- Пары ---------- */

  function lessonType(type) {
    const t = String(type || "").toLowerCase();
    if (t.startsWith("лек") || t === "lecture") return { label: "Лекция", cls: "tag-lecture" };
    if (t.startsWith("практ") || t === "practice" || t.startsWith("семин")) return { label: "Практика", cls: "" };
    if (!t || t === "другое" || t === "other") return null;
    return { label: capitalize(type), cls: "" };
  }

  // Плоский список всех пар недели с абсолютным временем
  function flattenWeek(week) {
    const list = [];
    week.days.forEach(function (day) {
      if (day.dayOff) return;
      day.lessons.forEach(function (lesson) {
        list.push({ day: day, lesson: lesson, start: at(day.date, lesson.start), end: at(day.date, lesson.end) });
      });
    });
    return list.sort(function (a, b) { return a.start - b.start; });
  }

  function lessonState(item, t) {
    if (t >= item.end) return "past";
    if (t >= item.start) return "now";
    return "future";
  }

  function subjectStyle(subject) { return 'style="--c:' + esc(subject.color || "#64748b") + '"'; }

  function chip(subject, size) {
    return '<span class="chip' + (size ? " chip-" + size : "") + '" ' + subjectStyle(subject) + ">" + icon(subject.icon) + "</span>";
  }

  function lessonHTML(data, lesson, state) {
    const subject = getSubject(data, lesson.subject);
    const type = lessonType(lesson.type);
    const teacher = lesson.teacher || subject.teacher;
    const tags = [];
    if (state === "now") tags.push('<span class="tag tag-live">Идёт</span>');
    if (lesson.pair) tags.push('<span class="tag tnum">' + esc(lesson.pair) + " пара</span>");
    if (type) tags.push('<span class="tag ' + type.cls + '">' + type.label + "</span>");
    const meta = [];
    if (lesson.room) meta.push("<span>" + icon("pin") + esc(lesson.room) + "</span>");
    if (teacher) meta.push("<span>" + icon("user") + esc(teacher) + "</span>");
    if (lesson.note) meta.push("<span>" + icon("info") + esc(lesson.note) + "</span>");
    return (
      '<div class="lesson' + (state ? " is-" + state : "") + '">' +
        '<div class="lesson-time"><b>' + esc(lesson.start) + "</b><span>" + esc(lesson.end) + "</span></div>" +
        '<div class="lesson-body">' +
          chip(subject, "sm") +
          '<div class="lesson-main">' +
            '<div class="lesson-title">' + esc(subject.short || subject.name) + "</div>" +
            (tags.length ? '<div class="lesson-tags">' + tags.join("") + "</div>" : "") +
            (meta.length ? '<div class="lesson-meta">' + meta.join("") + "</div>" : "") +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  /* ---------- Лекции ---------- */

  function encodePath(path) { return String(path || "").split("/").map(encodeURIComponent).join("/"); }
  function pdfPath(lecture) { return lecture.pdf || String(lecture.file || "").replace(/\.pptx?$/i, ".pdf"); }
  function viewerURL(lecture) { return "viewer.html?file=" + encodeURIComponent(lecture.file || lecture.pdf); }
  function extOf(path) { const m = /\.([a-z0-9]+)$/i.exec(path || ""); return m ? m[1].toLowerCase() : ""; }

  function lectureHTML(data, lecture, options) {
    options = options || {};
    const subject = getSubject(data, lecture.subject);
    const hl = options.highlight || esc;
    const ext = extOf(lecture.file);
    const kicker = [];
    if (lecture.topic != null && lecture.topic !== "") kicker.push("Тема " + esc(lecture.topic));
    if (lecture.date) kicker.push(dayMonth(lecture.date));
    const hasOriginal = lecture.file && ext !== "pdf";
    return (
      '<div class="lecture">' +
        '<div class="lecture-info">' +
          (options.hideChip ? "" : chip(subject)) +
          '<div class="lecture-text">' +
            (kicker.length ? '<div class="lecture-kicker">' + kicker.join(" · ") + "</div>" : "") +
            '<div class="lecture-title">' + hl(lecture.title) + "</div>" +
            (options.hideSubject ? "" : '<div class="lecture-sub">' + hl(subject.short || subject.name) + "</div>") +
          "</div>" +
        "</div>" +
        '<div class="lecture-actions">' +
          '<a class="btn btn-primary btn-sm" href="' + esc(viewerURL(lecture)) + '">' + icon("eye") + "Открыть</a>" +
          (hasOriginal
            ? '<a class="btn btn-sm" href="' + esc(encodePath(lecture.file)) + '" download>' + icon("download") + "Скачать ." + esc(ext) + "</a>"
            : "") +
        "</div>" +
      "</div>"
    );
  }

  /* ---------- Поиск ---------- */

  function normalize(s) {
    return String(s || "").toLowerCase().replace(/ё/g, "е").replace(/[«»"'.,()]/g, " ").replace(/\s+/g, " ").trim();
  }

  /* ---------- Раскладка страницы ---------- */

  const NAV = [
    { href: "index.html", id: "home", label: "Главная", icon: "home" },
    { href: "schedule.html", id: "schedule", label: "Расписание", icon: "calendar" },
    { href: "subjects.html", id: "subjects", label: "Предметы", icon: "grid" },
    { href: "search.html", id: "search", label: "Поиск", icon: "search" }
  ];

  function initLayout(pageId) {
    const current = function (item) { return item.id === pageId ? ' aria-current="page"' : ""; };
    const header = document.createElement("header");
    header.className = "header";
    header.innerHTML =
      '<div class="header-inner">' +
        '<a class="brand" href="index.html" aria-label="ЭПиО 6303 — на главную">' +
          '<span class="brand-mark">6303</span>' +
          '<span><span class="brand-name">ЭПиО 6303</span><span class="brand-sub">1 курс · РЭУ им. Плеханова</span></span>' +
        "</a>" +
        '<nav class="nav-desktop" aria-label="Разделы">' +
          NAV.map(function (i) { return '<a href="' + i.href + '"' + current(i) + ">" + i.label + "</a>"; }).join("") +
        "</nav>" +
        '<div class="header-actions">' +
          '<button class="icon-btn theme-toggle" type="button" aria-label="Сменить тему" title="Светлая / тёмная тема">' +
            icon("sun", "icon-sun") + icon("moon", "icon-moon") +
          "</button>" +
        "</div>" +
      "</div>";
    document.body.prepend(header);

    const tabbar = document.createElement("nav");
    tabbar.className = "tabbar";
    tabbar.setAttribute("aria-label", "Разделы");
    tabbar.innerHTML = NAV.map(function (i) {
      return '<a href="' + i.href + '"' + current(i) + ">" + icon(i.icon) + "<span>" + i.label + "</span></a>";
    }).join("");
    document.body.append(tabbar);

    header.querySelector(".theme-toggle").addEventListener("click", toggleTheme);
    const onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 4); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Тема ---------- */

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  function systemTheme() { return darkQuery.matches ? "dark" : "light"; }
  function storedTheme() { try { return localStorage.getItem("theme"); } catch (e) { return null; } }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      // Если выбранная тема совпадает с системной — снова следуем за системой
      if (next === systemTheme()) localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch (e) { /* приватный режим — просто не запоминаем */ }
  }

  darkQuery.addEventListener("change", function () {
    if (!storedTheme()) document.documentElement.dataset.theme = systemTheme();
  });

  /* ---------- Мелочи ---------- */

  let toastTimer;
  function toast(message) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.append(el);
    }
    el.textContent = message;
    requestAnimationFrame(function () { el.classList.add("is-visible"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-visible"); }, 2200);
  }

  function errorHTML(err) {
    return '<div class="card empty">' + icon("alert") + "<b>Не получилось загрузить данные</b>" + esc(err && err.message ? err.message : err) + "</div>";
  }

  window.App = {
    TZ, icon, esc, loadJSON, loadData, loadArchiveIndex, loadArchiveWeek, normalizeWeek, getSubject,
    now, todayISO, at, addDays, fmtDate, weekday, weekdayShort, dayMonth, capitalize, weekRange, relativeDay,
    plural, countdownHTML, durationText, lessonType, flattenWeek, lessonState, chip, subjectStyle, lessonHTML,
    encodePath, pdfPath, viewerURL, extOf, lectureHTML, normalize, initLayout, toast, errorHTML
  };
})();
