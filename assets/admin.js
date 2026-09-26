/* Редактор расписания: форма → готовый JSON для data/schedule.json */
(function () {
  "use strict";
  const A = window.App;
  A.initLayout("admin");

  // Стандартное время пар (можно поменять здесь, если звонки изменятся)
  const PAIRS = [
    { pair: 1, start: "09:00", end: "10:20" },
    { pair: 2, start: "10:30", end: "11:50" },
    { pair: 3, start: "12:30", end: "13:50" },
    { pair: 4, start: "14:00", end: "15:20" }
  ];
  const DAYS_IN_FORM = 6; // Пн–Сб
  const STORAGE_KEY = "schedule-draft";

  const $ = function (id) { return document.getElementById(id); };
  const els = {
    weekStart: $("week-start"), weekNote: $("week-note"),
    dayPicker: $("day-picker"), pairPicker: $("pair-picker"),
    start: $("f-start"), end: $("f-end"), subject: $("f-subject"), type: $("f-type"),
    room: $("f-room"), teacher: $("f-teacher"), note: $("f-note"),
    form: $("lesson-form"), submit: $("submit-btn"), cancel: $("cancel-edit"), formTitle: $("form-title"),
    preview: $("week-preview"), count: $("lesson-count"), output: $("output")
  };

  let data = null;
  let draft = null;           // { weekStart, note, days: [{ dayOff, lessons: [] }] } — 6 дней по порядку
  let form = { day: 0, pair: 1 };
  let editing = null;         // { day, index } когда правим пару

  /* ---------- Даты ---------- */

  function mondayOf(iso) {
    const weekdayIndex = (new Date(iso + "T12:00:00Z").getUTCDay() + 6) % 7; // 0 = понедельник
    return A.addDays(iso, -weekdayIndex);
  }
  function daysBetween(a, b) { return Math.round((A.at(b, "12:00") - A.at(a, "12:00")) / 86400000); }
  function dateOf(i) { return A.addDays(draft.weekStart, i); }

  /* ---------- Черновик ---------- */

  function emptyDraft(weekStart) {
    const days = [];
    for (let i = 0; i < DAYS_IN_FORM; i++) days.push({ dayOff: false, lessons: [] });
    return { weekStart: weekStart, note: "", days: days };
  }

  // Черновик из готовой недели; shiftDays = 7 — та же неделя, но следующая
  function draftFromWeek(week, shiftDays) {
    const monday = mondayOf(week.weekStart || week.days[0].date);
    const d = emptyDraft(A.addDays(monday, shiftDays || 0));
    d.note = shiftDays ? "" : week.note || "";
    week.days.forEach(function (day) {
      const i = daysBetween(monday, day.date);
      if (i < 0 || i >= DAYS_IN_FORM) return;
      d.days[i].dayOff = !!day.dayOff;
      d.days[i].lessons = day.lessons.map(function (l) { return Object.assign({}, l); });
    });
    return d;
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch (e) { /* не страшно */ }
  }
  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.weekStart && Array.isArray(saved.days)) return saved;
    } catch (e) { /* черновика нет */ }
    return null;
  }

  function toJSON() {
    const days = [];
    draft.days.forEach(function (day, i) {
      const lessons = day.lessons.slice().sort(function (a, b) { return a.start.localeCompare(b.start); });
      // Суббота попадает в файл, только если в ней есть пары
      if (i === 5 && !lessons.length && !day.dayOff) return;
      const entry = { date: dateOf(i) };
      if (day.dayOff || !lessons.length) entry.dayOff = true;
      entry.lessons = day.dayOff ? [] : lessons.map(function (l) {
        const out = { pair: l.pair == null ? null : l.pair, start: l.start, end: l.end, subject: l.subject, type: l.type, room: l.room || "", teacher: l.teacher || "" };
        if (l.note) out.note = l.note;
        return out;
      });
      days.push(entry);
    });
    // Каждая пара — одной строкой, чтобы файл было удобно читать
    const body = { weekStart: draft.weekStart, note: draft.note || "", days: days };
    return JSON.stringify(body, null, 2).replace(/\{\n\s+"pair"[\s\S]*?\n\s+\}/g, function (block) {
      return block.replace(/\n\s+/g, " ");
    });
  }

  /* ---------- Отрисовка ---------- */

  function renderAll() {
    els.weekStart.value = draft.weekStart;
    els.weekNote.value = draft.note || "";
    renderDayPicker();
    renderPairPicker();
    renderPreview();
    els.output.value = toJSON();
    save();
  }

  function renderDayPicker() {
    els.dayPicker.innerHTML = draft.days.map(function (day, i) {
      const iso = dateOf(i);
      return '<button type="button" data-day="' + i + '" aria-pressed="' + (form.day === i) + '">' +
        A.esc(A.capitalize(A.weekdayShort(iso)) + ", " + A.fmtDate(iso, { day: "numeric", month: "short" }).replace(".", "")) + "</button>";
    }).join("");
  }

  function renderPairPicker() {
    els.pairPicker.innerHTML = PAIRS.map(function (p) {
      return '<button type="button" data-pair="' + p.pair + '" aria-pressed="' + (form.pair === p.pair) + '">' +
        p.pair + " · " + p.start.replace(/^0/, "") + "–" + p.end + "</button>";
    }).join("") + '<button type="button" data-pair="" aria-pressed="' + (form.pair == null) + '">Без номера</button>';
  }

  function renderPreview() {
    let total = 0;
    els.preview.innerHTML = draft.days.map(function (day, i) {
      const iso = dateOf(i);
      total += day.lessons.length;
      const lessons = day.lessons
        .map(function (l, idx) { return { l: l, idx: idx }; })
        .sort(function (a, b) { return a.l.start.localeCompare(b.l.start); });
      return (
        '<div class="admin-day-head">' +
          "<b>" + A.esc(A.capitalize(A.weekday(iso))) + ", " + A.esc(A.dayMonth(iso)) + "</b>" +
          '<label class="switch"><input type="checkbox" data-dayoff="' + i + '"' + (day.dayOff ? " checked" : "") + "> Выходной</label>" +
        "</div>" +
        (day.dayOff
          ? '<div class="admin-empty">Выходной день</div>'
          : lessons.length
            ? lessons.map(function (x) {
                const s = A.getSubject(data, x.l.subject);
                const type = A.lessonType(x.l.type);
                return '<div class="admin-lesson">' +
                  A.chip(s, "sm") +
                  '<div class="lesson-main">' +
                    '<div class="lesson-title">' + A.esc(s.short || s.name) + "</div>" +
                    '<div class="lesson-meta tnum"><span>' + A.esc(x.l.start + "–" + x.l.end) + "</span>" +
                      (x.l.pair ? "<span>" + x.l.pair + " пара</span>" : "") +
                      (type ? "<span>" + type.label + "</span>" : "") +
                      (x.l.room ? "<span>ауд. " + A.esc(x.l.room) + "</span>" : "") +
                    "</div>" +
                  "</div>" +
                  '<button class="icon-btn" type="button" data-edit="' + i + ":" + x.idx + '" aria-label="Изменить">' + A.icon("edit") + "</button>" +
                  '<button class="icon-btn" type="button" data-remove="' + i + ":" + x.idx + '" aria-label="Удалить">' + A.icon("trash") + "</button>" +
                "</div>";
              }).join("")
            : '<div class="admin-empty">Пар нет' + (i < 5 ? " — в расписании будет «Выходной»" : "") + "</div>")
      );
    }).join("");
    els.count.textContent = total + " " + A.plural(total, "пара", "пары", "пар");
  }

  /* ---------- Форма ---------- */

  function fillTeacher() {
    const s = data.subjectMap[els.subject.value];
    if (!s) return;
    els.teacher.value = els.type.value === "практика" && s.practice ? s.practice : s.teacher || "";
  }

  function setPair(pair) {
    form.pair = pair;
    const preset = PAIRS.find(function (p) { return p.pair === pair; });
    if (preset) { els.start.value = preset.start; els.end.value = preset.end; }
    renderPairPicker();
  }

  function resetForm() {
    editing = null;
    els.formTitle.textContent = "2. Добавить пару";
    els.submit.textContent = "Добавить пару";
    els.cancel.hidden = true;
    els.room.value = "";
    els.note.value = "";
    // Следующая пара по порядку — чтобы быстро вбивать день целиком
    const next = form.pair ? Math.min(form.pair + 1, PAIRS.length) : 1;
    setPair(next);
  }

  function startEdit(day, index) {
    const l = draft.days[day].lessons[index];
    editing = { day: day, index: index };
    form.day = day;
    form.pair = l.pair == null ? null : Number(l.pair);
    els.start.value = l.start;
    els.end.value = l.end;
    els.subject.value = l.subject;
    els.type.value = l.type || "лекция";
    els.room.value = l.room || "";
    els.teacher.value = l.teacher || "";
    els.note.value = l.note || "";
    els.formTitle.textContent = "Изменить пару";
    els.submit.textContent = "Сохранить изменения";
    els.cancel.hidden = false;
    renderDayPicker();
    renderPairPicker();
    $("lesson-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  els.form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!els.start.value || !els.end.value) { A.toast("Укажите время начала и конца"); return; }
    if (els.end.value <= els.start.value) { A.toast("Конец пары должен быть позже начала"); return; }
    const lesson = {
      pair: form.pair,
      start: els.start.value,
      end: els.end.value,
      subject: els.subject.value,
      type: els.type.value,
      room: els.room.value.trim(),
      teacher: els.teacher.value.trim()
    };
    if (els.note.value.trim()) lesson.note = els.note.value.trim();

    if (editing) {
      draft.days[editing.day].lessons.splice(editing.index, 1);
    }
    draft.days[form.day].dayOff = false;
    draft.days[form.day].lessons.push(lesson);
    A.toast(editing ? "Пара изменена" : "Пара добавлена");
    resetForm();
    renderAll();
  });

  els.cancel.addEventListener("click", function () { resetForm(); renderAll(); });

  els.dayPicker.addEventListener("click", function (e) {
    const b = e.target.closest("[data-day]");
    if (!b) return;
    form.day = Number(b.dataset.day);
    renderDayPicker();
  });
  els.pairPicker.addEventListener("click", function (e) {
    const b = e.target.closest("[data-pair]");
    if (!b) return;
    setPair(b.dataset.pair ? Number(b.dataset.pair) : null);
  });
  els.subject.addEventListener("change", fillTeacher);
  els.type.addEventListener("change", fillTeacher);

  els.preview.addEventListener("click", function (e) {
    const edit = e.target.closest("[data-edit]");
    const remove = e.target.closest("[data-remove]");
    if (edit) {
      const p = edit.dataset.edit.split(":").map(Number);
      startEdit(p[0], p[1]);
    } else if (remove) {
      const q = remove.dataset.remove.split(":").map(Number);
      draft.days[q[0]].lessons.splice(q[1], 1);
      if (editing) resetForm();
      renderAll();
      A.toast("Пара удалена");
    }
  });
  els.preview.addEventListener("change", function (e) {
    const box = e.target.closest("[data-dayoff]");
    if (!box) return;
    draft.days[Number(box.dataset.dayoff)].dayOff = box.checked;
    renderAll();
  });

  els.weekStart.addEventListener("change", function () {
    if (!els.weekStart.value) return;
    const monday = mondayOf(els.weekStart.value);
    if (monday !== els.weekStart.value) A.toast("Взят понедельник этой недели: " + A.dayMonth(monday));
    draft.weekStart = monday;
    renderAll();
  });
  els.weekNote.addEventListener("input", function () {
    draft.note = els.weekNote.value;
    els.output.value = toJSON();
    save();
  });

  $("load-current").addEventListener("click", function () {
    if (!confirm("Заменить черновик текущей неделей из schedule.json?")) return;
    draft = draftFromWeek(data.schedule, 0);
    resetForm();
    renderAll();
    A.toast("Загружена текущая неделя");
  });
  $("load-next").addEventListener("click", function () {
    if (!confirm("Создать следующую неделю: те же пары, даты +7 дней?")) return;
    draft = draftFromWeek(data.schedule, 7);
    resetForm();
    renderAll();
    A.toast("Готово — поменяйте то, что изменилось");
  });
  $("clear-all").addEventListener("click", function () {
    if (!confirm("Удалить все пары из черновика?")) return;
    draft = emptyDraft(draft.weekStart);
    resetForm();
    renderAll();
  });

  /* ---------- Копирование и скачивание ---------- */

  function downloadText(filename, text) {
    const blob = new Blob([text + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.append(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  $("copy").addEventListener("click", function () {
    const text = els.output.value;
    const done = function () { A.toast("JSON скопирован"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
    function fallback() {
      els.output.removeAttribute("readonly");
      els.output.select();
      document.execCommand("copy");
      els.output.setAttribute("readonly", "");
      done();
    }
  });
  $("download").addEventListener("click", function () { downloadText("schedule.json", els.output.value); });

  $("archive-download").addEventListener("click", function () {
    A.loadJSON("data/schedule.json").then(function (current) {
      const name = (current.weekStart || "week") + ".json";
      downloadText(name, JSON.stringify(current, null, 2));
      $("archive-hint").innerHTML = "Скачан файл <b>" + A.esc(name) + "</b>. Положите его в <code>data/schedule-archive/</code> и добавьте строку <code>\"" +
        A.esc(current.weekStart) + "\"</code> в список <code>weeks</code> в <code>data/schedule-archive/index.json</code>.";
    }).catch(function (err) { A.toast(err.message); });
  });

  /* ---------- Старт ---------- */

  A.loadData().then(function (d) {
    data = d;
    els.subject.innerHTML = d.subjects.map(function (s) {
      return '<option value="' + A.esc(s.id) + '">' + A.esc(s.name) + "</option>";
    }).join("");
    const rooms = {};
    d.schedule.days.forEach(function (day) { day.lessons.forEach(function (l) { if (l.room) rooms[l.room] = true; }); });
    $("rooms").innerHTML = Object.keys(rooms).sort().map(function (r) { return '<option value="' + A.esc(r) + '">'; }).join("");

    draft = restore() || (d.schedule.days.length ? draftFromWeek(d.schedule, 0) : emptyDraft(mondayOf(A.todayISO())));
    fillTeacher();
    setPair(1);
    renderAll();
  }).catch(function (err) {
    document.querySelector("main").insertAdjacentHTML("beforeend", A.errorHTML(err));
  });
})();
