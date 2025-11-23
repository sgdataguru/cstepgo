interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`flex items-center ${step < totalSteps ? 'flex-1' : ''}`}
        >
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              step < currentStep
                ? 'bg-emerald-400 scale-100'
                : step === currentStep
                ? 'bg-white scale-125'
                : 'bg-white/40 scale-100'
            }`}
          />
          {step < totalSteps && (
            <div
              className={`h-0.5 flex-1 mx-1 transition-colors duration-300 ${
                step < currentStep ? 'bg-emerald-400' : 'bg-white/40'
              }`}
            />
          )}
        </div>
      ))}
      <span className="ml-2 text-sm text-white/90">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
}
