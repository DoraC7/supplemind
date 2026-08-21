# SuppleMind 💧✨

一款個人保養品管理與智慧保養流程助手，幫你追蹤保養品庫存、有效期限，並提供成分洞察與智慧推薦，讓晨間 / 夜間保養流程更安心、更有效率。

## 功能特色

- 📦 **產品管理**：新增、編輯、追蹤保養品庫存與容量
- ⏰ **到期 / PAO 提醒**：自動偵測即將過期或已過期的產品
- 🧴 **晨間 / 夜間保養流程**：依產品設定的 `routine_slot` 自動排入對應時段
- ⚠️ **成分衝突偵測**：偵測 A酸/A醇疊加、美白成分疊加、日間曬敏成分等風險組合
- ✨ **智慧推薦**：依膚況與現有產品給出契合度分數建議
- 📱 **PWA 支援**：可安裝於手機主畫面，提供類原生 App 體驗

## 技術架構

- **後端**：Python + FastAPI + SQLite
- **前端**：React + Vite + Tailwind CSS + React Router
- **PWA**：vite-plugin-pwa（manifest + service worker）

## 專案結構

```
supplemind/
├── app.py                  # 應用程式進入點
├── backend/
│   ├── main.py              # FastAPI 主程式與 API 路由
│   ├── routine_conflicts.py # 保養流程衝突偵測邏輯
│   ├── seed_data.py         # 初始化測試資料
│   ├── requirements.txt     # Python 依賴套件
│   └── tests/                # 後端測試
└── frontend/
    ├── src/
    │   ├── pages/            # Home / Products / AddProduct / Profile
    │   ├── components/       # 共用元件
    │   └── lib/              # 前端商業邏輯
    └── vite.config.js       # Vite / PWA 設定
```

## 本機開發

### 1. 後端

```bash
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
python app.py
```

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

開發伺服器預設會啟動在 `http://localhost:5173`，並透過 Vite proxy 呼叫後端 API。

## 免責聲明

本專案僅為個人保養品管理輔助工具，所提供之成分衝突提醒與推薦僅供參考，不能取代專業皮膚科醫師或藥師之建議。
