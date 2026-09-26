/* Просмотр PDF прямо на сайте (через PDF.js — работает и на телефонах) */
const A = window.App;
const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38";

const $pages = document.getElementById("pages");
const $title = document.getElementById("title");
const $subtitle = document.getElementById("subtitle");
const $pageInfo = document.getElementById("page-info");
const $download = document.getElementById("download");
const $fab = document.getElementById("fab");
const $back = document.getElementById("back");

const ZOOMS = [0.6, 0.75, 1, 1.25, 1.5, 2];
let zoomIndex = 2;
let pdf = null;
let pages = [];
let layoutWidth = 0;

const params = new URLSearchParams(location.search);
const fileParam = params.get("file") || "";

// «Назад» возвращает туда, откуда пришли
$back.addEventListener("click", (e) => {
  if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
    e.preventDefault();
    history.back();
  }
});

function showState(iconName, title, text, actionsHTML) {
  $pages.innerHTML =
    '<div class="viewer-state fade-in">' + A.icon(iconName) + "<h2>" + A.esc(title) + "</h2><p>" + text + "</p>" + (actionsHTML || "") + "</div>";
}

function downloadButton(href, ext) {
  return '<a class="btn btn-primary" href="' + A.esc(href) + '" download>' + A.icon("download") + "Скачать оригинал" + (ext ? " (." + A.esc(ext) + ")" : "") + "</a>";
}

async function main() {
  if (!fileParam || /^[a-z]+:|^\/\//i.test(fileParam)) {
    $title.textContent = "Файл не выбран";
    showState("file", "Файл не выбран", "Откройте презентацию со страницы предмета.", '<a class="btn" href="subjects.html">К предметам</a>');
    return;
  }

  let data = null;
  try { data = await A.loadData(); } catch (e) { /* покажем хотя бы сам файл */ }

  const lecture = data && data.lectures.find((l) => l.file === fileParam || l.pdf === fileParam);
  const original = lecture ? lecture.file : fileParam;
  const pdfUrl = A.encodePath(lecture ? A.pdfPath(lecture) : fileParam.replace(/\.pptx?$/i, ".pdf"));
  const ext = A.extOf(original);
  const hasOriginal = ext && ext !== "pdf";

  if (lecture) {
    const subject = A.getSubject(data, lecture.subject);
    $title.textContent = lecture.title;
    $subtitle.textContent = [subject.short || subject.name, lecture.topic ? "Тема " + lecture.topic : ""].filter(Boolean).join(" · ");
    document.title = lecture.title + " — ЭПиО 6303";
    $back.href = "subjects.html?id=" + encodeURIComponent(subject.id);
  } else {
    $title.textContent = decodeURIComponent(original.split("/").pop());
    $subtitle.textContent = "Презентация";
  }

  const downloadHref = A.encodePath(hasOriginal ? original : pdfUrl);
  $download.href = downloadHref;
  $download.hidden = false;
  $download.setAttribute("aria-label", hasOriginal ? "Скачать оригинал (." + ext + ")" : "Скачать PDF");
  $fab.href = downloadHref;
  $fab.innerHTML = A.icon("download") + (hasOriginal ? "Скачать ." + A.esc(ext) : "Скачать PDF");

  $pages.innerHTML = '<div class="viewer-state"><div class="spinner"></div><p>Открываем презентацию…</p></div>';

  let pdfjs;
  try {
    pdfjs = await import(PDFJS + "/build/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS + "/build/pdf.worker.min.mjs";
  } catch (e) {
    showState("alert", "Не удалось загрузить просмотрщик",
      "Проверьте интернет. Можно открыть PDF напрямую в браузере или скачать оригинал.",
      '<div class="row-actions" style="justify-content:center"><a class="btn" href="' + A.esc(pdfUrl) + '" target="_blank" rel="noopener">' + A.icon("external") + "Открыть PDF</a>" +
      (hasOriginal ? downloadButton(downloadHref, ext) : "") + "</div>");
    return;
  }

  try {
    pdf = await pdfjs.getDocument({
      url: pdfUrl,
      // Загружаем файл целиком: частичные запросы (Range) на GitHub Pages иногда зависают
      disableRange: true,
      disableStream: true,
      cMapUrl: PDFJS + "/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: PDFJS + "/standard_fonts/"
    }).promise;
  } catch (e) {
    const missing = e && (e.name === "MissingPDFException" || /Missing PDF|404/i.test(e.message));
    showState("file",
      missing ? "PDF-версия ещё не готова" : "Не получилось открыть PDF",
      missing
        ? "Для этой лекции пока нет PDF. Скачайте оригинал — он откроется в PowerPoint, Google Slides или WPS Office."
        : "Файл повреждён или не загрузился. Попробуйте скачать оригинал.",
      hasOriginal ? downloadButton(downloadHref, ext) : "");
    $fab.hidden = true;
    return;
  }

  $fab.hidden = !hasOriginal;
  await buildPages();
}

async function buildPages() {
  const first = await pdf.getPage(1);
  const vp = first.getViewport({ scale: 1 });
  const ratio = vp.height / vp.width;

  $pages.innerHTML = "";
  pages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const el = document.createElement("div");
    el.className = "pdf-page";
    el.dataset.num = n;
    el.innerHTML = '<span class="pdf-page-num">' + n + "</span>";
    $pages.append(el);
    pages.push({ num: n, el, ratio, renderedWidth: 0, task: null });
  }
  layout();

  const renderObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const p = pages[Number(entry.target.dataset.num) - 1];
      p.visible = entry.isIntersecting;
      if (entry.isIntersecting) renderPage(p);
    });
  }, { rootMargin: "1200px 0px" });

  const pageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) $pageInfo.textContent = entry.target.dataset.num + " / " + pdf.numPages;
    });
  }, { rootMargin: "-45% 0px -45% 0px" });

  pages.forEach((p) => { renderObserver.observe(p.el); pageObserver.observe(p.el); });
  $pageInfo.textContent = "1 / " + pdf.numPages;
}

