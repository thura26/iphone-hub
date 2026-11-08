import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }) {
  return <LoaderCircle className={cn("h-5 w-5 animate-spin", className)} />;
}

export default function Loader({
  label = "Loading…",
  className,
  full = false,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted",
        full ? "min-h-[60vh]" : "py-16",
        className,
      )}
    >
      <LoaderCircle className="h-6 w-6 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
