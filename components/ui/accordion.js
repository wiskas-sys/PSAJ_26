"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AccordionContext = React.createContext({ active: null, toggle: () => {} });

export function Accordion({ type = "single", collapsible = true, defaultValue, className, children }) {
  const [active, setActive] = React.useState(defaultValue || null);

  const toggle = (val) => {
    setActive((prev) => (prev === val ? (collapsible ? null : prev) : val));
  };

  return (
    <AccordionContext.Provider value={{ active, toggle }}>
      <div className={cn("w-full divide-y divide-border", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, className, children }) {
  return (
    <div data-value={value} className={cn("py-2", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { itemValue: value }) : child
      )}
    </div>
  );
}

export function AccordionTrigger({ itemValue, className, children }) {
  const { active, toggle } = React.useContext(AccordionContext);
  const isOpen = active === itemValue;

  return (
    <button
      type="button"
      onClick={() => toggle?.(itemValue)}
      className={cn(
        "flex w-full items-center justify-between py-3 text-left font-medium text-foreground transition-all hover:text-primary cursor-pointer",
        className
      )}
    >
      <span>{children}</span>
      <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-200 text-muted-foreground", isOpen && "rotate-180")} />
    </button>
  );
}

export function AccordionContent({ itemValue, className, children }) {
  const { active } = React.useContext(AccordionContext);
  const isOpen = active === itemValue;

  if (!isOpen) return null;

  return (
    <div className={cn("pb-4 text-sm text-muted-foreground leading-relaxed animate-in fade-in-50 duration-200", className)}>
      {children}
    </div>
  );
}

