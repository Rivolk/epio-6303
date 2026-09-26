/* Расписание: неделя по дням, свайп на телефоне, архив прошлых недель */
(function () {
  "use strict";
  const A = window.App;
  A.initLayout("schedule");

  const $range = document.getElementById("week-range");
  const $notice = document.getElementById("notice");
  const $tabs = document.getElementById("day-tabs");
  const $week = document.getElementById("week");
  const $select = document.getElementById("archive-select");
  const $segButtons = document.querySelectorAll("[data-week]");

  let data = null;
  let archive = [];
  let shown = null; // { week, isCurrent }

  Promise.all([A.loadData(), A.loadArchiveIndex()]).then(function (res) {
    data = res[0];
    archive = res[1];
    setupSwitcher();
    const requested = new URLSearchParams(location.search).get("week");
    if (requested && archive.indexOf(requested) !== -1) openArchive(requested);
    else showWeek(data.schedule, true);
    setInterval(refreshStates, 30000);
  }).catch(function (err) {
    $week.innerHTML = A.errorHTML(err);
  });

  /* ---------- Переключатель недель ---------- */

  function setupSwitcher() {
    const prevBtn = document.querySelector('[data-week="prev"]');
    if (!archive.length) {
      prevBtn.disabled = true;
      prevBtn.title = "Архив пока пуст";
    }
    $segButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.dataset.week === "current") showWeek(data.schedule, true);
        else if (archive.length) openArchive(archive[0]);
      });
    });
    if (archive.length > 1) {
      $select.hidden = false;
      $select.innerHTML = '<option value="">Архив недель…</option>' + archive.map(function (w) {
        return '<option value="' + A.esc(w) + '">Неделя с ' + A.esc(A.dayMonth(w)) + "</option>";
      }).join("");
      $select.addEventListener("change", function () { if ($select.value) openArchive($select.value); });
    }
  }

  function openArchive(weekStart) {
    A.loadArchiveWeek(weekStart).then(function (week) {
      showWeek(week, false);
    }).catch(function (err) { A.toast(err.message); });
  }

  function setPressed(isCurrent) {
    const isPrev = !isCurrent && shown && shown.week.weekStart === archive[0];
    $segButtons.forEach(function (btn) {
      const on = btn.dataset.week === "current" ? isCurrent : isPrev;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (!$select.hidden) $select.value = !isCurrent && !isPrev ? shown.week.weekStart : "";
  }

  /* ---------- Отрисовка недели ---------- */

  function showWeek(week, isCurrent) {
    shown = { week: week, isCurrent: isCurrent };
    selected = -1;
    setPressed(isCurrent);

    const url = new URL(location.href);
    if (isCurrent) url.searchParams.delete("week"); else url.searchParams.set("week", week.weekStart);
    history.replaceState(null, "", url);

    $range.textContent = week.days.length ? A.capitalize(A.weekRange(week)) : "Неделя не заполнена";

    const today = A.todayISO();
    const notes = [];
    if (!isCurrent) notes.push({ icon: "history", text: "Это архивная неделя." });
    else if (week.days.length && week.days[week.days.length - 1].date < today) notes.push({ icon: "info", text: "Эта неделя закончилась. Новое расписание ещё не опубликовано." });
    if (week.note) notes.push({ icon: "info", text: week.note });
    $notice.innerHTML = notes.map(function (n) { return '<div class="notice fade-in">' + A.icon(n.icon) + "<span>" + A.esc(n.text) + "</span></div>"; }).join("");

    if (!week.days.length) {
      $tabs.innerHTML = "";
      $week.innerHTML = '<div class="card empty" style="flex:1">' + A.icon("calendar") + "<b>Пар нет</b>Расписание на эту неделю ещё не добавлено.</div>";
      return;
    }

    $week.style.setProperty("--days", week.days.length);

    $tabs.innerHTML = week.days.map(function (day, i) {
      const isToday = day.date === today;
      return '<button type="button" class="day-tab' + (isToday ? " is-today" : "") + '" role="tab" data-index="' + i + '" aria-selected="false" aria-label="' + A.esc(A.weekday(day.date) + ", " + A.dayMonth(day.date)) + '">' +
        "<span>" + A.esc(A.capitalize(A.weekdayShort(day.date))) + "</span><b>" + A.esc(A.fmtDate(day.date, { day: "numeric" })) + "</b></button>";
    }).join("");

    $week.innerHTML = week.days.map(function (day) {
      const isToday = day.date === today;
      return '<section class="day fade-in' + (isToday ? " is-today" : "") + '" data-date="' + A.esc(day.date) + '" aria-label="' + A.esc(A.weekday(day.date)) + '">' +
        '<div class="card list-card">' +
          '<div class="day-head"><h3>' + A.esc(A.weekday(day.date)) + "</h3>" +
            (isToday ? '<span class="today-badge">Сегодня</span>' : "<span>" + A.esc(A.fmtDate(day.date, { day: "numeric", month: "short" }).replace(".", "")) + "</span>") +
          "</div>" +
          dayBody(day) +
        "</div>" +
      "</section>";
    }).join("");

    $tabs.querySelectorAll(".day-tab").forEach(function (tab) {
      tab.addEventListener("click", function () { goTo(Number(tab.dataset.index), true); });
    });

    // Какой день открыть: сегодняшний, иначе ближайший будущий, иначе первый
    let start = week.days.findIndex(function (d) { return d.date === today; });
    if (start === -1) start = week.days.findIndex(function (d) { return d.date > today; });
    if (start === -1) start = 0;
    goTo(start, false);
  }

  function dayBody(day) {
    if (day.dayOff || !day.lessons.length) {
      return '<div class="day-off">' + A.icon("coffee") + "<span>Выходной</span></div>";
    }
    const t = A.now();
    return day.lessons.map(function (lesson) {
      const state = A.lessonState({ start: A.at(day.date, lesson.start), end: A.at(day.date, lesson.end) }, t);
      return A.lessonHTML(data, lesson, state);
    }).join("");
  }

  function refreshStates() {
    if (!shown) return;
    $week.querySelectorAll(".day").forEach(function (section, i) {
      const day = shown.week.days[i];
      if (!day) return;
      const card = section.querySelector(".list-card");
      const head = card.querySelector(".day-head").outerHTML;
      card.innerHTML = head + dayBody(day);
    });
  }

  /* ---------- Свайп между днями (телефон) ---------- */

  let selected = -1;

  function isSwipeMode() { return getComputedStyle($tabs).display !== "none"; }

  function goTo(index, smooth) {
    const day = $week.children[index];
    if (!day) return;
    select(index);
    if (isSwipeMode()) {
      $week.scrollTo({ left: day.offsetLeft - 16, behavior: smooth ? "smooth" : "auto" });
    }
  }

  function select(index) {
    if (index === selected) return;
    selected = index;
    $tabs.querySelectorAll(".day-tab").forEach(function (tab, i) {
      tab.setAttribute("aria-selected", i === index ? "true" : "false");
    });
    const tab = $tabs.children[index];
    if (tab && isSwipeMode()) {
      const left = tab.offsetLeft - ($tabs.clientWidth - tab.offsetWidth) / 2;
      $tabs.scrollTo({ left: left, behavior: "smooth" });
    }
  }

  let scrollTimer;
  $week.addEventListener("scroll", function () {
    if (!isSwipeMode()) return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      const first = $week.children[0];
      if (!first) return;
      const step = first.offsetWidth + (parseFloat(getComputedStyle($week).columnGap) || 16);
      select(Math.round($week.scrollLeft / step));
    }, 60);
  }, { passive: true });

  // Стрелки на клавиатуре тоже листают дни
  $tabs.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = Math.max(0, Math.min($tabs.children.length - 1, selected + (e.key === "ArrowRight" ? 1 : -1)));
    goTo(next, true);
    $tabs.children[next].focus();
  });

  window.addEventListener("resize", function () {
    if (isSwipeMode() && selected >= 0) goTo(selected, false);
  });
})();
