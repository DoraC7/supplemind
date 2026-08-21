import streamlit as st
import sqlite3
import pandas as pd
from datetime import datetime, date, timedelta

# ==========================================
# 1. 資料庫初始化與工具函式
# ==========================================
DB_FILE = 'supplemind.db'

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS Supplements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                expiry_date DATE,
                total_capacity REAL,
                current_stock REAL,
                unit TEXT,
                warning_level REAL
            )
        ''')
        conn.commit()

def run_query(query, params=()):
    with sqlite3.connect(DB_FILE) as conn:
        return pd.read_sql_query(query, conn, params=params)

def execute_update(query, params=()):
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute(query, params)
        conn.commit()

# ==========================================
# 2. 視角組件：首頁儀表板 (Home)
# ==========================================
def view_home():
    st.title("🏠 SuppleMind 儀表板")
    st.markdown("追蹤你的健康日常，保持最佳狀態。")
    st.divider()

    df = run_query("SELECT * FROM Supplements")
    
    if df.empty:
        st.info("目前沒有任何保健品紀錄，請前往「新增」建立你的第一筆資料！")
        return

    # 計算商業邏輯
    df['expiry_date'] = pd.to_datetime(df['expiry_date']).dt.date
    today = date.today()
    thirty_days_later = today + timedelta(days=30)
    
    low_stock_count = len(df[df['current_stock'] <= df['warning_level']])
    expiring_soon_count = len(df[(df['expiry_date'] <= thirty_days_later) & (df['expiry_date'] >= today)])
    expired_count = len(df[df['expiry_date'] < today])

    # 顯示 KPI 卡片
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(label="⚠️ 低庫存警告", value=low_stock_count)
    with col2:
        st.metric(label="⏰ 30天內過期", value=expiring_soon_count)
    with col3:
        st.metric(label="❌ 已過期", value=expired_count)

# ==========================================
# 3. 視角組件：庫存列表 (List)
# ==========================================
def view_list():
    st.title("📋 我的保健品櫃")
    
    # 簡單的搜尋與篩選
    search_term = st.text_input("🔍 搜尋品名...")
    
    query = "SELECT * FROM Supplements WHERE name LIKE ?"
    df = run_query(query, (f"%{search_term}%",))

    if df.empty:
        st.warning("找不到相符的保健品。")
        return

    for _, row in df.iterrows():
        with st.container():
            st.markdown(f"### {row['name']} `[{row['category']}]`")
            col1, col2 = st.columns([3, 1])
            
            with col1:
                # 計算進度條比例 (防呆機制)
                total = row['total_capacity']
                current = row['current_stock']
                ratio = 0.0 if total <= 0 else max(0.0, min(1.0, current / total))
                
                st.progress(ratio, text=f"剩餘: {current} / {total} {row['unit']}")
                st.caption(f"📅 到期日: {row['expiry_date']} | ⚠️ 警告水位: {row['warning_level']} {row['unit']}")
            
            with col2:
                # 扣除庫存按鈕
                if current > 0:
                    if st.button(f"服用 1 {row['unit']}", key=f"btn_{row['id']}", use_container_width=True):
                        execute_update(
                            "UPDATE Supplements SET current_stock = current_stock - 1 WHERE id = ?", 
                            (row['id'],)
                        )
                        st.success(f"已記錄！")
                        st.rerun() # 重新整理畫面以更新進度條
                else:
                    st.button("已用完", key=f"btn_empty_{row['id']}", disabled=True, use_container_width=True)
            st.divider()

# ==========================================
# 4. 視角組件：新增資料 (Add)
# ==========================================
def view_add():
    st.title("➕ 新增保健品")
    
    tab1, tab2 = st.tabs(["✍️ 手動輸入", "📷 相機掃描 (開發中)"])
    
    with tab1:
        with st.form("add_supplement_form"):
            name = st.text_input("品名 (Name)*")
            category = st.selectbox("分類 (Category)", ["維他命", "益生菌", "礦物質", "魚油", "草本萃取", "其他"])
            
            col1, col2 = st.columns(2)
            with col1:
                total_capacity = st.number_input("總容量/購買量", min_value=1.0, value=60.0, step=1.0)
                current_stock = st.number_input("目前剩餘量", min_value=0.0, value=60.0, step=1.0)
            with col2:
                unit = st.selectbox("單位 (Unit)", ["粒", "包", "滴", "ml", "克"])
                warning_level = st.number_input("低庫存警告水位", min_value=1.0, value=10.0, step=1.0)
                
            expiry_date = st.date_input("到期日 (Expiry Date)")
            
            submitted = st.form_submit_button("💾 儲存至資料庫")
            if submitted:
                if not name:
                    st.error("請輸入保健品名稱！")
                else:
                    execute_update('''
                        INSERT INTO Supplements 
                        (name, category, expiry_date, total_capacity, current_stock, unit, warning_level)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (name, category, expiry_date, total_capacity, current_stock, unit, warning_level))
                    st.success(f"成功新增: {name}!")

    with tab2:
        st.info("未來功能：利用 AI 掃描包裝上的條碼與到期日。")
        camera_photo = st.camera_input("拍攝保健品正面")
        if camera_photo:
            st.image(camera_photo, caption="已拍攝的照片", width=300)
            st.warning("影像已擷取。OCR/Barcode 辨識功能將於下一階段實作。")

# ==========================================
# 主程式路由
# ==========================================
def main():
    # 頁面設定
    st.set_page_config(page_title="SuppleMind", page_icon="💊", layout="centered")
    init_db()

    # 側邊欄導覽
    st.sidebar.title("💊 SuppleMind")
    st.sidebar.markdown("你的健康庫存管家")
    page = st.sidebar.radio("前往", ["🏠 儀表板 (Home)", "📋 我的清單 (List)", "➕ 新增 (Add)"])

    if page == "🏠 儀表板 (Home)":
        view_home()
    elif page == "📋 我的清單 (List)":
        view_list()
    elif page == "➕ 新增 (Add)":
        view_add()

if __name__ == "__main__":
    main()
