import { Save, ChevronLeft, AlertTriangle } from "lucide-react";
import { useState } from "react";

const categories = ["清潔", "化妝水", "精華", "乳霜", "防曬", "面膜", "眼霜", "唇部", "身體保養", "酸類", "A醇/A醛", "抗痘", "其他"];
const routineSlots = ["none", "morning", "night"];
const paoOptions = [3, 6, 12, 24, 36, 0];
const statuses = ["unopened", "in_use", "finished", "paused", "unsuitable", "discarded"];
const usageTimes = ["morning", "night", "both", "spot", "special"];
const riskTags = ["需防曬", "不建議白天用", "與酸類禁忌", "與A醇禁忌", "敏感時停用", "孕期慎用", "香味明顯", "容易致痘"];

const allIngredients = [
    { en: "Resveratrol", zh: "白藜蘆醇", eff: "Anti-Dullness" },
    { en: "Coenzyme Q10", zh: "輔酶Q10", eff: "Anti-Dullness" },
    { en: "Vitamin E", zh: "維生素E", eff: "Anti-Dullness" },
    { en: "Niacinamide", zh: "維生素B3", eff: "Anti-Dullness" },
    { en: "Ascorbic Acid", zh: "維生素C", eff: "Anti-Dullness" },
    { en: "Ascorbyl Glucoside", zh: "維生素C醣苷", eff: "Anti-Dullness" },
    { en: "Ethyl Ascorbic Acid", zh: "乙基維生素C", eff: "Anti-Dullness" },
    { en: "Mandelic Acid", zh: "杏仁酸", eff: "Brightening" },
    { en: "Arbutin", zh: "熊果素", eff: "Brightening" },
    { en: "Tranexamic Acid", zh: "傳明酸", eff: "Brightening" },
    { en: "Retinol", zh: "維生素A醇", eff: "Anti-Wrinkle" },
    { en: "Bakuchiol", zh: "補骨脂酚", eff: "Firming" },
    { en: "Copper Peptide", zh: "藍銅胜肽", eff: "Anti-Wrinkle" },
    { en: "Hexapeptide", zh: "六胜肽", eff: "Anti-Wrinkle" },
    { en: "Ceramide", zh: "神經醯胺", eff: "Firming" },
    { en: "Centella Asiatica", zh: "積雪草", eff: "Firming" },
    { en: "Chamomile Extract", zh: "洋甘菊", eff: "Soothing" },
    { en: "Licorice Root Extract", zh: "甘草", eff: "Soothing" },
    { en: "AHA Complex", zh: "12% 複合果酸", eff: "Skin Renewal" },
    { en: "Panthenol", zh: "維生素B5", eff: "Hydrating & Repairing" },
    { en: "Hyaluronic Acid", zh: "玻尿酸", eff: "Hydrating & Repairing" },
    { en: "Squalane", zh: "角鯊烷", eff: "Hydrating & Repairing" },
];

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "精華",
    photo_url: "",
    capacity_value: "",
    capacity_unit: "ml",
    expiry_date: "",
    is_opened: false,
    opened_date: "",
    pao_months: 6,
    current_capacity: 100,
    product_status: "unopened",
    routine_slot: "none",
    usage_time: "morning",
    key_ingredients: [],
    risk_tags: [],
  });
  const [markdownText, setMarkdownText] = useState("");

  const importMarkdown = async () => {
    if (!markdownText.trim()) return alert("請先貼上保養品 Markdown 內容！");

    const response = await fetch("/api/products/import-markdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: markdownText }),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.detail || "匯入失敗");
      return;
    }

    alert(`成功匯入 ${data.count} 筆保養品資料`);
    setMarkdownText("");
  };

  const submit = async () => {
    if (!formData.name) return alert("請輸入保養品名稱！");
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        photo_url: formData.photo_url || null,
        capacity_value: formData.capacity_value ? parseFloat(formData.capacity_value) : null,
        capacity_unit: formData.capacity_unit,
        expiry_date: formData.expiry_date || null,
        opened_date: formData.is_opened ? formData.opened_date : null,
        pao_months: formData.pao_months,
        current_capacity: formData.current_capacity,
        product_status: formData.product_status,
        routine_slot: formData.routine_slot === "none" ? null : formData.routine_slot,
        usage_time: formData.usage_time,
        key_ingredients: formData.key_ingredients,
        risk_tags: formData.risk_tags,
      }),
    });
    alert(`成功新增: ${formData.name}`);
  };

  const statusLabels = {
    unopened: "未開封",
    in_use: "使用中",
    finished: "已用完",
    paused: "暫停使用",
    unsuitable: "不適合",
    discarded: "已丟棄"
  };

  const usageLabels = {
    morning: "早上",
    night: "晚上",
    both: "早晚皆可",
    spot: "局部使用",
    special: "特殊情況"
  };

  const toggleRiskTag = (tag) => {
    setFormData({
      ...formData,
      risk_tags: formData.risk_tags.includes(tag)
        ? formData.risk_tags.filter(t => t !== tag)
        : [...formData.risk_tags, tag]
    });
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-slate-50">
      <header className="mb-6 flex items-center gap-3">
        <button className="p-2 rounded-full bg-white/90 shadow-sm">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">✨ 收編新保養品</h1>
      </header>

      <div className="bg-white/90 backdrop-blur rounded-3xl p-5 shadow-sm space-y-5">
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">匯入 Markdown 庫存</h2>
          <textarea
            value={markdownText}
            onChange={e => setMarkdownText(e.target.value)}
            rows={6}
            placeholder="貼上你從 .md 檔案複製的保養品表格內容..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={importMarkdown}
            className="mt-3 w-full py-3 bg-slate-800 text-white rounded-xl font-medium"
          >
            匯入庫存資料
          </button>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">產品名稱</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="輸入產品名稱"
            className="w-full px-4 py-3 rounded-xl bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-700 font-medium mb-2">品牌</label>
            <input
              type="text"
              value={formData.brand}
              onChange={e => setFormData({...formData, brand: e.target.value})}
              placeholder="品牌名稱"
              className="w-full px-4 py-3 rounded-xl bg-white/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">容量</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.capacity_value}
                onChange={e => setFormData({...formData, capacity_value: e.target.value})}
                placeholder="150"
                className="flex-1 px-3 py-3 rounded-xl bg-white/50 focus:outline-none"
              />
              <select
                value={formData.capacity_unit}
                onChange={e => setFormData({...formData, capacity_unit: e.target.value})}
                className="px-3 py-3 rounded-xl bg-white/50"
              >
                <option value="ml">ml</option>
                <option value="g">g</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-700 font-medium mb-2">分類</label>
            <select
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-white/50"
            >
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">使用狀態</label>
            <select
              value={formData.product_status}
              onChange={e => setFormData({...formData, product_status: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-white/50"
            >
              {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-700 font-medium mb-2">加入保養流程</label>
            <div className="flex gap-2">
              {routineSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setFormData({...formData, routine_slot: slot})}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                    formData.routine_slot === slot
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {slot === "morning" ? "晨間" : slot === "night" ? "夜間" : "不加入"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">使用時段</label>
            <select
              value={formData.usage_time}
              onChange={e => setFormData({...formData, usage_time: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-white/50"
            >
              {usageTimes.map(t => <option key={t} value={t}>{usageLabels[t]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">核心成分</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {allIngredients.map(ing => (
              <button
                key={ing.en}
                onClick={() => {
                  const isSelected = formData.key_ingredients.includes(ing.en);
                  setFormData({
                    ...formData,
                    key_ingredients: isSelected
                      ? formData.key_ingredients.filter(i => i !== ing.en)
                      : [...formData.key_ingredients, ing.en]
                  });
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  formData.key_ingredients.includes(ing.en)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {ing.zh}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-orange-50/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <label className="text-gray-700 font-medium">風險標籤（可複選）</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {riskTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleRiskTag(tag)}
                className={`px-2 py-1 rounded-full text-xs ${
                  formData.risk_tags.includes(tag)
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50/50 rounded-2xl p-4 space-y-4">
          <h4 className="text-gray-700 font-medium">瓶身到期日</h4>
          <div>
            <label className="block text-gray-600 text-sm mb-1">到期日 (Expiry Date)</label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={e => setFormData({...formData, expiry_date: e.target.value})}
              className="w-full px-4 py-2 rounded-xl bg-white/70 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">我今天已經開封了</span>
            <button
              onClick={() => setFormData({...formData, is_opened: !formData.is_opened})}
              className={`w-12 h-6 rounded-full transition-all ${
                formData.is_opened ? "bg-blue-400" : "bg-gray-300"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                formData.is_opened ? "translate-x-6" : "translate-x-1"
              }`}></div>
            </button>
          </div>

          {formData.is_opened && (
            <div>
              <label className="block text-gray-600 text-sm mb-1">開封日期</label>
              <input
                type="date"
                value={formData.opened_date}
                onChange={e => setFormData({...formData, opened_date: e.target.value})}
                className="w-full px-4 py-2 rounded-xl bg-white/70 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-600 text-sm mb-2">開封後可以放幾個月？(PAO)</label>
            <div className="flex gap-2 flex-wrap">
              {paoOptions.map(m => (
                <button
                  key={m}
                  onClick={() => setFormData({...formData, pao_months: m})}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                    formData.pao_months === m
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {m === 0 ? "未標示" : `${m}M`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            目前剩餘量 ({formData.current_capacity}%)
          </label>
          <div className="grid grid-cols-5 gap-1 mb-2">
            {[100, 75, 50, 25, 0].map(v => (
              <button
                key={v}
                onClick={() => setFormData({...formData, current_capacity: v})}
                className={`py-2 rounded-xl text-sm font-medium ${
                  formData.current_capacity === v ? "bg-blue-500 text-white" : "bg-gray-100"
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.current_capacity}
            onChange={e => setFormData({...formData, current_capacity: +e.target.value})}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
          />
        </div>

        <button
          onClick={submit}
          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
        >
          <Save className="w-5 h-5" />
          存入化妝台
        </button>
      </div>
    </div>
  );
}