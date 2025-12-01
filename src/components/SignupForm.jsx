// src/components/SignupForm.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../services/backends/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function SignupForm({ initialEmail = "", onSuccess, showEmailField = true }) {
  const { setRoles } = useAuth();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role"); // buyer or seller
  
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-select role from URL parameter
  useEffect(() => {
    if (roleFromUrl === "buyer" || roleFromUrl === "seller") {
      setRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required");
      return;
    }
    if (!phone.trim()) {
      setError("Phone is required");
      return;
    }
    if (!role) {
      setError("Please select your role (Buyer or Seller)");
      return;
    }
    if (!agreeToTerms) {
      setError("You must agree to the terms");
      return;
    }

    setLoading(true);

    try {
      // Sign up with metadata in options.data
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            ...(role ? { roles: [role] } : {}),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      const user = data?.user ?? null;
      const session = data?.session ?? null;

      if (!user) {
        throw new Error("Sign up failed - no user returned");
      }

      // If no session, email confirmation is required
      if (!session) {
        // Email confirmation is required: account is created but no session yet.
        // Do NOT try to set roles or call onSuccess here.
        setError(
          "Account created. Please check your email to confirm your address, then log in from the login page."
        );
        return; // let finally { setLoading(false) } run
      }

      // Set the role after successful signup (only if we have a session)
      if (role) {
        try {
          await setRoles([role]);
        } catch (roleError) {
          console.error("Failed to set role:", roleError);
          // Continue anyway - user can set role later via RoleChooser
        }
      }

      // Call onSuccess callback with user (only if we have a session)
      if (onSuccess) {
        await onSuccess(user);
      }
    } catch (err) {
      setError(err?.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = !role;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Role Selection - At the top, side by side */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          I am a <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
              role === "buyer"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            } ${!role ? "hover:border-gray-400" : ""}`}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                name="role"
                value="buyer"
                checked={role === "buyer"}
                onChange={(e) => setRole(e.target.value)}
                className="mr-2"
                required
              />
              <div className={`font-medium ${role === "buyer" ? "text-gray-900" : "text-gray-500"}`}>
                Buyer
              </div>
            </div>
            <div className={`text-sm ${role === "buyer" ? "text-gray-700" : "text-gray-400"}`}>
              I want to create RFQs and receive quotations
            </div>
          </label>
          <label
            className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
              role === "seller"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            } ${!role ? "hover:border-gray-400" : ""}`}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                name="role"
                value="seller"
                checked={role === "seller"}
                onChange={(e) => setRole(e.target.value)}
                className="mr-2"
                required
              />
              <div className={`font-medium ${role === "seller" ? "text-gray-900" : "text-gray-500"}`}>
                Seller
              </div>
            </div>
            <div className={`text-sm ${role === "seller" ? "text-gray-700" : "text-gray-400"}`}>
              I want to browse RFQs and send quotations
            </div>
          </label>
        </div>
      </div>

      {/* Rest of the form - disabled until role is selected */}
      <div className={isFormDisabled ? "opacity-50 pointer-events-none" : ""}>
      {showEmailField && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
              disabled={isFormDisabled}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="you@example.com"
          />
        </div>
      )}

      {!showEmailField && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 text-gray-600"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
            disabled={isFormDisabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="••••••••"
          minLength={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          First Name
        </label>
        <input
          type="text"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
            disabled={isFormDisabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="John"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Last Name
        </label>
        <input
          type="text"
          autoComplete="family-name"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
            disabled={isFormDisabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
            disabled={isFormDisabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="+1234567890"
        />
      </div>

      <div className="flex items-start">
        <input
          type="checkbox"
          id="agreeToTerms"
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
            disabled={isFormDisabled}
            className="mt-1 mr-2 disabled:cursor-not-allowed"
          required
        />
          <label htmlFor="agreeToTerms" className={`text-sm ${isFormDisabled ? "text-gray-400" : "text-gray-700"}`}>
          I agree to the terms and conditions
        </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || isFormDisabled}
        className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Creating account..." : "Sign up"}
      </button>
    </form>
  );
}

