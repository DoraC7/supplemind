import { User, Sun, Moon, Bell, Save } from "lucide-react";
import { useEffect, useState } from "react";

const skinTypes = ["油性", "乾性", "混合偏油", "混合偏乾", "敏感肌"];
const skinConcerns = ["痘痘粉刺", "暗沉斑點", "細紋", "泛紅", "毛孔粗大"];

export default function ProfilePage() {
  const [skinType, setSkinType] = useState("混合偏油");
  const [concerns, setConcerns] = useState([]);
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("22:30");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      setSkinType(data.skin_type);
      setConcerns(data.skin_concerns || []);
      setMorningTime(data.morning_routine_time);
      setEveningTime(data.night_routine_time);
    });
  }, []);

  const toggleConcern = (concern) => {
    setConcerns(c => c.includes(concern) ? c.filter(item => item !== concern) : [...c, concern]);
  };

  const saveProfile = async () => {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skin_type: skinType,
        skin_concerns: concerns,
        morning_routine_time: morningTime,
        night_routine_time: eveningTime,
      }),
    });
    alert("更新成功！");
  };

  return (
    <div className="p-6 pb-24">
      <header className="mb-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-3 shadow-md flex items-center justify-center">
          <User className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">愛漂亮的工程師</h2>
        <p className="text-gray-500 text-sm">今天也是精緻的一天 ✨</p>
      </header>

      <div className="bg-white/90 backdrop-blur rounded-3xl p-5 shadow-sm mb-4">
        <h3 className="text-gray-800 font-bold mb-4">膚質與肌膚困擾</h3>
        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-2">我的膚質</p>
          <div className="flex flex-wrap gap-2">
            {skinTypes.map(type => (
              <button
                key={type}
                onClick={() => setSkinType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  skinType === type
                    ? "bg-gray-800 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-gray-600 text-sm mb-2">肌膚困擾（可多選）</p>
          <div className="grid grid-cols-3 gap-2">
            {skinConcerns.map(concern => (
              <button
                key={concern}
                onClick={() => toggleConcern(concern)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  concerns.includes(concern)
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-200"
                }`}
              >
                {concern}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-3xl p-5 shadow-sm mb-6">
        <h3 className="text-gray-800 font-bold mb-4">保養時程提醒</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="text-gray-700">晨間保養</span>
            </div>
            <input
              type="time"
              value={morningTime}
              onChange={e => setMorningTime(e.target.value)}
              className="px-3 py-1 rounded-lg bg-gray-100 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-500" />
              <span className="text-gray-700">夜間保養</span>
            </div>
            <input
              type="time"
              value={eveningTime}
              onChange={e => setEveningTime(e.target.value)}
              className="px-3 py-1 rounded-lg bg-gray-100 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600 text-sm">推播通知</span>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-12 h-6 rounded-full transition-all ${
              notifications ? "bg-blue-400" : "bg-gray-300"
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
              notifications ? "translate-x-6" : "translate-x-1"
            }`}></div>
          </button>
        </div>
      </div>

      <button
        onClick={saveProfile}
        className="w-full py-4 bg-blue-200 text-gray-800 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        更新肌膚檔案
      </button>
    </div>
  );
}