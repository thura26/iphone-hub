import { useState } from "react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "h-7 w-7",
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
};

export const DEFAULT_AVATAR = "/images/avatar-default.svg";

export default function Avatar({ src, alt = "", size = "md", className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const resolvedSrc = src && failedSrc !== src ? src : DEFAULT_AVATAR;

  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-soft ring-1 ring-line/60",
        sizeClasses[size] || sizeClasses.md,
        className,
      )}
    >
      <img
        src={resolvedSrc}
        alt={alt}
        className="h-full w-full object-cover"
        draggable={false}
        onError={() => {
          if (src) setFailedSrc(src);
        }}
      />
    </span>
  );
}
