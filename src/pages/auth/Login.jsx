// src/pages/auth/Login.jsx
import { useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isAuthenticated, role, signIn } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(email, password); // <- was auth.login(...)
    } catch (err) {
      console.error("Login error:", err);
      const map = {
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/wrong-password": "Email or password is incorrect.",
        "auth/user-not-found": "No account found for that email.",
        "auth/operation-not-allowed": "Email/password sign-in is disabled in Firebase.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/invalid-api-key": "Invalid API key. Check your .env values.",
      };
      setError(map[err.code] || `${err.code || "auth/error"} — ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // If already logged in, bounce to their home
  if (isAuthenticated) {
    return <Navigate to={dashboardHome(role)} state={{ from }} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

function dashboardHome(role) {
  if (role === "super_admin") return "/admin";
  if (role === "brand_manager") return "/brand";
  return "/";
}
