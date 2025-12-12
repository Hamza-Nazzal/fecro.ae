// src/pages/CompanyOnboarding.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCompany, acceptCompanyInvite, getMe } from "../services/worker/workerCompany";
import { normalizePhoneNumber } from "../utils/phone";
import AuthLayout from "../layouts/AuthLayout";

export default function CompanyOnboarding() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // "create" or "invite"
  const [companyName, setCompanyName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [tradeLicenseNo, setTradeLicenseNo] = useState("");
  const [country, setCountry] = useState("UAE");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDuplicateCompany, setIsDuplicateCompany] = useState(false);

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

  // Validate UAE phone number (10 digits, starts with 05)
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

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setError("");
    setIsDuplicateCompany(false);
    setPhoneError("");

    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }

    // Validate company phone before submit
    const companyPhoneValidationError = validateUaePhone(phone);
    if (companyPhoneValidationError) {
      setPhoneError(companyPhoneValidationError);
      setError(companyPhoneValidationError);
      return;
    }

    setLoading(true);

    try {
      // Normalize to E.164 before save
      const normalizedCompanyPhone = normalizePhoneNumber(phone);

      await createCompany({
        name: companyName.trim(),
        legalName: legalName.trim() || companyName.trim(),
        tradeLicenseNo: tradeLicenseNo.trim() || null,
        country: country.trim() || null,
        city: city || null,
        phone: normalizedCompanyPhone,
      });

      // Wait a moment for membership to be created
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify company_id
      const meData = await getMe();

      if (!meData || !meData.company_id) {
        setError("Failed to create company. Please try again or contact support.");
        setLoading(false);
        return;
      }

      // Success - redirect to start
      navigate("/start", { replace: true });
    } catch (err) {
      const errorMessage = err?.message || "";
      // Check if it's a duplicate company error (409 or 23505 constraint violation)
      if (
        errorMessage.includes("409") ||
        errorMessage.includes("23505") ||
        errorMessage.includes("duplicate key") ||
        errorMessage.includes("already exists")
      ) {
        setIsDuplicateCompany(true);
        setError("");
      } else {
        setError(errorMessage || "Failed to create company");
        setIsDuplicateCompany(false);
      }
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    setError("");

    if (!inviteToken.trim()) {
      setError("Invite token is required");
      return;
    }

    setLoading(true);

    try {
      await acceptCompanyInvite({ token: inviteToken.trim() });

      // Wait a moment for membership to be created
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify company_id
      const meData = await getMe();

      if (!meData || !meData.company_id) {
        setError("Failed to join company. Please check your invite token or contact support.");
        setLoading(false);
        return;
      }

      // Success - redirect to start
      navigate("/start", { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to accept invite");
      setLoading(false);
    }
  };

  if (mode === null) {
    return (
      <AuthLayout>
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Join or Create Company
        </h1>
        <p className="text-gray-600 mb-6">
          You need to be part of a company to use this app.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setMode("create")}
            className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700"
          >
            I'm the first from my company
          </button>

          <button
            onClick={() => setMode("invite")}
            className="w-full rounded-lg border border-gray-300 bg-white text-gray-700 py-3 font-medium hover:bg-gray-50"
          >
            I already have an invite
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (mode === "create") {
    return (
      <AuthLayout>
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Create Company
        </h1>

        {isDuplicateCompany ? (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Company Already Registered
            </h2>
            <p className="text-sm text-red-700">
              It looks like <strong>{companyName}</strong> is already registered on our platform.
            </p>
            <p className="text-sm text-red-700 mt-2">
              If you are the authorized representative and cannot access the account, please contact our support team for assistance.
            </p>
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        ) : null}

        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                setIsDuplicateCompany(false);
                setError("");
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Official Company Name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Legal name
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => {
                setLegalName(e.target.value);
                setError("");
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Legal name"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              If empty, we'll use the company name
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trade license number
            </label>
            <input
              type="text"
              value={tradeLicenseNo}
              onChange={(e) => {
                setTradeLicenseNo(e.target.value);
                setError("");
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="TLZ-0000003"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setError("");
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Country"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setError("");
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select a city</option>
              <option value="Abu Dhabi">Abu Dhabi</option>
              <option value="Dubai">Dubai</option>
              <option value="Sharjah">Sharjah</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company phone
            </label>
            <input
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => {
                const rawValue = e.target.value;
                const formatted = formatLocalUaePhone(rawValue);
                setPhone(formatted);
                if (phoneError) {
                  setPhoneError("");
                }
                if (error) {
                  setError("");
                }
                if (formatted) {
                  const validationError = validateUaePhone(formatted);
                  if (validationError) {
                    setPhoneError(validationError);
                  } else {
                    setPhoneError("");
                  }
                } else {
                  setPhoneError("");
                }
              }}
              onBlur={() => {
                if (phone) {
                  const validationError = validateUaePhone(phone);
                  setPhoneError(validationError);
                }
              }}
              disabled={loading}
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                phoneError ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="055 123 4567"
              inputMode="numeric"
              maxLength={12}
            />
            {phoneError && (
              <p className="text-xs text-red-600 mt-1">{phoneError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setMode(null);
                setIsDuplicateCompany(false);
                setError("");
                setCompanyName("");
                setLegalName("");
                setTradeLicenseNo("");
                setCountry("UAE");
                setCity("");
                setPhone("");
                setPhoneError("");
              }}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 bg-white text-gray-700 py-2 font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Company"}
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  if (mode === "invite") {
    return (
      <AuthLayout>
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Accept Invite
        </h1>

        <p className="text-gray-600 mb-4">
          Enter your invite token or{" "}
          <a
            href="/accept-invite"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            use the invite link
          </a>
          .
        </p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleAcceptInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite Token
            </label>
            <input
              type="text"
              required
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter invite token"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode(null)}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 bg-white text-gray-700 py-2 font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Joining..." : "Join Company"}
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return null;
}

