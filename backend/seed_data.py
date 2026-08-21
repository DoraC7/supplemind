import sqlite3
import json

def seed_products():
    with sqlite3.connect('supplemind.db') as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS SkincareProducts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                brand TEXT,
                category TEXT,
                expiry_date DATE,
                opened_date DATE,
                pao_months INTEGER,
                current_capacity REAL DEFAULT 100,
                routine_slot TEXT,
                key_ingredients TEXT,
                efficacy TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✅ SkincareProducts 資料表準備完成 (尚無初始資料)")

if __name__ == "__main__":
    seed_products()