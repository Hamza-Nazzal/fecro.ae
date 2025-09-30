//src/components/rfq-form/form/navigation.js

export const useRFQNavigation = ({ canProceedStep1, canProceedStep2, currentStep, setCurrentStep }) => {
  const goNext = () => setCurrentStep((s) => Math.min(3, s + 1));
  const goBack = () => setCurrentStep((s) => Math.max(1, s - 1));
  const canGoTo = (step) => {
    if (step === 1) return true;
    if (step === 2) return !!canProceedStep1();
    if (step === 3) return !!canProceedStep2();
    return false;
  };
  const goTo = (step) => canGoTo(step) && setCurrentStep(step);
  return { goNext, goBack, canGoTo, goTo };
};
