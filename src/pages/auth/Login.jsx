// src/pages/auth/Login.jsx
import { useState, useEffect } from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/auth-context";
import postAuthRedirect from "../../lib/postAuthRedirect";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);

  const { isAuthenticated, role, user, signIn } = useAuth();
  const location = useLocation();
  
  // Note: redirect handled after auth via postAuthRedirect

  // Clear rate limit status after 30 seconds
  useEffect(() => {
    let timer;
    if (isRateLimited) {
      timer = setTimeout(() => {
        setIsRateLimited(false);
      }, 30000); // 30 seconds
    }
    return () => clearTimeout(timer);
  }, [isRateLimited]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsRateLimited(false);

    try {
      await signIn(email, password);
      // Login successful - redirection will happen automatically via the isAuthenticated check
    } catch (err) {
      console.error("Login error:", err);
      const errorCode = err.code || "auth/unknown-error";
      
      // Check specifically for rate limiting
      if (errorCode === "auth/too-many-requests") {
        setIsRateLimited(true);
      }
      
      const errorMessages = {
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/wrong-password": "Email or password is incorrect.",
        "auth/user-not-found": "No account found with that email.",
        "auth/operation-not-allowed": "Email/password sign-in is disabled.",
        "auth/invalid-api-key": "Invalid API key. Please contact support.",
        "auth/too-many-requests": "Too many failed login attempts. For security reasons, this account is temporarily locked. Please try again in a few minutes or reset your password.",
        "auth/network-request-failed": "Network error. Please check your internet connection."
      };
      
      setError(errorMessages[errorCode] || `Error: ${err.message || "Unknown authentication error"}`);
    } finally {
      setLoading(false);
    }
  }

  // If already logged in, redirect to appropriate landing page
  if (isAuthenticated) {
    const landing = postAuthRedirect({ role, approved: user?.approved }, { search: location.search });
    return <Navigate to={landing} state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        {error && (
          <div className={`mb-4 p-3 rounded ${isRateLimited ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"}`}>
            <p>{error}</p>
            {isRateLimited && (
              <p className="mt-2 text-sm">
                This is a security feature to protect accounts from unauthorized access.
                <br />
                <Link to="/" className="underline">Return to home page</Link>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
              disabled={isRateLimited}
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
              disabled={isRateLimited}
            />
          </div>

          <button
            type="submit"
            disabled={loading || isRateLimited}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Logging in..." : isRateLimited ? "Account Temporarily Locked" : "Login"}
          </button>
          
          {isRateLimited && (
            <div className="mt-4 text-center">
              <Link to="/" className="text-blue-600 hover:text-blue-800">
                Return to Home Page
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
