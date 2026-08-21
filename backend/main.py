import sqlite3
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from datetime import date, timedelta
from typing import Optional, List
import json

from backend.inventory_importer import build_product_batch
from backend.routine_conflicts import check_routine_conflicts

DB_FILE = "supplemind.db"

INGREDIENT_KNOWLEDGE = {
    "Ascorbic Acid": {"category": "brightening", "chinese": "維生素C", "icon": "☀️"},
    "Niacinamide": {"category": "brightening", "chinese": "維生素B3", "icon": "☀️"},
    "Retinol": {"category": "antiaging", "chinese": "維生素A醇", "icon": "✨"},
    "Bakuchiol": {"category": "antiaging", "chinese": "補骨脂酚", "icon": "✨"},
    "Ceramide": {"category": "repair", "chinese": "神經醯胺", "icon": "💧"},
    "Hyaluronic Acid": {"category": "repair", "chinese": "玻尿酸", "icon": "💧"},
    "Salicylic Acid": {"category": "exfoliation", "chinese": "水楊酸", "icon": "🧼"},
}

CONCERN_TO_INGREDIENTS = {
    "痘痘粉刺": ["Niacinamide", "AHA Complex", "Centella Asiatica", "Retinol"],
    "暗沉斑點": ["Niacinamide", "Ascorbic Acid", "Arbutin", "Ascorbyl Glucoside", "Ethyl Ascorbic Acid", "Tranexamic Acid"],
    "細紋": ["Retinol", "Bakuchiol", "Coenzyme Q10", "Copper Peptide", "Hexapeptide"],
}

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS UserProfile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                username TEXT,
                skin_type TEXT,
                skin_concerns TEXT,
                morning_routine_time TEXT,
                night_routine_time TEXT,
                supplement_times TEXT
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS SkincareProducts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                brand TEXT,
                category TEXT,
                photo_url TEXT,
                capacity_value REAL,
                capacity_unit TEXT DEFAULT 'ml',
                expiry_date DATE,
                opened_date DATE,
                pao_months INTEGER,
                current_capacity REAL,
                product_status TEXT DEFAULT 'unopened',
                routine_slot TEXT,
                usage_time TEXT,
                key_ingredients TEXT,
                efficacy TEXT,
                risk_tags TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        c.execute('''
            INSERT OR IGNORE INTO UserProfile (id, username, skin_type, skin_concerns, morning_routine_time, night_routine_time, supplement_times)
            VALUES (1, '愛漂亮的工程師', '混合偏油', '痘痘粉刺,暗沉斑點', '08:00', '22:30', '')
        ''')
        conn.commit()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

app = FastAPI(title="SuppleMind API", version="2.2.0")

class UserProfileUpdate(BaseModel):
    skin_type: Optional[str] = None
    skin_concerns: Optional[List[str]] = None
    morning_routine_time: Optional[str] = None
    night_routine_time: Optional[str] = None

class SkincareProductCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    photo_url: Optional[str] = None
    capacity_value: Optional[float] = None
    capacity_unit: Optional[str] = "ml"
    expiry_date: Optional[date] = None
    opened_date: Optional[date] = None
    pao_months: Optional[int] = None
    current_capacity: float = 100.0
    product_status: Optional[str] = "unopened"
    routine_slot: Optional[str] = None
    usage_time: Optional[str] = None
    key_ingredients: Optional[List[str]] = None
    efficacy: Optional[str] = None
    risk_tags: Optional[List[str]] = None

class ProductUpdate(BaseModel):
    routine_slot: Optional[str] = None
    current_capacity: Optional[float] = None
    product_status: Optional[str] = None
    usage_time: Optional[str] = None

class MarkdownImportRequest(BaseModel):
    markdown: str

@app.on_event("startup")
def startup():
    init_db()

@app.get("/api/profile")
def get_profile():
    conn = get_db_connection()
    cursor = conn.execute("SELECT * FROM UserProfile WHERE id = 1")
    profile = cursor.fetchone()
    conn.close()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    p = dict(profile)
    p["skin_concerns"] = p["skin_concerns"].split(",") if p.get("skin_concerns") else []
    return p

@app.put("/api/profile")
def update_profile(profile: UserProfileUpdate):
    conn = get_db_connection()
    update_fields = []
    params = []
    if profile.skin_type is not None:
        update_fields.append("skin_type = ?")
        params.append(profile.skin_type)
    if profile.skin_concerns is not None:
        update_fields.append("skin_concerns = ?")
        params.append(",".join(profile.skin_concerns))
    if profile.morning_routine_time is not None:
        update_fields.append("morning_routine_time = ?")
        params.append(profile.morning_routine_time)
    if profile.night_routine_time is not None:
        update_fields.append("night_routine_time = ?")
        params.append(profile.night_routine_time)
    
    if update_fields:
        params.append(1)
        conn.execute(f"UPDATE UserProfile SET {', '.join(update_fields)} WHERE id = ?", params)
        conn.commit()
    conn.close()
    return {"message": "Profile updated"}

