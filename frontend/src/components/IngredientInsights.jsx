import { Sparkles } from "lucide-react";

const EFFICACY_COLORS = {
  "Anti-Dullness": "bg-orange-100 text-orange-700",
  "Brightening": "bg-yellow-100 text-yellow-700",
  "Anti-Wrinkle": "bg-purple-100 text-purple-700",
  "Firming": "bg-pink-100 text-pink-700",
  "Hydrating & Repairing": "bg-blue-100 text-blue-700",
  "Soothing": "bg-green-100 text-green-700",
  "Skin Renewal": "bg-rose-100 text-rose-700",
  "Acne Control": "bg-indigo-100 text-indigo-700",
};

const EFFICACY_ICONS = {
  "Anti-Dullness": "🛡️",
  "Brightening": "☀️",
  "Anti-Wrinkle": "✨",
  "Firming": "💪",
  "Hydrating & Repairing": "💧",
  "Soothing": "🌿",
  "Skin Renewal": "🧼",
  "Acne Control": "🎯",
};

const INGREDIENT_EFFICACY_MAP = {
  "Resveratrol": "Anti-Dullness",
  "Coenzyme Q10": "Anti-Dullness",
  "Vitamin E": "Anti-Dullness",
  "Niacinamide": "Anti-Dullness",
  "Ascorbic Acid": "Anti-Dullness",
  "Ascorbyl Glucoside": "Anti-Dullness",
  "Ethyl Ascorbic Acid": "Anti-Dullness",
  "Mandelic Acid": "Brightening",
  "Arbutin": "Brightening",
  "Tranexamic Acid": "Brightening",
  "Retinol": "Anti-Wrinkle",
  "Bakuchiol": "Firming",
  "Copper Peptide": "Anti-Wrinkle",
  "Hexapeptide": "Anti-Wrinkle",
  "Ceramide": "Firming",
  "Centella Asiatica": "Firming",
  "Chamomile Extract": "Soothing",
  "Licorice Root Extract": "Soothing",
  "AHA Complex": "Skin Renewal",
  "Panthenol": "Hydrating & Repairing",
  "Hyaluronic Acid": "Hydrating & Repairing",
  "Squalane": "Hydrating & Repairing",
};

const INGREDIENT_NAMES = {
  "Resveratrol": { zh: "白藜蘆醇", en: "Resveratrol" },
  "Coenzyme Q10": { zh: "輔酶Q10", en: "Coenzyme Q10" },
  "Vitamin E": { zh: "維生素E", en: "Vitamin E" },
  "Niacinamide": { zh: "維生素B3", en: "Niacinamide" },
  "Ascorbic Acid": { zh: "維生素C", en: "Ascorbic Acid" },
  "Ascorbyl Glucoside": { zh: "維生素C醣苷", en: "Ascorbyl Glucoside" },
  "Ethyl Ascorbic Acid": { zh: "乙基維生素C", en: "Ethyl Ascorbic Acid" },
  "Mandelic Acid": { zh: "杏仁酸", en: "Mandelic Acid" },
  "Arbutin": { zh: "熊果素", en: "Arbutin" },
  "Tranexamic Acid": { zh: "傳明酸", en: "Tranexamic Acid" },
  "Retinol": { zh: "維生素A醇", en: "Retinol" },
  "Bakuchiol": { zh: "補骨脂酚", en: "Bakuchiol" },
  "Copper Peptide": { zh: "藍銅胜肽", en: "Copper Peptide" },
  "Hexapeptide": { zh: "六胜肽", en: "Hexapeptide" },
  "Ceramide": { zh: "神經醯胺", en: "Ceramide" },
  "Centella Asiatica": { zh: "積雪草", en: "Centella Asiatica" },
  "Chamomile Extract": { zh: "洋甘菊", en: "Chamomile Extract" },
  "Licorice Root Extract": { zh: "甘草", en: "Licorice Root Extract" },
  "AHA Complex": { zh: "12% 複合果酸", en: "AHA Complex" },
  "Panthenol": { zh: "維生素B5", en: "Panthenol" },
  "Hyaluronic Acid": { zh: "玻尿酸", en: "Hyaluronic Acid" },
  "Squalane": { zh: "角鯊烷", en: "Squalane" },
};

export default function IngredientInsights({ product, smartMatch }) {
  const ingredients = smartMatch?.key_ingredients || [];
  const matchScore = smartMatch?.match_score || 0;
  const matchedConcerns = smartMatch?.matched_concerns || [];
  const pairingAdvice = smartMatch?.pairing_advice;

  const getCategoryStyle = (ing) => {
    const eff = INGREDIENT_EFFICACY_MAP[ing] || "Hydrating & Repairing";
    return {
      color: EFFICACY_COLORS[eff],
      icon: EFFICACY_ICONS[eff]
    };
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-gray-800 font-bold mb-1">{product?.name || "產品名稱"}</h3>
        <p className="text-gray-500 text-sm">
          Contains {ingredients.map(i => INGREDIENT_NAMES[i]?.zh || i).join(" & ")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ingredients.map((ing) => {
          const style = getCategoryStyle(ing);
          const name = INGREDIENT_NAMES[ing] || { zh: ing, en: ing };
          return (
            <span
              key={ing}
              className={`px-3 py-1 rounded-full text-xs font-medium ${style.color}`}
              title={name.en}
            >
              {style.icon} {name.zh}
            </span>
          );
        })}
      </div>

      {matchScore > 0 && (
        <div className="bg-white/90 rounded-2xl p-4 shadow-sm">
          <h4 className="text-gray-700 font-medium mb-2">
            🎯 與你的肌膚檔案契合度 {matchScore}%
          </h4>
          <p className="text-gray-600 text-sm">
            這款產品含有 {ingredients.map(i => INGREDIENT_NAMES[i]?.zh || i).join("、")}，
            非常適合用來改善你在個人檔案中設定的 [{matchedConcerns.join("、")}] 困擾。
          </p>
        </div>
      )}

      {pairingAdvice && (
        <div className="bg-gray-50/50 rounded-xl p-3">
          <p className="text-gray-600 text-sm">
            💡 專業建議：{pairingAdvice}
          </p>
        </div>
      )}
    </div>
  );
}