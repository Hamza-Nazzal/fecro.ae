// src/pages/AcceptInvite.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/backends/supabase";
import { getCompanyInvite, acceptCompanyInvite, getMe } from "../services/worker/workerCompany";
import SignupForm from "../components/SignupForm";

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
  const [loginError, setLoginError] = useState("");
  const [processing, setProcessing] = useState(false);

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
          setError(`You're logged in as ${user.email} but this invite is for ${invite.email}. Please log out and sign in with the correct account.`);
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
        setError("Failed to join company. Please check your invite token or contact support.");
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

  const handleSignupSuccess = async (newUser) => {
    // After signup, accept the invite
    await handleAcceptInvite();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      await login(loginEmail.trim(), loginPassword);
      // Login will trigger the useEffect that checks email and accepts invite
    } catch (err) {
      setLoginError(err?.message || "Login failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Invalid Invite</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  // If processing (accepting invite), show loading
  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Joining company...</p>
        </div>
      </div>
    );
  }

  // If user is logged in but email mismatch, show error
  if (user && error && error.includes("logged in as")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Email Mismatch</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Not logged in - show signup or login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          You've been invited
        </h1>
        {invite.companyName && (
          <p className="text-gray-600 mb-4">
            Join <strong>{invite.companyName}</strong>
          </p>
        )}

        {error && !error.includes("logged in as") && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {!showLogin ? (
          <>
            <SignupForm
              initialEmail={invite.email}
              showEmailField={false}
              onSuccess={handleSignupSuccess}
            />
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Already have an account? Sign in
              </button>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700"
              >
                Sign in
              </button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