def calculate_product_status(product: dict) -> dict:
    today = date.today()
    expiry = date.fromisoformat(product["expiry_date"]) if product.get("expiry_date") else None
    pao_expiry = None
    if product.get("opened_date") and product.get("pao_months"):
        opened = date.fromisoformat(product["opened_date"])
        pao_expiry = opened + timedelta(days=product["pao_months"] * 30)
    
    effective_expiry = min(expiry, pao_expiry) if expiry and pao_expiry else expiry or pao_expiry
    
    if not effective_expiry:
        days_remaining = 999
        expiry_status = "active"
    else:
        days_remaining = (effective_expiry - today).days
        expiry_status = "expired" if days_remaining < 0 else ("expiring_soon" if days_remaining <= 30 else "active")
    
    key_ingredients = json.loads(product["key_ingredients"]) if product.get("key_ingredients") else []
    risk_tags = json.loads(product["risk_tags"]) if product.get("risk_tags") else []
    
    product_status = product.get("product_status", "unopened")
    
    if product_status in ["finished", "discarded"]:
        status = product_status
    else:
        status = f"{product_status}_{expiry_status}"
    
    return {
        **product,
        "key_ingredients": key_ingredients,
        "risk_tags": risk_tags,
        "effective_expiry_date": effective_expiry.isoformat() if effective_expiry else None,
        "days_remaining": days_remaining,
        "status": status
    }

@app.get("/api/products")
def get_products(
    category: Optional[str] = Query(None),
    product_status: Optional[str] = Query(None),
    usage_time: Optional[str] = Query(None),
    routine_slot: Optional[str] = Query(None)
):
    conn = get_db_connection()
    query = "SELECT * FROM SkincareProducts WHERE product_status NOT IN ('finished', 'discarded')"
    params = []
    
    if category:
        query += " AND category = ?"
        params.append(category)
    if product_status:
        query += " AND product_status = ?"
        params.append(product_status)
    if usage_time:
        query += " AND usage_time = ?"
        params.append(usage_time)
    if routine_slot:
        query += " AND routine_slot = ?"
        params.append(routine_slot)
    
    cursor = conn.execute(query, params)
    products = [calculate_product_status(dict(row)) for row in cursor.fetchall()]
    conn.close()
    return products

@app.post("/api/products")
def create_product(product: SkincareProductCreate):
    conn = get_db_connection()
    cursor = conn.execute(
        '''INSERT INTO SkincareProducts 
        (name, brand, category, photo_url, capacity_value, capacity_unit, expiry_date, opened_date, pao_months, current_capacity, product_status, routine_slot, usage_time, key_ingredients, efficacy, risk_tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (product.name, product.brand, product.category, product.photo_url,
         product.capacity_value, product.capacity_unit, product.expiry_date,
         product.opened_date, product.pao_months, product.current_capacity,
         product.product_status, product.routine_slot, product.usage_time,
         json.dumps(product.key_ingredients or []), product.efficacy,
         json.dumps(product.risk_tags or []))
    )
    conn.commit()
    product_id = cursor.lastrowid
    conn.close()
    return {"id": product_id, **product.dict()}

@app.put("/api/products/{product_id}")
def update_product(product_id: int, update: ProductUpdate):
    conn = get_db_connection()
    cursor = conn.execute("SELECT * FROM SkincareProducts WHERE id = ?", (product_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_fields = []
    params = []
    if update.routine_slot is not None:
        update_fields.append("routine_slot = ?")
        params.append(update.routine_slot)
    if update.current_capacity is not None:
        update_fields.append("current_capacity = ?")
        params.append(update.current_capacity)
    if update.product_status is not None:
        update_fields.append("product_status = ?")
        params.append(update.product_status)
    if update.usage_time is not None:
        update_fields.append("usage_time = ?")
        params.append(update.usage_time)
    
    if update_fields:
        params.extend([date.today().isoformat(), product_id])
        conn.execute(f"UPDATE SkincareProducts SET {', '.join(update_fields)}, updated_at = ? WHERE id = ?", params)
        conn.commit()
    conn.close()
    return {"message": "Updated"}

@app.post("/api/products/import-markdown")
def import_markdown_products(payload: MarkdownImportRequest):
    if not payload.markdown or not payload.markdown.strip():
        raise HTTPException(status_code=400, detail="Markdown is empty")

    parsed = build_product_batch(payload.markdown)
    if not parsed:
        raise HTTPException(status_code=400, detail="No products could be parsed from the markdown")

    conn = get_db_connection()
    inserted = 0
    for item in parsed:
        conn.execute(
            '''INSERT INTO SkincareProducts
            (name, brand, category, photo_url, capacity_value, capacity_unit, expiry_date, opened_date, pao_months, current_capacity, product_status, routine_slot, usage_time, key_ingredients, efficacy, risk_tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                item["name"],
                item["brand"],
                item["category"],
                item["photo_url"],
                item["capacity_value"],
                item["capacity_unit"],
                item["expiry_date"],
                item["opened_date"],
                item["pao_months"],
                item["current_capacity"],
                item["product_status"],
                item["routine_slot"],
                item["usage_time"],
                json.dumps(item["key_ingredients"]),
                item["efficacy"],
                json.dumps(item["risk_tags"]),
            )
        )
        inserted += 1
    conn.commit()
    conn.close()
    return {"message": "Imported products", "count": inserted}

