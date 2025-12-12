// src/pages/AcceptInvite.jsx
import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getCompanyInvite, acceptCompanyInvite, getMe } from "../services/worker/workerCompany";
import SignupForm from "../components/SignupForm";
import AuthLayout from "../layouts/AuthLayout";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processingLogin, setProcessingLogin] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invite token");
      setLoading(false);
      return;
    }

    // Fetch invite details
    getCompanyInvite({ token })
      .then((data) => {
        if (data && data.email) {
          setInvite(data);
          setLoginEmail(data.email);
        } else {
          setError("Invalid or expired invite");
        }
      })
      .catch((err) => {
        setError(err?.message || "Failed to load invite");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // If user is logged in, check email match and auto-accept
  useEffect(() => {
    if (!loading && user && invite) {
      // Email safety check
      if (user.email && invite.email) {
        if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
          setError(
            `You're logged in as ${user.email} but this invite is for ${invite.email}. Please log out and sign in with the correct account.`
          );
          return;
        }
      }

      // Email matches - auto-accept invite
      handleAcceptInvite();
    }
  }, [user, invite, loading]);

  const handleAcceptInvite = async () => {
    if (!token) return;

    setProcessing(true);
    setError("");

    try {
      // Accept the invite
      await acceptCompanyInvite({ token });

      // Wait a moment for membership to be created
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify company_id
      const meData = await getMe();

      if (!meData || !meData.company_id) {
        setError(
          "Failed to join company. Please check your invite token or contact support."
        );
        setProcessing(false);
        return;
      }

      // Success - redirect to start
      navigate("/start", { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to accept invite");
      setProcessing(false);
    }
  };

  const handleSignupSuccess = async () => {
    // After signup, accept the invite
    await handleAcceptInvite();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    setProcessingLogin(true);
    try {
      await login(loginEmail.trim(), loginPassword);
    } catch (err) {
      setLoginError(err?.message || "Login failed");
    } finally {
      setProcessingLogin(false);
    }
  };

  // Loading invite
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  // Error and no invite data -> Invalid invite (use AuthLayout)
  if (error && !invite) {
    return (
      <AuthLayout title="Invalid invite">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/login")}
          className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          Go to Login
        </button>
      </AuthLayout>
    );
  }

  if (!invite) {
    return null;
  }

  // If processing (accepting invite), show loading
  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Joining company...</p>
        </div>
      </div>
    );
  }

  // Logged in with email mismatch -> use AuthLayout
  if (user && error && error.includes("logged in as")) {
    return (
      <AuthLayout title="Email mismatch">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/login")}
          className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          Go to Login
        </button>
      </AuthLayout>
    );
  }

  // Not logged in - show signup or login form
  return (
    <AuthLayout title="You've been invited">
      {invite.companyName && (
        <p className="text-gray-600 mb-4">
          Join <strong>{invite.companyName}</strong>
        </p>
      )}

      {error && !error.includes("logged in as") && (
        <p className="text-sm text-red-600 mt-1 mb-4">{error}</p>
      )}

      {!showLogin ? (
        <>
          <SignupForm
            initialEmail={invite.email}
            showEmailField={false}
            onSuccess={handleSignupSuccess}
          />
          <div className="mt-4 text-center pt-2">
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Already have an account? Sign in
            </button>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowLoginPassword((prev) => !prev)
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showLoginPassword ? "Hide password" : "Show password"
                  }
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {loginError && (
              <p className="text-sm text-red-600 mt-1">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={processingLogin}
              className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processingLogin ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    ></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          <div className="mt-4 text-center pt-2">
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="text-sm text-blue-600 hover:underline"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </>
      )}
    </AuthLayout>
  );
}