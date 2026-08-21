import { Search, Package, Cookie, Droplet, Sun, Moon, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [profile, setProfile] = useState({ skin_type: "混合偏油", morning_routine_time: "08:00", night_routine_time: "22:30" });
  const [stats, setStats] = useState({ expiring_soon_count: 0, low_stock_count: 0 });
  const [products, setProducts] = useState([]);
  const [completedToday, setCompletedToday] = useState(new Set());
  const [routineConflicts, setRoutineConflicts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showExpiryDetail, setShowExpiryDetail] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(setProfile);
    fetch("/api/stats").then(r => r.json()).then(setStats);
    fetch("/api/products").then(r => r.json()).then(setProducts);
    fetch("/api/routine-conflicts").then(r => r.json()).then(data => setRoutineConflicts(data.conflicts || []));
    fetch("/api/recommendations").then(r => r.json()).then(setRecommendations);
  }, []);

  const morningProducts = products.filter(p => p.routine_slot === "morning");
  const nightProducts = products.filter(p => p.routine_slot === "night");

  const toggleComplete = (productId) => {
    setCompletedToday(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const lowStockProducts = products.filter(p => p.current_capacity <= 25);

  const expiredProducts = products.filter(p => (p.status || "").includes("expired"));
  const expiringSoonProducts = products
    .filter(p => (p.status || "").includes("expiring_soon"))
    .sort((a, b) => (a.days_remaining ?? 0) - (b.days_remaining ?? 0));

  const RoutineCard = ({ title, icon: Icon, iconColor, time, items }) => (
    <div className="bg-white/90 rounded-3xl p-5 shadow-sm">
      <h3 className={`text-gray-700 font-medium mb-3 flex items-center gap-2`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {title} ({time})
      </h3>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-gray-400 text-sm">尚未加入保養品</p>
        ) : (
          items.map(product => {
            const hasRetinol = product.key_ingredients?.includes("Retinol");
            const hasRisk = product.risk_tags?.includes("需防曬");
            return (
              <label key={product.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={completedToday.has(product.id)}
                  onChange={() => toggleComplete(product.id)}
                  className="w-5 h-5 rounded-full border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500"
                />
                <span className={`text-gray-700 text-sm ${completedToday.has(product.id) ? "line-through text-gray-400" : ""}`}>
                  {product.name}
                  {hasRetinol && <span className="ml-1 text-amber-500" title="需防曬">☀️</span>}
                  {hasRisk && <span className="ml-1 text-rose-500" title="需防曬">⚠️</span>}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 pb-24 min-h-screen bg-slate-50">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">早安，愛漂亮的工程師 ✨</h1>
          <p className="text-gray-500 text-sm">目前膚質：{profile.skin_type}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gray-200 shadow-md flex items-center justify-center">
          <Sun className="w-6 h-6 text-amber-500" />
        </div>
      </header>

      <div className="space-y-4 mb-6">
        <RoutineCard 
          title="☀️ 晨間保養"
          icon={Sun}
          iconColor="text-amber-500"
          time={profile.morning_routine_time || "08:00"}
          items={morningProducts}
        />
        <RoutineCard 
          title="🌙 夜間保養"
          icon={Moon}
          iconColor="text-indigo-500"
          time={profile.night_routine_time || "22:30"}
          items={nightProducts}
        />
      </div>

      {routineConflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-amber-700 font-medium text-sm">⚠️ 保養流程衝突提醒</p>
          </div>
          <ul className="space-y-1.5">
            {routineConflicts.map((conflict, idx) => (
              <li key={idx} className="text-amber-700 text-xs">
                • {conflict.message}
                <span className="text-amber-500">（{conflict.products.join("、")}）</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="bg-rose-50 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-rose-700 font-medium text-sm mb-1">⚠️ 補貨提醒</p>
            <p className="text-rose-600 text-xs">
              {lowStockProducts.map(p => p.name).join("、")} 剩餘低於 25%，建議補貨
            </p>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="bg-white/90 rounded-3xl p-5 shadow-sm mb-6">
          <h3 className="text-gray-700 font-medium mb-3">✨ 今日推薦（與你膚況最契合）</h3>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map(rec => (
              <div key={rec.id} className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm font-medium">{rec.name}</p>
                  <p className="text-gray-400 text-xs">{rec.brand}{rec.efficacy ? ` · ${rec.efficacy}` : ""}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                  契合度 {rec.match_score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          onClick={() => setShowExpiryDetail(v => !v)}
          className="bg-rose-100/50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm"
        >
          <Cookie className="w-8 h-8 text-rose-500 mb-2" />
          <p className="text-gray-700 text-center text-sm font-medium">⚠️ {stats.expiring_soon_count} 件快過期</p>
        </button>
        <div className="bg-emerald-100/50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
          <Droplet className="w-8 h-8 text-emerald-500 mb-2" />
          <p className="text-gray-700 text-center text-sm font-medium">💧 {stats.low_stock_count} 件快用完</p>
        </div>
      </div>

      {showExpiryDetail && (expiredProducts.length > 0 || expiringSoonProducts.length > 0) && (
        <div className="bg-white/90 rounded-2xl p-4 shadow-sm mb-6 space-y-3">
          {expiredProducts.length > 0 && (
            <div>
              <p className="text-rose-600 text-xs font-medium mb-1">❌ 已過期</p>
              <ul className="space-y-1">
                {expiredProducts.map(p => (
                  <li key={p.id} className="text-gray-600 text-xs flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-rose-500">{Math.abs(p.days_remaining)} 天前過期</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {expiringSoonProducts.length > 0 && (
            <div>
              <p className="text-amber-600 text-xs font-medium mb-1">⏰ 30天內過期</p>
              <ul className="space-y-1">
                {expiringSoonProducts.map(p => (
                  <li key={p.id} className="text-gray-600 text-xs flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-amber-500">剩 {p.days_remaining} 天</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showExpiryDetail && expiredProducts.length === 0 && expiringSoonProducts.length === 0 && (
        <div className="bg-white/90 rounded-2xl p-4 shadow-sm mb-6">
          <p className="text-gray-400 text-xs text-center">目前沒有即將過期或已過期的產品 🎉</p>
        </div>
      )}
    </div>
  );
}