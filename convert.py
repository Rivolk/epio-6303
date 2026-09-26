#!/usr/bin/env python3
"""
Конвертирует все новые презентации (.ppt / .pptx) из папки files/ в PDF.

Запуск:  python convert.py          — только новые и изменённые
         python convert.py --all    — пересоздать все PDF заново

Нужен установленный LibreOffice (бесплатно: https://www.libreoffice.org/download/).
PDF кладётся рядом с оригиналом, с тем же именем:
    files/law/tema-2.pptx  →  files/law/tema-2.pdf

После конвертации скрипт проверяет data/lectures.json и подсказывает,
каких презентаций там не хватает.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FILES = ROOT / "files"
LECTURES = ROOT / "data" / "lectures.json"
EXTENSIONS = {".ppt", ".pptx"}

# Чтобы русский текст нормально выводился в консоли Windows
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8")
    except Exception:
        pass


def find_soffice():
    """Ищет LibreOffice в стандартных местах."""
    for name in ("soffice", "libreoffice"):
        path = shutil.which(name)
        if path:
            return path
    candidates = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        "/usr/bin/soffice",
        "/usr/local/bin/soffice",
        "/snap/bin/libreoffice",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None


def presentations():
    if not FILES.exists():
        return []
    result = []
    for path in sorted(FILES.rglob("*")):
        if path.suffix.lower() in EXTENSIONS and path.is_file() and not path.name.startswith("~$"):
            result.append(path)
    return result


def needs_conversion(src, force):
    pdf = src.with_suffix(".pdf")
    return force or not pdf.exists() or pdf.stat().st_mtime < src.stat().st_mtime


def convert(soffice, src, profile_dir):
    # Отдельный профиль LibreOffice — чтобы конвертация работала,
    # даже если LibreOffice сейчас открыт
    profile_url = Path(profile_dir).as_uri()
    cmd = [
        soffice,
        f"-env:UserInstallation={profile_url}",
        "--headless", "--norestore",
        "--convert-to", "pdf",
        "--outdir", str(src.parent),
        str(src),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=300)
    except subprocess.TimeoutExpired:
        return "LibreOffice не ответил за 5 минут"
    except subprocess.CalledProcessError as e:
        return (e.stderr or b"").decode("utf-8", "replace").strip() or "ошибка LibreOffice"
    if not src.with_suffix(".pdf").exists():
        return "PDF не появился (файл повреждён или защищён паролем?)"
    return None


def check_lectures(all_files):
    """Сверяет data/lectures.json с тем, что лежит в files/."""
    try:
        data = json.loads(LECTURES.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print("\n⚠ Не найден data/lectures.json")
        return
    except json.JSONDecodeError as e:
        print(f"\n⚠ Ошибка в data/lectures.json (строка {e.lineno}): {e.msg}")
        print("  Проверьте запятые и кавычки рядом с этой строкой.")
        return

    lectures = data.get("lectures", [])
    listed = {l.get("file", "").replace("\\", "/") for l in lectures}

    missing = [l for l in lectures if l.get("file") and not (ROOT / l["file"]).exists()]
    if missing:
        print("\n⚠ В lectures.json указаны файлы, которых нет в папке:")
        for l in missing:
            print(f"   – {l['file']}")

    new = [p for p in all_files if p.relative_to(ROOT).as_posix() not in listed]
    if new:
        print("\n📋 Эти презентации ещё не добавлены в data/lectures.json.")
        print("   Скопируйте блоки ниже в список \"lectures\" и заполните тему и название:\n")
        for p in new:
            rel = p.relative_to(ROOT).as_posix()
            block = {
                "subject": p.parent.name,
                "topic": 0,
                "title": p.stem,
                "date": "ГГГГ-ММ-ДД",
                "file": rel,
            }
            print("    " + json.dumps(block, ensure_ascii=False, indent=2).replace("\n", "\n    ") + ",")


def main():
    force = "--all" in sys.argv
    all_files = presentations()

    if not all_files:
        print("В папке files/ нет презентаций .ppt или .pptx.")
        return 0

    todo = [p for p in all_files if needs_conversion(p, force)]
    print(f"Найдено презентаций: {len(all_files)}. Нужно конвертировать: {len(todo)}.")

    if todo:
        soffice = find_soffice()
        if not soffice:
            print("\n✖ LibreOffice не найден.")
            print("  Скачайте и установите его бесплатно: https://www.libreoffice.org/download/")
            print("  После установки запустите скрипт ещё раз.")
            check_lectures(all_files)
            return 1

        errors = 0
        with tempfile.TemporaryDirectory(prefix="lo-profile-") as profile:
            for i, src in enumerate(todo, 1):
                rel = src.relative_to(ROOT).as_posix()
                print(f"  [{i}/{len(todo)}] {rel} … ", end="", flush=True)
                error = convert(soffice, src, profile)
                if error:
                    errors += 1
                    print(f"ошибка: {error}")
                else:
                    print("готово")

        print(f"\nГотово: {len(todo) - errors} из {len(todo)}." + (f" Ошибок: {errors}." if errors else ""))
    else:
        print("Все PDF уже на месте — конвертировать нечего.")

    check_lectures(all_files)
    return 0


if __name__ == "__main__":
    sys.exit(main())
