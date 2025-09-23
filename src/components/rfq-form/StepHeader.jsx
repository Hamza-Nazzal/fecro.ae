//src/components/rfq-form/StepHeader.jsx
import React from "react";

export default function StepHeader({ currentStep, canGoTo, goTo }) {
  const steps = [
    { step: 1, label: "Basics → Specs & Quantity" },
    { step: 2, label: "Delivery & Terms" },
    { step: 3, label: "Review" },
  ];

  const progressText = `Step ${currentStep} of ${steps.length}`;

  return (
    <div className="mt-3">
      <div className="text-xs text-gray-500 mb-2">{progressText}</div>
      <div className="flex items-center">
        {steps.map((s, i) => {
          const enabled = canGoTo(s.step);
          const isPast = currentStep > s.step;
          const isCurrent = currentStep === s.step;

          return (
            <div key={s.step} className="flex items-center">
              <button
                type="button"
                onClick={() => enabled && goTo(s.step)}
                disabled={!enabled}
                title={enabled ? `Go to ${s.label}` : "Complete previous steps first"}
                className={[
                  "flex items-center justify-center w-8 h-8 rounded-full border text-sm font-semibold transition-colors",
                  isCurrent
                    ? "bg-blue-600 border-blue-600 text-white"
                    : isPast
                    ? "bg-green-600 border-green-600 text-white"
                    : "bg-gray-200 border-gray-200 text-gray-600",
                  !enabled ? "opacity-60 cursor-not-allowed" : "hover:opacity-90",
                ].join(" ")}
              >
                {isPast ? "✓" : s.step}
              </button>

              <span
                className={[
                  "ml-2 text-sm",
                  isCurrent ? "text-blue-600 font-medium" : isPast ? "text-green-700" : "text-gray-500",
                ].join(" ")}
              >
                {s.label}
              </span>

              {i < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-4 min-w-8" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
