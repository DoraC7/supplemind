import unittest

from backend.routine_conflicts import check_routine_conflicts


def make_product(id_, name, routine_slot, key_ingredients=None, risk_tags=None):
    return {
        "id": id_,
        "name": name,
        "routine_slot": routine_slot,
        "key_ingredients": key_ingredients or [],
        "risk_tags": risk_tags or [],
    }


class RoutineConflictTests(unittest.TestCase):
    def test_retinol_and_acid_in_same_slot_conflicts(self):
        products = [
            make_product(1, "A醇精華", "night", key_ingredients=["Retinol"]),
            make_product(2, "果酸精華", "night", key_ingredients=["AHA Complex"]),
        ]

        conflicts = check_routine_conflicts(products)

        self.assertEqual(len(conflicts), 1)
        self.assertEqual(conflicts[0]["slot"], "night")
        self.assertEqual(conflicts[0]["type"], "retinoid_acid")
        self.assertIn("A醇精華", conflicts[0]["products"])
        self.assertIn("果酸精華", conflicts[0]["products"])

    def test_two_retinoid_products_in_same_slot_conflicts(self):
        products = [
            make_product(1, "A醇精華", "night", key_ingredients=["Retinol"]),
            make_product(2, "補骨脂酚精華", "night", key_ingredients=["Bakuchiol"]),
        ]

        conflicts = check_routine_conflicts(products)

        self.assertEqual(len(conflicts), 1)
        self.assertEqual(conflicts[0]["type"], "retinoid_stacking")

    def test_multiple_brightening_actives_warns_once(self):
        products = [
            make_product(1, "維C醣苷精華", "morning", key_ingredients=["Ascorbyl Glucoside"]),
            make_product(2, "熊果素精華", "morning", key_ingredients=["Arbutin"]),
            make_product(3, "傳明酸精華", "morning", key_ingredients=["Tranexamic Acid"]),
        ]

        conflicts = check_routine_conflicts(products)

        self.assertEqual(len(conflicts), 1)
        self.assertEqual(conflicts[0]["type"], "brightening_stacking")
        self.assertEqual(len(conflicts[0]["products"]), 3)

    def test_risk_tag_not_recommended_in_daytime_flags_morning(self):
        products = [
            make_product(
                1,
                "杏仁熊果酸更新精華",
                "morning",
                risk_tags=["不建議白天用"],
            ),
        ]

        conflicts = check_routine_conflicts(products)

        self.assertEqual(len(conflicts), 1)
        self.assertEqual(conflicts[0]["type"], "daytime_risk")
        self.assertIn("杏仁熊果酸更新精華", conflicts[0]["products"])

    def test_no_conflicts_when_products_are_compatible(self):
        products = [
            make_product(1, "神經醯胺精華", "night", key_ingredients=["Ceramide"]),
            make_product(2, "維B5精華", "night", key_ingredients=["Panthenol"]),
        ]

        conflicts = check_routine_conflicts(products)

        self.assertEqual(conflicts, [])

    def test_products_without_routine_slot_are_ignored(self):
        products = [
            make_product(1, "A醇精華", None, key_ingredients=["Retinol"]),
            make_product(2, "果酸精華", None, key_ingredients=["AHA Complex"]),
        ]

        conflicts = check_routine_conflicts(products)

        self.assertEqual(conflicts, [])

    def test_different_slots_do_not_conflict(self):
        products = [
            make_product(1, "A醇精華", "night", key_ingredients=["Retinol"]),
            make_product(2, "果酸精華", "morning", key_ingredients=["AHA Complex"]),
        ]

        conflicts = check_routine_conflicts(products)

        self.assertEqual(conflicts, [])


if __name__ == "__main__":
    unittest.main()
