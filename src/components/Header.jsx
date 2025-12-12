// src/components/Header.jsx
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/logo/V2.svg" 
            alt="HubGate briefcase logo" 
            className="h-8 sm:h-10 w-auto"
          />
          <nav className="flex items-center gap-3 text-sm">
                <Link to="/products" className="px-3 py-2 rounded hover:bg-gray-100">
                  Products
                </Link>
                <Link to="/buyer" className="px-3 py-2 rounded hover:bg-gray-100">
                  Buyer
                </Link>
                <Link to="/seller" className="px-3 py-2 rounded hover:bg-gray-100">
                  Seller
                </Link>
              </nav>
          </div>

        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={logout}
              className="px-3 py-1 text-sm rounded-lg border hover:bg-gray-50"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
