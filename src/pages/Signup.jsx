// src/pages/Signup.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import SignupForm from "../components/SignupForm";
import { getMe } from "../services/worker/workerCompany";
import AuthLayout from "../layouts/AuthLayout";

export default function Signup() {
  const navigate = useNavigate();

  const handleSignupSuccess = async (user) => {
    try {
      // Wait a moment for session to be established
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if user has company_id
      const meData = await getMe();
      
      if (!meData || !meData.company_id) {
        // No company - redirect to onboarding
        navigate("/onboarding/company", { replace: true });
      } else {
        // Has company - redirect to start (which will route based on roles)
        navigate("/start", { replace: true });
      }
    } catch (err) {
      console.error("Error checking company after signup:", err);
      // On error, still redirect to onboarding to be safe
      navigate("/onboarding/company", { replace: true });
    }
  };

  return (
    <AuthLayout title="Create your account">
      <SignupForm onSuccess={handleSignupSuccess} />
    </AuthLayout>
  );
}

