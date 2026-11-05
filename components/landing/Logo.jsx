import { cn } from "@/lib/utils";

/**
 * Logo mark: brand-mark gradien merah dengan inisial "DM", diikuti wordmark.
 * Sama dengan penanda merek di dashboard DIAN MOTOR.
 */
export function Logo({ className, showWordmark = true }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span aria-hidden="true" className="brand-mark size-9 rounded-[10px] text-[11px]">
        <span>DM</span>
      </span>
      {showWordmark ? (
        <span className="font-heading text-[15px] leading-none font-extrabold tracking-tight text-foreground">
          DIAN<span className="text-primary"> MOTOR</span>
        </span>
      ) : null}
    </span>
  );
}

export default Logo;