@app.get("/api/routine-conflicts")
def get_routine_conflicts():
    conn = get_db_connection()
    cursor = conn.execute("SELECT * FROM SkincareProducts WHERE product_status NOT IN ('finished', 'discarded')")
    products = [calculate_product_status(dict(row)) for row in cursor.fetchall()]
    conn.close()

    conflicts = check_routine_conflicts(products)
    return {"conflicts": conflicts, "count": len(conflicts)}

@app.get("/api/stats")
def get_stats():
    conn = get_db_connection()
    cursor = conn.execute("SELECT * FROM SkincareProducts WHERE product_status NOT IN ('finished', 'discarded')")
    products = [calculate_product_status(dict(row)) for row in cursor.fetchall()]
    conn.close()
    
    expiring_soon = [p for p in products if 0 < p["days_remaining"] <= 30]
    expired = [p for p in products if p["days_remaining"] < 0]
    low_stock = [p for p in products if p.get("current_capacity", 100) <= 20]
    
    return {
        "low_stock_count": len(low_stock),
        "expiring_soon_count": len(expiring_soon),
        "expired_count": len(expired),
        "total_products": len(products)
    }

@app.get("/api/products/{product_id}/smart-match")
def get_smart_match(product_id: int):
    conn = get_db_connection()
    
    cursor = conn.execute("SELECT * FROM SkincareProducts WHERE id = ?", (product_id,))
    product = cursor.fetchone()
    if not product:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    
    profile = conn.execute("SELECT skin_concerns FROM UserProfile WHERE id = 1").fetchone()
    conn.close()
    
    p = calculate_product_status(dict(product))
    concerns = profile["skin_concerns"].split(",") if profile and profile.get("skin_concerns") else []
    
    matched = [ing for ing in p["key_ingredients"] if any(ing in CONCERN_TO_INGREDIENTS.get(c, []) for c in concerns)]
    match_score = min(95, len(matched) * 20 + 50)
    
    return {
        "product_name": p["name"],
        "key_ingredients": p["key_ingredients"],
        "match_score": match_score,
        "matched_concerns": matched,
        "pairing_advice": "含有Retinol成分，請安排於夜間保養使用，並注意白天需加強防曬。" if "Retinol" in p["key_ingredients"] else None
    }

@app.get("/api/recommendations")
def get_recommendations():
    conn = get_db_connection()
    profile = conn.execute("SELECT skin_concerns FROM UserProfile WHERE id = 1").fetchone()
    concerns = profile["skin_concerns"].split(",") if profile and profile["skin_concerns"] else []
    
    cursor = conn.execute("SELECT * FROM SkincareProducts WHERE product_status NOT IN ('finished', 'discarded')")
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    recommendations = []
    for p in products:
        key_ings = json.loads(p["key_ingredients"]) if p.get("key_ingredients") else []
        matched_count = 0
        for ing in key_ings:
            for c in concerns:
                if ing in CONCERN_TO_INGREDIENTS.get(c, []):
                    matched_count += 1
                    break
        if matched_count > 0:
            eff_text = p.get("efficacy", "")
            recommendations.append({
                "id": p["id"],
                "name": p["name"],
                "brand": p["brand"],
                "efficacy": eff_text,
                "match_score": min(95, matched_count * 20 + 50)
            })
    
    return sorted(recommendations, key=lambda x: -x["match_score"])