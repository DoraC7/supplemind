import sqlite3

def create_ingredient_knowledge_base():
    with sqlite3.connect('supplemind.db') as conn:
        c = conn.cursor()
        
        c.execute('DROP TABLE IF EXISTS Ingredient_Efficacy_Map')
        c.execute('DROP TABLE IF EXISTS Efficacies')
        c.execute('DROP TABLE IF EXISTS Ingredients')
        c.execute('DROP TABLE IF EXISTS SkincareProducts')
        
        c.execute('''CREATE TABLE Ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name_en TEXT UNIQUE NOT NULL,
            name_zh TEXT NOT NULL
        )''')
        
        c.execute('''CREATE TABLE Efficacies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            efficacy_name TEXT UNIQUE NOT NULL
        )''')
        
        c.execute('''CREATE TABLE Ingredient_Efficacy_Map (
            ingredient_id INTEGER,
            efficacy_id INTEGER,
            PRIMARY KEY (ingredient_id, efficacy_id),
            FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id),
            FOREIGN KEY (efficacy_id) REFERENCES Efficacies(id)
        )''')
        
        c.execute('''CREATE TABLE SkincareProducts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            brand TEXT,
            category TEXT,
            expiry_date DATE,
            opened_date DATE,
            pao_months INTEGER,
            current_capacity REAL,
            routine_slot TEXT,
            key_ingredients TEXT,
            efficacy TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        
        efficacies = ["Anti-Dullness", "Brightening", "Anti-Wrinkle", "Firming",
                      "Hydrating & Repairing", "Soothing", "Skin Renewal", "Acne Control"]
        c.executemany('INSERT OR IGNORE INTO Efficacies (efficacy_name) VALUES (?)',
                      [(e,) for e in efficacies])
        
        ingredients = [
            ("Resveratrol", "白藜蘆醇"), ("Coenzyme Q10", "輔酶Q10"),
            ("Vitamin E", "維生素E"),
            ("Niacinamide", "維生素B3"), ("Ascorbic Acid", "維生素C"),
            ("Ascorbyl Glucoside", "維生素C醣苷"), ("Ethyl Ascorbic Acid", "乙基維生素C"),
            ("Mandelic Acid", "杏仁酸"), ("Arbutin", "熊果素"),
            ("Tranexamic Acid", "傳明酸"), ("Copper Peptide", "藍銅胜肽"),
            ("Hexapeptide", "六胜肽"), ("Retinol", "維生素A醇"),
            ("Bakuchiol", "補骨脂酚"), ("Ceramide", "神經醯胺"),
            ("Centella Asiatica", "積雪草"), ("Chamomile Extract", "洋甘菊"),
            ("Licorice Root Extract", "甘草"), ("AHA Complex", "12% 複合果酸"),
            ("Panthenol", "維生素B5"), ("Hyaluronic Acid", "玻尿酸"),
            ("Squalane", "角鯊烷"),
        ]
        c.executemany('INSERT OR IGNORE INTO Ingredients (name_en, name_zh) VALUES (?, ?)', ingredients)
        
        eff_map = {r[0]: r[1] for r in c.execute("SELECT efficacy_name, id FROM Efficacies")}
        ing_map = {r[0]: r[1] for r in c.execute("SELECT name_en, id FROM Ingredients")}
        
        mappings = [
            ("Resveratrol", ["Anti-Dullness"]), ("Coenzyme Q10", ["Anti-Dullness"]),
            ("Vitamin E", ["Anti-Dullness", "Anti-Wrinkle"]),
            ("Niacinamide", ["Anti-Dullness", "Brightening", "Acne Control"]),
            ("Ascorbic Acid", ["Anti-Dullness", "Brightening"]),
            ("Ascorbyl Glucoside", ["Anti-Dullness", "Brightening"]),
            ("Ethyl Ascorbic Acid", ["Anti-Dullness", "Brightening"]),
            ("Mandelic Acid", ["Brightening", "Anti-Wrinkle", "Skin Renewal", "Acne Control"]),
            ("Arbutin", ["Brightening", "Acne Control"]),
            ("Tranexamic Acid", ["Brightening"]),
            ("Copper Peptide", ["Anti-Wrinkle", "Firming"]),
            ("Hexapeptide", ["Anti-Wrinkle", "Firming"]),
            ("Retinol", ["Anti-Wrinkle", "Skin Renewal", "Acne Control"]),
            ("Bakuchiol", ["Firming", "Anti-Wrinkle"]),
            ("Ceramide", ["Firming", "Hydrating & Repairing"]),
            ("Centella Asiatica", ["Firming", "Soothing"]),
            ("Chamomile Extract", ["Soothing"]), ("Licorice Root Extract", ["Soothing"]),
            ("AHA Complex", ["Skin Renewal", "Acne Control"]),
            ("Panthenol", ["Hydrating & Repairing"]),
            ("Hyaluronic Acid", ["Hydrating & Repairing"]),
            ("Squalane", ["Hydrating & Repairing"]),
        ]
        
        for ing, effs in mappings:
            for eff in effs:
                c.execute('INSERT OR IGNORE INTO Ingredient_Efficacy_Map (ingredient_id, efficacy_id) VALUES (?, ?)',
                         (ing_map[ing], eff_map[eff]))
        
        conn.commit()
        print("✅ 完整成分矩陣建立完成")

if __name__ == "__main__":
    create_ingredient_knowledge_base()