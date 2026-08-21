import re
from typing import List, Dict, Any

CATEGORY_MAP = {
    "亮白": "精華",
    "亮白／抗氧化": "精華",
    "A 醇／抗老": "精華",
    "抗老": "精華",
    "保濕／舒緩": "面膜",
    "保濕；Dora 註記「超好用」": "精華",
    "更新／亮白（依品名暫分）": "精華",
    "修護／緊緻": "精華",
    "屏障修護": "精華",
    "舒緩": "精華",
    "舒緩／提亮輔助": "精華",
    "保濕／屏障支持": "精華",
    "調理": "精華",
    "調理／抗老": "精華",
    "保濕／修護": "精華",
    "保濕；Dora 註記「超好用」": "精華",
    "痘痘調理": "面膜",
    "屏障修護": "面膜",
    "亮白": "精華",
    "保濕": "精華",
    "修護／緊緻": "精華",
    "眼部 A 醇／抗老": "眼霜",
    "抗氧化／提亮輔助": "精華",
    "亮白／抗氧化": "精華",
    "亮白／抗氧化": "精華",
    "保濕／舒緩；完整品牌待確認": "面膜",
    "抗氧化／提亮輔助": "精華",
}

INGREDIENT_KEYWORDS = {
    "Ascorbyl Glucoside": ["Ascorbyl Glucoside", "維生素 C 醣苷", "維C醣苷", "乙基維 C", "乙基維他命 C"],
    "Ascorbic Acid": ["維生素C", "維 C", "維他命 C", "乙基維C", "乙基維他命 C"],
    "Tranexamic Acid": ["傳明酸", "Tranexamic Acid"],
    "Arbutin": ["熊果素", "Arbutin"],
    "Niacinamide": ["煙醯胺", "Niacinamide", "維他命 B3"],
    "Retinol": ["A 醇", "Retinol"],
    "Bakuchiol": ["補骨脂酚", "Bakuchiol"],
    "Ceramide": ["神經醯胺", "Ceramide"],
    "Panthenol": ["維生素 B5", "泛醇", "Panthenol"],
    "Vitamin E": ["維生素E", "Vitamin E"],
    "Centella Asiatica": ["積雪草", "Centella"],
    "Hyaluronic Acid": ["玻尿酸", "Hyaluronic Acid"],
    "EGF": ["EGF"],
    "Glutathione": ["穀胱甘肽", "Glutathione"],
}

RISK_KEYWORDS = {
    "需防曬": ["亮白", "維生素C", "熊果素", "傳明酸", "A 醇", "更新", "美白", "亮白/抗氧化"],
    "不建議白天用": ["A 醇", "杏仁熊果酸", "更新", "Retinol", "A醇"],
    "與酸類禁忌": ["酸", "果酸", "AHA"],
    "與A醇禁忌": ["A 醇", "Retinol", "A醇"],
    "敏感時停用": ["亮白", "酸", "A 醇", "更新"],
    "孕期慎用": ["A 醇", "Retinol"],
    "香味明顯": [],
    "容易致痘": [],
}


def normalize_category(raw: str) -> str:
    if not raw:
        return "其他"
    candidate = raw.strip().replace("（", "(").replace("）", ")")
    for key, mapped in CATEGORY_MAP.items():
        if key in candidate:
            return mapped
    if "面膜" in candidate or "膜" in candidate:
        return "面膜"
    if "精華" in candidate or "Essence" in candidate or "Serum" in candidate:
        return "精華"
    if "A 醇" in candidate or "醇" in candidate:
        return "A醇/A醛"
    if "酸" in candidate:
        return "酸類"
    return "其他"


def extract_ingredients(name: str) -> List[str]:
    matches = []
    lowered = name.lower()
    for ingredient, patterns in INGREDIENT_KEYWORDS.items():
        if any(pattern.lower() in lowered for pattern in patterns):
            matches.append(ingredient)
    return matches


def extract_risk_tags(name: str, category: str) -> List[str]:
    tags = []
    content = (name + " " + category).lower()
    for tag, patterns in RISK_KEYWORDS.items():
        if not patterns:
            continue
        if any(pattern.lower() in content for pattern in patterns):
            tags.append(tag)
    if "亮白" in category or "精華" in category and "維生素C" in name:
        tags.append("需防曬")
    if "A 醇" in name or "Retinol" in name:
        tags.append("不建議白天用")
    if "A 醇" in name or "Retinol" in name:
        tags.append("孕期慎用")
    return sorted(set(tags))


def parse_inventory_markdown(markdown: str) -> List[Dict[str, Any]]:
    rows = []
    table_lines = [line for line in markdown.splitlines() if "|" in line]
    for line in table_lines:
        if "# |" in line or "|---" in line or "範圍" in line:
            continue
        if "|" not in line:
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) < 5:
            continue
        try:
            quantity = int(parts[1])
        except ValueError:
            continue
        brand = parts[2]
        product_name = parts[3]
        category = parts[4]
        if not product_name or product_name.startswith("#"):
            continue
        rows.append({
            "quantity": quantity,
            "brand": brand,
            "product_name": product_name,
            "category": category,
        })
    return rows


def build_product_payload(item: Dict[str, Any]) -> Dict[str, Any]:
    name = item["product_name"]
    category = normalize_category(item.get("category", ""))
    ingredients = extract_ingredients(name)
    risk_tags = extract_risk_tags(name, category)
    if not risk_tags and category == "精華":
        risk_tags = ["需防曬"]

    payload = {
        "name": name,
        "brand": item.get("brand") or "未知品牌",
        "category": category,
        "photo_url": None,
        "capacity_value": None,
        "capacity_unit": "ml",
        "expiry_date": None,
        "opened_date": None,
        "pao_months": 6,
        "current_capacity": 100.0,
        "product_status": "unopened",
        "routine_slot": None,
        "usage_time": "morning",
        "key_ingredients": ingredients,
        "efficacy": item.get("category") or "保養",
        "risk_tags": risk_tags,
    }
    return payload


def build_product_batch(markdown: str) -> List[Dict[str, Any]]:
    items = parse_inventory_markdown(markdown)
    return [build_product_payload(item) for item in items]
