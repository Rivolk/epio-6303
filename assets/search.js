/* Поиск по лекциям и предметам — работает прямо в браузере */
(function () {
  "use strict";
  const A = window.App;
  A.initLayout("search");

  const $q = document.getElementById("q");
  const $clear = document.getElementById("clear");
  const $hints = document.getElementById("hints");
  const $results = document.getElementById("results");

  let data = null;
  let index = [];

  A.loadData().then(function (d) {
    data = d;
    index = buildIndex(d);
    renderHints();
    const initial = new URLSearchParams(location.search).get("q");
    if (initial) $q.value = initial;
    run();
  }).catch(function (err) {
    $results.innerHTML = '<div class="section">' + A.errorHTML(err) + "</div>";
  });

  // На компьютере сразу ставим курсор в поле; на телефоне не открываем клавиатуру сама по себе
  if (window.matchMedia("(hover: hover)").matches) $q.focus();

  function buildIndex(d) {
    const items = [];
    d.subjects.forEach(function (s) {
      if (s.hideInSubjects) return;
      items.push({ kind: "subject", subject: s, text: A.normalize([s.name, s.short, s.teacher, s.practice].join(" ")) });
    });
    d.lectures.forEach(function (l) {
      const s = A.getSubject(d, l.subject);
      items.push({ kind: "lecture", lecture: l, text: A.normalize([l.title, s.name, s.short, s.teacher, "тема " + l.topic].join(" ")) });
    });
    return items;
  }

  function tokens(query) { return A.normalize(query).split(" ").filter(Boolean); }

  // Подсветка найденного (без учёта регистра и «ё»)
  function highlighter(words) {
    return function (text) {
      text = String(text || "");
      const lower = text.toLowerCase().replace(/ё/g, "е");
      const marks = new Array(text.length).fill(false);
      words.forEach(function (w) {
        let from = 0, i;
        while (w && (i = lower.indexOf(w, from)) !== -1) {
          for (let k = i; k < i + w.length; k++) marks[k] = true;
          from = i + w.length;
        }
      });
      let out = "", open = false;
      for (let k = 0; k < text.length; k++) {
        if (marks[k] && !open) { out += "<mark>"; open = true; }
        if (!marks[k] && open) { out += "</mark>"; open = false; }
        out += A.esc(text[k]);
      }
      return out + (open ? "</mark>" : "");
    };
  }

  function renderHints() {
    const withLectures = data.subjects.filter(function (s) {
      return data.lectures.some(function (l) { return l.subject === s.id; });
    });
    const hints = withLectures.map(function (s) { return s.short || s.name; }).slice(0, 6);
    $hints.innerHTML = hints.map(function (h) { return '<button type="button">' + A.esc(h) + "</button>"; }).join("");
    $hints.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { $q.value = b.textContent; run(); $q.focus(); });
    });
  }

  function run() {
    const query = $q.value;
    const words = tokens(query);
    $clear.hidden = !query;
    $hints.hidden = words.length > 0;

    const url = new URL(location.href);
    if (query) url.searchParams.set("q", query); else url.searchParams.delete("q");
    history.replaceState(null, "", url);

    if (!words.length) {
      $results.innerHTML = "";
      return;
    }

    const found = index.filter(function (item) {
      return words.every(function (w) { return item.text.indexOf(w) !== -1; });
    });
    const subjects = found.filter(function (i) { return i.kind === "subject"; });
    const lectures = found.filter(function (i) { return i.kind === "lecture"; });
    const hl = highlighter(words);

    if (!found.length) {
      $results.innerHTML = '<div class="section"><div class="card empty fade-in">' + A.icon("search") +
        "<b>Ничего не нашлось</b>Попробуйте другое слово или название предмета.</div></div>";
      return;
    }

    let html = "";
    if (lectures.length) {
      html += '<section class="section"><div class="section-head"><h2>Лекции</h2><span class="subject-count">' + lectures.length + "</span></div>" +
        '<div class="card list-card">' + lectures.map(function (i) { return A.lectureHTML(data, i.lecture, { highlight: hl }); }).join("") + "</div></section>";
    }
    if (subjects.length) {
      html += '<section class="section"><div class="section-head"><h2>Предметы</h2><span class="subject-count">' + subjects.length + "</span></div>" +
        '<div class="card list-card">' + subjects.map(function (i) {
          const s = i.subject;
          const n = data.lectures.filter(function (l) { return l.subject === s.id; }).length;
          return '<a class="result" href="subjects.html?id=' + encodeURIComponent(s.id) + '">' + A.chip(s) +
            '<div class="result-text"><div class="result-title">' + hl(s.name) + '</div><div class="result-sub">' +
              (s.teacher ? hl(s.teacher) + " · " : "") + (n ? n + " " + A.plural(n, "лекция", "лекции", "лекций") : "лекций пока нет") + "</div></div>" +
            A.icon("chevron") + "</a>";
        }).join("") + "</div></section>";
    }
    $results.innerHTML = html;
  }

  $q.addEventListener("input", run);
  $clear.addEventListener("click", function () { $q.value = ""; run(); $q.focus(); });

  // «/» на клавиатуре — быстро перейти в поле поиска
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== $q) { e.preventDefault(); $q.focus(); }
    if (e.key === "Escape" && document.activeElement === $q) { $q.value = ""; run(); }
  });
})();