function fitWidth() {
  const style = getComputedStyle($pages);
  const inner = $pages.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  return Math.min(inner, 1000);
}

function layout() {
  layoutWidth = Math.round(fitWidth() * ZOOMS[zoomIndex]);
  pages.forEach((p) => {
    p.el.style.width = layoutWidth + "px";
    p.el.style.height = Math.round(layoutWidth * p.ratio) + "px";
  });
  pages.filter((p) => p.visible).forEach(renderPage);
}

async function renderPage(p) {
  if (p.renderedWidth === layoutWidth || p.rendering === layoutWidth) return;
  const width = layoutWidth;
  p.rendering = width;
  if (p.task) { try { p.task.cancel(); } catch (e) { /* ничего */ } }
  try {
    const page = await pdf.getPage(p.num);
    const base = page.getViewport({ scale: 1 });
    const cssScale = width / base.width;
    // Ограничиваем размер холста, чтобы телефоны не падали на больших слайдах
    const dpr = Math.min(window.devicePixelRatio || 1, 2, 4096 / (base.width * cssScale));
    const viewport = page.getViewport({ scale: cssScale * dpr });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    p.ratio = base.height / base.width;
    p.el.style.height = Math.round(width * p.ratio) + "px";
    p.task = page.render({ canvasContext: canvas.getContext("2d"), viewport });
    await p.task.promise;
    if (p.rendering !== width) return;
    p.el.querySelector("canvas")?.remove();
    p.el.prepend(canvas);
    p.el.classList.add("is-rendered");
    p.renderedWidth = width;
  } catch (e) {
    if (e && e.name === "RenderingCancelledException") return;
  } finally {
    if (p.rendering === width) p.rendering = 0;
  }
}

function zoom(delta) {
  const next = Math.max(0, Math.min(ZOOMS.length - 1, zoomIndex + delta));
  if (next === zoomIndex || !pdf) return;
  zoomIndex = next;
  layout();
}
document.getElementById("zoom-in").addEventListener("click", () => zoom(1));
document.getElementById("zoom-out").addEventListener("click", () => zoom(-1));

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (pdf && Math.round(fitWidth() * ZOOMS[zoomIndex]) !== layoutWidth) layout(); }, 150);
});

main();
