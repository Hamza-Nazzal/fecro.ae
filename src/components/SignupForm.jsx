// src/components/SignupForm.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../services/backends/supabase";
import { useAuth } from "../contexts/AuthContext";
import { normalizePhoneNumber } from "../utils/phone";

export default function SignupForm({ initialEmail = "", onSuccess, showEmailField = true }) {
  const { setRoles } = useAuth();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role"); // buyer or seller
  
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
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

  // Format local UAE phone number (10 digits) for display with spacing
  const formatLocalUaePhone = (value) => {
    // Keep only digits, max 10
    const digits = value.replace(/\D/g, "").slice(0, 10);
    
    if (digits.length <= 3) {
      // e.g. "055"
      return digits;
    } else if (digits.length <= 6) {
      // e.g. "055 123"
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else {
      // e.g. "055 123 4567"
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
  };

  // Validate UAE phone number
  const validateUaePhone = (value) => {
    const digits = value.replace(/\D/g, "");
    
    if (!digits) {
      return "Phone number is required";
    }
    
    if (digits.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }
    
    if (!digits.startsWith("05")) {
      return "UAE mobile numbers must start with 05";
    }
    
    return "";
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    const rawValue = e.target.value;
    const formatted = formatLocalUaePhone(rawValue);
    setPhone(formatted);
    
    // Clear errors when user starts typing
    if (phoneError) {
      setPhoneError("");
    }
    if (error) {
      setError("");
    }
    
    // Validate on change (only if there's a value)
    if (formatted) {
      const validationError = validateUaePhone(formatted);
      if (validationError) {
        setPhoneError(validationError);
      } else {
        setPhoneError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
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
    // Validate phone number
    const phoneValidationError = validateUaePhone(phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      setError(phoneValidationError);
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
      // Normalize phone number to E.164 format before storing
      const normalizedPhone = normalizePhoneNumber(phone);
      
      // Sign up with metadata in options.data
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: normalizedPhone,
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
              disabled={isFormDisabled}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your email"
          />
        </div>
      )}

      {!showEmailField && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 bg-gray-50 text-gray-600 transition-all"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isFormDisabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="••••••••"
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            disabled={isFormDisabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            First Name
          </label>
          <input
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isFormDisabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="First name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Last Name
          </label>
          <input
            type="text"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isFormDisabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Last name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Mobile Number 🇦🇪 (+971)
        </label>
        <input
          type="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={handlePhoneChange}
          onBlur={() => {
            // Validate on blur if there's a value
            if (phone) {
              const validationError = validateUaePhone(phone);
              setPhoneError(validationError);
            }
          }}
          disabled={isFormDisabled}
          className={`w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
            phoneError ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="055 123 4567"
          inputMode="numeric"
          maxLength={12}
        />
        {phoneError && (
          <p className="text-sm text-red-600 mt-1">{phoneError}</p>
        )}
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

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      <button
        type="submit"
        disabled={loading || isFormDisabled}
        className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
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
            Creating account...
          </div>
        ) : (
          "Sign up"
        )}
      </button>

      <div className="text-center pt-2">
        <span className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </span>
      </div>
    </form>
  );
}

