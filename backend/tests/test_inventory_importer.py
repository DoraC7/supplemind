import unittest

from backend.inventory_importer import build_product_payload, parse_inventory_markdown


class InventoryImporterTests(unittest.TestCase):
    def test_parse_inventory_rows(self):
        markdown = '''
# Dora 保養品庫存

| # | 數量 | 品牌 | 產品名稱／標示 | 分類 |
|---:|---:|---|---|---|
| 1 | 1 | My Scheming | 2% 乙基維 C 驅黑亮白精華水 | 亮白／抗氧化 |
| 2 | 1 | BB | 3% 傳明酸美白精華水 | 亮白 |
| 3 | 1 | BB | 3% A 醇微脂囊青春精華 | A 醇／抗老 |
| 4 | 1 | CICA Aqua Bomb | 積雪草水潤面膜 | 保濕／舒緩；完整品牌待確認 |
'''

        items = parse_inventory_markdown(markdown)

        self.assertEqual(len(items), 4)
        self.assertEqual(items[0]["brand"], "My Scheming")
        self.assertEqual(items[0]["product_name"], "2% 乙基維 C 驅黑亮白精華水")
        self.assertEqual(items[3]["quantity"], 1)

    def test_build_product_payload_from_markdown_item(self):
        item = {
            "brand": "Lab. Smart",
            "product_name": "2.8% 傳明酸精華（2.8% Tranexamic Acid Essence-Classic）",
            "quantity": 1,
            "category": "亮白",
        }

        payload = build_product_payload(item)

        self.assertEqual(payload["brand"], "Lab. Smart")
        self.assertEqual(payload["category"], "精華")
        self.assertIn("Tranexamic Acid", payload["key_ingredients"]) 
        self.assertIn("需防曬", payload["risk_tags"])


if __name__ == "__main__":
    unittest.main()
