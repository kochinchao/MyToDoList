#!/usr/bin/env python3
"""
MyToDoList 本地開發伺服器啟動腳本
"""
import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 5173

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 允許快顯視窗 (Firebase Google 登入 Popup) 與跨來源資源
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 60)
        print(f"🚀 MyToDoList 伺服器已啟動: {url}")
        print("💡 請在瀏覽器中開啟上方網址，即可開始體驗多人協作待辦清單！")
        print("🛑 按 Ctrl + C 可停止伺服器")
        print("=" * 60)
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 伺服器已停止。")

if __name__ == "__main__":
    main()
