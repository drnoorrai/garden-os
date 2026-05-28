import { clsx, type ClassValue } from "clsx";
import {
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

export const cn = (...classes: ClassValue[]) => clsx(classes);

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-[1.55rem] border border-ink/6 bg-white shadow-card", className)} {...props} />
);

export const SectionHeading = ({
  title,
  supporting,
  action,
}: {
  title: string;
  supporting?: string;
  action?: ReactNode;
}) => (
  <div className="mb-5 flex items-start justify-between gap-4">
    <div>
      <h2 className="text-lg font-medium tracking-[-0.025em] text-ink">{title}</h2>
      {supporting ? <p className="mt-1 text-sm leading-6 text-muted">{supporting}</p> : null}
    </div>
    {action}
  </div>
);

export const Button = ({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" | "danger" }) => (
  <button
    className={cn(
      "inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage disabled:cursor-not-allowed disabled:opacity-45",
      variant === "primary" && "bg-forest text-white hover:bg-ink",
      variant === "secondary" && "border border-ink/8 bg-white text-ink hover:bg-mist",
      variant === "quiet" && "text-muted hover:bg-mist hover:text-ink",
      variant === "danger" && "bg-clay/12 text-clay hover:bg-clay/18",
      className,
    )}
    {...props}
  />
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-ink/8 bg-white px-3.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-sage focus:ring-2 focus:ring-sage/15",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn(
      "w-full rounded-xl border border-ink/8 bg-white px-3.5 py-3 text-sm leading-6 text-ink outline-none placeholder:text-muted/70 focus:border-sage focus:ring-2 focus:ring-sage/15",
      className,
    )}
    {...props}
  />
);

export const Label = ({ children, className, ...props }: PropsWithChildren<LabelHTMLAttributes<HTMLLabelElement>>) => (
  <label className={cn("mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted", className)} {...props}>
    {children}
  </label>
);

export const Pill = ({ children, tone = "sage" }: PropsWithChildren<{ tone?: "sage" | "clay" | "stone" }>) => (
  <span
    className={cn(
      "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
      tone === "sage" && "bg-sage/12 text-forest",
      tone === "clay" && "bg-clay/12 text-clay",
      tone === "stone" && "bg-mist text-muted",
    )}
  >
    {children}
  </span>
);
