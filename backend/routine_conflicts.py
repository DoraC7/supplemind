"""Pure logic for detecting skincare routine conflicts.

This module intentionally has no database or FastAPI dependencies so it can be
unit tested in isolation and safely re-used by the API layer.
"""
from typing import Any, Dict, List

RETINOID_INGREDIENTS = {"Retinol", "Bakuchiol"}
ACID_INGREDIENTS = {"AHA Complex", "Mandelic Acid", "Salicylic Acid", "BHA Complex"}
BRIGHTENING_INGREDIENTS = {
    "Ascorbic Acid",
    "Ascorbyl Glucoside",
    "Ethyl Ascorbic Acid",
    "Arbutin",
    "Tranexamic Acid",
    "Niacinamide",
}
DAYTIME_RISK_TAGS = {"不建議白天用", "與A醇禁忌"}

SLOT_LABELS = {"morning": "晨間", "night": "夜間"}


def _slot_label(slot: str) -> str:
    return SLOT_LABELS.get(slot, slot)


def check_routine_conflicts(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Inspect products grouped by routine_slot and flag risky combinations.

    Each input product dict should have: id, name, routine_slot,
    key_ingredients (list[str]), risk_tags (list[str]).
    Returns a list of conflict dicts: {slot, type, message, products}.
    """
    conflicts: List[Dict[str, Any]] = []

    slots: Dict[str, List[Dict[str, Any]]] = {}
    for product in products:
        slot = product.get("routine_slot")
        if not slot:
            continue
        slots.setdefault(slot, []).append(product)

    for slot, slot_products in slots.items():
        label = _slot_label(slot)

        retinoid_products = [
            p for p in slot_products
            if set(p.get("key_ingredients", [])) & RETINOID_INGREDIENTS
        ]
        acid_products = [
            p for p in slot_products
            if set(p.get("key_ingredients", [])) & ACID_INGREDIENTS
        ]
        brightening_products = [
            p for p in slot_products
            if set(p.get("key_ingredients", [])) & BRIGHTENING_INGREDIENTS
        ]
        daytime_risk_products = [
            p for p in slot_products
            if set(p.get("risk_tags", [])) & DAYTIME_RISK_TAGS
        ]

        if retinoid_products and acid_products:
            names = [p["name"] for p in retinoid_products + acid_products]
            conflicts.append({
                "slot": slot,
                "type": "retinoid_acid",
                "message": f"{label}保養同時使用了 A醇/補骨脂酚 與 酸類成分，建議分開使用以降低刺激。",
                "products": names,
            })

        if len(retinoid_products) >= 2:
            conflicts.append({
                "slot": slot,
                "type": "retinoid_stacking",
                "message": f"{label}保養同時使用了多款 A醇/補骨脂酚類產品，建議只選一種。",
                "products": [p["name"] for p in retinoid_products],
            })

        if len(brightening_products) >= 3:
            conflicts.append({
                "slot": slot,
                "type": "brightening_stacking",
                "message": f"{label}保養同時堆疊了 {len(brightening_products)} 款亮白/抗氧化成分，建議一次只選一種主力亮白產品。",
                "products": [p["name"] for p in brightening_products],
            })

        if slot == "morning" and daytime_risk_products:
            conflicts.append({
                "slot": slot,
                "type": "daytime_risk",
                "message": "晨間保養包含標示「不建議白天用」的產品，建議改到夜間使用並加強防曬。",
                "products": [p["name"] for p in daytime_risk_products],
            })

    return conflicts
