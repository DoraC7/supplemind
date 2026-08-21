import { Search, Edit, AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

const categoryColors = {
  "清潔": "bg-blue-100",
  "化妝水": "bg-purple-100",
  "精華": "bg-emerald-100",
  "乳霜": "bg-amber-100",
  "防曬": "bg-rose-100",
  "其他": "bg-gray-100",
};

const categories = ["清潔", "化妝水", "精華", "乳霜", "防曬", "面膜", "眼霜", "唇部", "身體保養", "酸類", "A醇/A醛", "抗痘", "其他"];
const statusOptions = [
  { value: "", label: "全部狀態" },
  { value: "unopened", label: "未開封" },
  { value: "in_use", label: "使用中" },
  { value: "finished", label: "已用完" },
  { value: "paused", label: "暫停使用" },
  { value: "unsuitable", label: "不適合" },
  { value: "discarded", label: "已丟棄" }
];
const usageTimeOptions = [
  { value: "", label: "全部時段" },
  { value: "morning", label: "早上" },
  { value: "night", label: "晚上" },
  { value: "both", label: "早晚皆可" },
  { value: "spot", label: "局部使用" },
  { value: "special", label: "特殊情況" }
];
const routineSlotOptions = [
  { value: "", label: "全部流程" },
  { value: "morning", label: "晨間" },
  { value: "night", label: "夜間" },
  { value: "none", label: "不加入" }
];

const statusLabels = {
  "unopened": "未開封",
  "in_use": "使用中",
  "finished": "已用完",
  "paused": "暫停使用",
  "unsuitable": "不適合",
  "discarded": "已丟棄"
};

function EditProductModal({ product, onClose, onSave }) {
  const [capacity, setCapacity] = useState(product.current_capacity || 100);
  const [routineSlot, setRoutineSlot] = useState(product.routine_slot || "none");
  const [productStatus, setProductStatus] = useState(product.product_status || "unopened");

  const handleSave = async () => {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_capacity: capacity,
        routine_slot: routineSlot === "none" ? null : routineSlot,
        product_status: productStatus
      })
    });
    onSave();
    onClose();
  };

  const statusOptionsList = ["unopened", "in_use", "finished", "paused", "unsuitable", "discarded"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-6 w-80 mx-4">
        <h3 className="text-gray-800 font-bold mb-4">編輯 {product.name}</h3>
        
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-2">剩餘量 ({capacity}%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={capacity}
            onChange={e => setCapacity(+e.target.value)}
            className="w-full"
          />
          <div className="flex gap-1 mt-2">
            {[100, 75, 50, 25].map(v => (
              <button
                key={v}
                onClick={() => setCapacity(v)}
                className={`flex-1 py-1 rounded text-xs ${capacity === v ? "bg-blue-500 text-white" : "bg-gray-100"}`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-2">狀態</label>
          <select
            value={productStatus}
            onChange={e => setProductStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-gray-100"
          >
            {statusOptionsList.map(s => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-2">加入保養流程</label>
          <div className="flex gap-2">
            {["none", "morning", "night"].map(slot => (
              <button
                key={slot}
                onClick={() => setRoutineSlot(slot)}
                className={`flex-1 py-2 rounded-xl text-xs ${routineSlot === slot ? "bg-blue-500 text-white" : "bg-gray-100"}`}
              >
                {slot === "morning" ? "晨間" : slot === "night" ? "夜間" : "不加入"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-xl">取消</button>
          <button onClick={handleSave} className="flex-1 py-2 bg-blue-500 text-white rounded-xl">儲存</button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [matchScores, setMatchScores] = useState({});
  const [filters, setFilters] = useState({
    category: "",
    product_status: "",
    usage_time: "",
    routine_slot: ""
  });

  useEffect(() => {
    fetchProducts();
    fetch("/api/recommendations")
      .then(r => r.json())
      .then(recs => {
        const map = {};
        recs.forEach(rec => { map[rec.id] = rec.match_score; });
        setMatchScores(map);
      });
  }, []);

  const fetchProducts = () => {
    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.product_status) params.append("product_status", filters.product_status);
    if (filters.usage_time) params.append("usage_time", filters.usage_time);
    if (filters.routine_slot) params.append("routine_slot", filters.routine_slot);
    fetch(`/api/products?${params}`).then(r => r.json()).then(setProducts);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: "", product_status: "", usage_time: "", routine_slot: "" });
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getCapacityColor = (remaining) => {
    if (remaining >= 75) return "bg-emerald-400";
    if (remaining >= 50) return "bg-amber-400";
    if (remaining >= 25) return "bg-orange-400";
    return "bg-rose-400";
  };

  const getExpiryBadge = (p) => {
    const daysRemaining = p.days_remaining || 0;
    const monthsRemaining = Math.floor((daysRemaining || 0) / 30);
    const status = p.status || "";

    if (status.includes("expired")) {
      return { text: "已過期", color: "bg-rose-100 text-rose-600" };
    }
    if (status.includes("expiring_soon")) {
      return { text: "快過期", color: "bg-orange-100 text-orange-600" };
    }
    if (p.opened_date) {
      return { text: `開封剩 ${monthsRemaining} 個月`, color: "bg-blue-100 text-blue-600" };
    }
    if (p.expiry_date) {
      return { text: `到期剩 ${monthsRemaining} 個月`, color: "bg-amber-100 text-amber-600" };
    }
    return { text: statusLabels[p.product_status] || "未開封", color: "bg-gray-100 text-gray-600" };
  };

  const FilterSelect = ({ label, value, options, onChange }) => (
    <div>
      <label className="block text-gray-600 text-xs mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-white/90 text-sm border border-gray-200"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="p-6 pb-24 min-h-screen bg-slate-50">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">我的化妝台</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            showFilters ? "bg-blue-500 text-white" : "bg-white/90 text-gray-700 border border-gray-200"
          }`}
        >
          {showFilters ? "隱藏篩選" : "顯示篩選"}
        </button>
      </header>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜尋品名..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/90 rounded-full shadow-sm focus:outline-none"
        />
      </div>

      {showFilters && (
        <div className="bg-white/90 rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium text-sm">篩選條件</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-gray-500 flex items-center gap-1">
                <X className="w-3 h-3" /> 清除全部
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FilterSelect
              label="分類"
              value={filters.category}
              onChange={v => updateFilter("category", v)}
              options={[{ value: "", label: "全部分類" }, ...categories.map(c => ({ value: c, label: c }))]}
            />
            <FilterSelect
              label="使用狀態"
              value={filters.product_status}
              onChange={v => updateFilter("product_status", v)}
              options={statusOptions}
            />
            <FilterSelect
              label="使用時段"
              value={filters.usage_time}
              onChange={v => updateFilter("usage_time", v)}
              options={usageTimeOptions}
            />
            <FilterSelect
              label="保養流程"
              value={filters.routine_slot}
              onChange={v => updateFilter("routine_slot", v)}
              options={routineSlotOptions}
            />
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.category && (
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
              分類: {filters.category}
              <button onClick={() => updateFilter("category", "")} className="ml-1">×</button>
            </span>
          )}
          {filters.product_status && (
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
              狀態: {statusLabels[filters.product_status]}
              <button onClick={() => updateFilter("product_status", "")} className="ml-1">×</button>
            </span>
          )}
          {filters.usage_time && (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">
              時段: {usageTimeOptions.find(o => o.value === filters.usage_time)?.label}
              <button onClick={() => updateFilter("usage_time", "")} className="ml-1">×</button>
            </span>
          )}
          {filters.routine_slot && (
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">
              流程: {routineSlotOptions.find(o => o.value === filters.routine_slot)?.label}
              <button onClick={() => updateFilter("routine_slot", "")} className="ml-1">×</button>
            </span>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-10">找不到相符的保養品</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(p => {
            const remaining = p.current_capacity || 100;
            const badge = getExpiryBadge(p);
            const riskTags = p.risk_tags || [];

            return (
              <div key={p.id} className="bg-white/90 rounded-2xl p-4 shadow-sm flex flex-col">
                <div className={`w-full aspect-square rounded-xl mb-3 ${categoryColors[p.category] || categoryColors["其他"]}`}></div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-800 text-sm flex-1">{p.name}</h3>
                  <button
                    onClick={() => setEditingProduct(p)}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <Edit className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
                <p className="text-gray-400 text-xs mb-2">{p.brand || "品牌名稱"}</p>

                {matchScores[p.id] != null && (
                  <span className="self-start text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium mb-2">
                    🎯 契合度 {matchScores[p.id]}%
                  </span>
                )}

                {riskTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {riskTags.includes("需防曬") && <span className="text-xs">☀️ 需防曬</span>}
                    {riskTags.includes("與A醇禁忌") && <span className="text-xs">🎯 A醇禁忌</span>}
                    {riskTags.includes("與酸類禁忌") && <span className="text-xs">🧼 酸類禁忌</span>}
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
                    {badge.text}
                  </span>
                  {remaining <= 25 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-600 animate-pulse">
                      ⚠️ 快用完
                    </span>
                  )}
                </div>
                <div className="mt-auto">
                  <p className="text-gray-600 text-xs mb-1">剩餘約 {remaining}%</p>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getCapacityColor(remaining)}`} style={{ width: `${remaining}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={fetchProducts}
        />
      )}
    </div>
  );
}