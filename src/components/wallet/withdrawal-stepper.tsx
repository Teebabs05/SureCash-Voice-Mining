import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "PENDING", label: "Submitted" },
  { key: "PROCESSING", label: "Processing" },
  { key: "PAID", label: "Paid" },
] as const;

export function WithdrawalStepper({ status }: { status: string }) {
  if (status === "REJECTED") {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15">
          <X className="h-3 w-3" />
        </span>
        Rejected — funds returned
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                i < activeIndex && "bg-brand-green text-white",
                i === activeIndex && "gradient-brand text-white",
                i > activeIndex && "bg-surface-muted text-foreground/40"
              )}
            >
              {i < activeIndex ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className={cn("text-[10px]", i <= activeIndex ? "font-medium text-foreground" : "text-foreground/40")}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("mx-1 h-0.5 flex-1 rounded", i < activeIndex ? "bg-brand-green" : "bg-surface-muted")} />
          )}
        </div>
      ))}
    </div>
  );
}
