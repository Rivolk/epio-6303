/* Предметы: карточки и страница предмета со списком лекций */
(function () {
  "use strict";
  const A = window.App;
  A.initLayout("subjects");

  const $root = document.getElementById("root");

  A.loadData().then(function (data) {
    route(data);
    window.addEventListener("popstate", function () { route(data); });
  }).catch(function (err) {
    $root.insertAdjacentHTML("beforeend", A.errorHTML(err));
  });

  function route(data) {
    const id = new URLSearchParams(location.search).get("id");
    if (id && data.subjectMap[id]) renderSubject(data, data.subjectMap[id]);
    else renderList(data);
    window.scrollTo(0, 0);
  }

  function lecturesOf(data, id) {
    return data.lectures.filter(function (l) { return l.subject === id; });
  }

  function renderList(data) {
    document.title = "Предметы — ЭПиО 6303";
    const subjects = data.subjects.filter(function (s) { return !s.hideInSubjects; });
    const totalLectures = data.lectures.length;
    $root.innerHTML =
      '<div class="page-head fade-in">' +
        "<h1>Предметы</h1>" +
        "<p>" + subjects.length + " " + A.plural(subjects.length, "предмет", "предмета", "предметов") +
          " · " + totalLectures + " " + A.plural(totalLectures, "презентация", "презентации", "презентаций") + "</p>" +
      "</div>" +
      '<div class="subjects-grid stagger">' +
        subjects.map(function (s) {
          const n = lecturesOf(data, s.id).length;
          return '<a class="card subject-card' + (n ? "" : " is-empty") + '" href="subjects.html?id=' + encodeURIComponent(s.id) + '">' +
            A.chip(s, "lg") +
            '<div class="subject-card-body"><h3>' + A.esc(s.name) + "</h3>" + (s.teacher ? "<p>" + A.esc(s.teacher) + "</p>" : "") + "</div>" +
            '<span class="subject-count">' + (n ? n + " " + A.plural(n, "лекция", "лекции", "лекций") : "Пока пусто") + "</span>" +
          "</a>";
        }).join("") +
      "</div>";

    // Открываем предмет без перезагрузки страницы
    $root.querySelectorAll(".subject-card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        history.pushState(null, "", card.getAttribute("href"));
        route(data);
      });
    });
  }

  function renderSubject(data, subject) {
    document.title = subject.name + " — ЭПиО 6303";
    const lectures = lecturesOf(data, subject.id).sort(function (a, b) {
      return (Number(a.topic) || 0) - (Number(b.topic) || 0) || (a.date || "").localeCompare(b.date || "");
    });

    const people = [];
    if (subject.teacher) people.push("<div><dt>" + (subject.practice ? "Лекции: " : "Преподаватель: ") + "</dt><dd>" + A.esc(subject.teacher) + "</dd></div>");
    if (subject.practice) people.push("<div><dt>Практика: </dt><dd>" + A.esc(subject.practice) + "</dd></div>");

    // Пары этого предмета на текущей неделе
    const t = A.now();
    const upcoming = A.flattenWeek(data.schedule).filter(function (i) { return i.lesson.subject === subject.id && i.end > t; });

    $root.innerHTML =
      '<a class="back-link" href="subjects.html">' + A.icon("back") + "Все предметы</a>" +
      '<div class="subject-hero fade-in">' +
        A.chip(subject, "lg") +
        "<div><h1>" + A.esc(subject.name) + "</h1>" + (people.length ? "<dl>" + people.join("") + "</dl>" : "") + "</div>" +
      "</div>" +

      (upcoming.length
        ? '<section class="section" style="margin-top:0;margin-bottom:32px">' +
            '<div class="section-head"><h2>На этой неделе</h2><a class="section-link" href="schedule.html">Расписание ' + A.icon("chevron", "icon-sm") + "</a></div>" +
            '<div class="card list-card">' +
              upcoming.map(function (i) {
                const type = A.lessonType(i.lesson.type);
                return '<div class="result">' +
                  '<div class="result-text">' +
                    '<div class="result-title">' + A.esc(A.relativeDay(i.day.date)) + ", " + A.esc(A.dayMonth(i.day.date)) + "</div>" +
                    '<div class="result-sub tnum">' + A.esc(i.lesson.start + "–" + i.lesson.end) +
                      (type ? " · " + type.label : "") + (i.lesson.room ? " · ауд. " + A.esc(i.lesson.room) : "") + "</div>" +
                  "</div>" +
                  (i.start <= t ? '<span class="tag tag-live">Идёт</span>' : "") +
                "</div>";
              }).join("") +
            "</div>" +
          "</section>"
        : "") +

      '<section class="section" style="margin-top:0">' +
        '<div class="section-head"><h2>Лекции по темам</h2><span class="subject-count">' + lectures.length + "</span></div>" +
        (lectures.length
          ? '<div class="card list-card stagger">' + lectures.map(function (l) {
              return A.lectureHTML(data, l, { hideSubject: true, hideChip: true });
            }).join("") + "</div>"
          : '<div class="card empty">' + A.icon("file") + "<b>Презентаций пока нет</b>Они появятся здесь, как только их загрузят.</div>") +
      "</section>";

    $root.querySelector(".back-link").addEventListener("click", function (e) {
      e.preventDefault();
      history.pushState(null, "", "subjects.html");
      route(data);
    });
  }
})();
