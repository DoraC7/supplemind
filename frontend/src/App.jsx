import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, Package, Plus, User } from "lucide-react";
import HomePage from "./pages/Home.jsx";
import ProductsPage from "./pages/Products.jsx";
import AddProductPage from "./pages/AddProduct.jsx";
import ProfilePage from "./pages/Profile.jsx";

function Navigation() {
  const location = useLocation();
  const navItems = [
    { path: "/", icon: HomeIcon, label: "Home" },
    { path: "/products", icon: Package, label: "Products" },
    { path: "/add", icon: Plus, label: "Add" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 rounded-t-3xl shadow-md">
      <div className="flex justify-around py-3">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center p-2 rounded-2xl transition-all ${
              location.pathname === path
                ? "text-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 pb-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/add" element={<AddProductPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  );
}