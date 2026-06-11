import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "bg-primary text-white hover:bg-primary-hover",
        variant === "outline" &&
          "border border-border bg-background text-foreground hover:border-primary-border hover:bg-primary-soft",
        variant === "ghost" &&
          "text-muted hover:bg-surface hover:text-foreground",
        size === "default" && "h-10 px-4 py-2 text-sm",
        size === "sm" && "h-8 px-3 text-xs",
        size === "lg" && "h-11 px-5 text-sm",
        className,
      )}
      {...props}
    />
  );
}
