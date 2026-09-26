/* Главная: «Сегодня», ближайшие пары, новые лекции */
(function () {
  "use strict";
  const A = window.App;
  A.initLayout("home");

  const $now = document.getElementById("now");
  const $upcoming = document.getElementById("upcoming");
  const $upcomingTitle = document.getElementById("upcoming-title");
  const $latest = document.getElementById("latest");

  function greeting() {
    const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: A.TZ, hour: "numeric", hourCycle: "h23" }).format(new Date(A.now())));
    if (hour < 5) return "Доброй ночи";
    if (hour < 12) return "Доброе утро";
    if (hour < 18) return "Добрый день";
    return "Добрый вечер";
  }

  function shortTime(time) { return String(time).replace(/^0/, ""); }

  A.loadData().then(render).catch(function (err) {
    $now.outerHTML = A.errorHTML(err);
    document.getElementById("upcoming-section").hidden = true;
    $latest.closest(".section").hidden = true;
  });

  function render(data) {
    const today = A.todayISO();
    document.getElementById("greeting").textContent = greeting();
    document.getElementById("today-date").textContent = A.capitalize(A.weekday(today)) + ", " + A.dayMonth(today);

    const g = data.group;
    document.getElementById("footer").textContent = [g.name, g.profile, g.university].filter(Boolean).join(" · ");

    renderLatest(data);

    const items = A.flattenWeek(data.schedule);
    let lastKey = null;

    function tick() {
      const t = A.now();
      const current = items.find(function (i) { return t >= i.start && t < i.end; });
      const next = items.find(function (i) { return i.start > t; });
      const key = (current ? current.start : "-") + "|" + (next ? next.start : "-") + "|" + A.todayISO();
      if (key !== lastKey) {
        lastKey = key;
        renderNow(data, current, next, t);
        renderUpcoming(data, items, current || next, t);
      }
      updateCountdown(current, next, t);
    }
    tick();
    setInterval(tick, 1000);
  }

  function lessonBlock(data, item) {
    const subject = A.getSubject(data, item.lesson.subject);
    const type = A.lessonType(item.lesson.type);
    const teacher = item.lesson.teacher || subject.teacher;
    const meta = [];
    meta.push("<span>" + A.icon("clock") + A.esc(shortTime(item.lesson.start)) + "–" + A.esc(item.lesson.end) + "</span>");
    if (item.lesson.room) meta.push("<span>" + A.icon("pin") + A.esc(item.lesson.room) + "</span>");
    if (teacher) meta.push("<span>" + A.icon("user") + A.esc(teacher) + "</span>");
    return (
      '<div class="now-lesson">' +
        A.chip(subject, "lg") +
        "<div>" +
          '<div class="now-lesson-title">' + A.esc(subject.name) + "</div>" +
          (type || item.lesson.pair
            ? '<div class="lesson-tags">' +
                (item.lesson.pair ? '<span class="tag tnum">' + A.esc(item.lesson.pair) + " пара</span>" : "") +
                (type ? '<span class="tag ' + type.cls + '">' + type.label + "</span>" : "") +
              "</div>"
            : "") +
          '<div class="now-lesson-meta">' + meta.join("") + "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderNow(data, current, next, t) {
    const today = A.todayISO();
    const todayEntry = data.schedule.days.find(function (d) { return d.date === today; });

    if (current) {
      const nextToday = next && next.day.date === today ? next : null;
      $now.innerHTML =
        '<div class="fade-in">' +
          '<div class="now-eyebrow"><span class="tag tag-live">Идёт сейчас</span><span>до ' + A.esc(current.lesson.end) + "</span></div>" +
          '<div class="now-countdown" data-countdown></div>' +
          '<div class="now-label">до конца пары</div>' +
          '<div class="progress" role="progressbar" aria-label="Прошло времени пары"><div data-progress></div></div>' +
          lessonBlock(data, current) +
          (nextToday
            ? '<div class="now-label" style="margin-top:16px">Дальше: <b style="color:var(--text)">' +
                A.esc(A.getSubject(data, nextToday.lesson.subject).short || A.getSubject(data, nextToday.lesson.subject).name) +
                "</b> в " + A.esc(shortTime(nextToday.lesson.start)) +
                (nextToday.lesson.room ? ", ауд. " + A.esc(nextToday.lesson.room) : "") + "</div>"
            : "") +
        "</div>";
      return;
    }

    if (next) {
      const isToday = next.day.date === today;
      const hadLessonToday = isToday && next.day.lessons.some(function (l) { return A.at(today, l.end) <= t; });
      let when;
      if (isToday) when = hadLessonToday ? "Перерыв · следующая пара в " + shortTime(next.lesson.start) : "Сегодня в " + shortTime(next.lesson.start);
      else if (next.day.date === A.addDays(today, 1)) when = "Завтра в " + shortTime(next.lesson.start);
      else when = A.capitalize(A.weekday(next.day.date)) + ", " + A.dayMonth(next.day.date) + " в " + shortTime(next.lesson.start);
      const dayOffNote = todayEntry && todayEntry.dayOff ? '<span class="tag">Сегодня выходной</span>' : "";
      $now.innerHTML =
        '<div class="fade-in">' +
          '<div class="now-eyebrow">' + dayOffNote + "<span>" + A.esc(when) + "</span></div>" +
          '<div class="now-countdown" data-countdown></div>' +
          '<div class="now-label">до начала пары</div>' +
          lessonBlock(data, next) +
        "</div>";
      return;
    }

    const empty = !data.schedule.days.length;
    $now.innerHTML =
      '<div class="now-empty fade-in">' +
        '<span class="chip chip-lg">' + A.icon("coffee") + "</span>" +
        "<div>" +
          "<h2>" + (empty ? "Расписание пока не добавлено" : "На этой неделе пар больше нет") + "</h2>" +
          "<p>Расписание на следующую неделю появится здесь, как только его опубликуют.</p>" +
        "</div>" +
      "</div>";
  }

  function updateCountdown(current, next, t) {
    const el = $now.querySelector("[data-countdown]");
    if (!el) return;
    const target = current ? current.end : next ? next.start : null;
    if (target == null) return;
    el.innerHTML = A.countdownHTML(target - t);
    const bar = $now.querySelector("[data-progress]");
    if (bar && current) {
      const pct = Math.min(100, Math.max(0, ((t - current.start) / (current.end - current.start)) * 100));
      bar.style.width = pct.toFixed(2) + "%";
      bar.parentElement.setAttribute("aria-valuenow", Math.round(pct));
    }
  }

  function renderUpcoming(data, items, focus, t) {
    const today = A.todayISO();
    const todayDay = data.schedule.days.find(function (d) { return d.date === today && !d.dayOff && d.lessons.length; });
    const todayHasMore = todayDay && todayDay.lessons.some(function (l) { return A.at(today, l.end) > t; });
    const day = todayHasMore ? todayDay : focus ? focus.day : null;

    if (!day) {
      $upcomingTitle.textContent = "Пары";
      $upcoming.innerHTML = '<div class="empty">' + A.icon("calendar") + "<b>Ближайших пар нет</b>Загляните в расписание позже.</div>";
      return;
    }
    $upcomingTitle.textContent = A.relativeDay(day.date) + ", " + A.dayMonth(day.date);
    $upcoming.classList.add("stagger");
    $upcoming.innerHTML = day.lessons.map(function (lesson) {
      const item = { start: A.at(day.date, lesson.start), end: A.at(day.date, lesson.end) };
      return A.lessonHTML(data, lesson, A.lessonState(item, t));
    }).join("");
  }

  function renderLatest(data) {
    const latest = data.lectures.slice(0, 5);
    if (!latest.length) {
      $latest.innerHTML = '<div class="empty">' + A.icon("file") + "<b>Лекций пока нет</b>Как только появятся презентации, они будут здесь.</div>";
      return;
    }
    $latest.classList.add("stagger");
    $latest.innerHTML = latest.map(function (l) { return A.lectureHTML(data, l); }).join("");
  }
})();
