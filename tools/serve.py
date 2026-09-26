#!/usr/bin/env python3
"""Запускает сайт у вас на компьютере: http://localhost:8000 (закрыть — Ctrl+C или закрыть окно)."""

import functools
import http.server
import socketserver
import sys
import threading
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = 8000

for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8")
    except Exception:
        pass


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".mjs": "text/javascript",
        ".json": "application/json",
    }

    def end_headers(self):
        # Не кешируем, чтобы изменения в JSON были видны сразу
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


def main():
    handler = functools.partial(Handler, directory=str(ROOT))
    port = PORT
    for _ in range(10):
        try:
            server = socketserver.ThreadingTCPServer(("127.0.0.1", port), handler)
            break
        except OSError:
            port += 1
    else:
        print("Не получилось занять порт — закройте другие копии этого окна.")
        return 1

    url = f"http://localhost:{port}/"
    print(f"Сайт открыт: {url}")
    print(f"Редактор расписания: {url}admin.html")
    print("Чтобы остановить — закройте это окно.")
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
