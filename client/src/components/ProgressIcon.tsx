import type { Icon } from "@phosphor-icons/react";

interface ProgressIconProps {
  icon: Icon;
  /** Weight flips regular → fill when the item is completed (see CLAUDE.md). */
  completed: boolean;
  size?: number;
  className?: string;
}

export default function ProgressIcon({
  icon: IconComponent,
  completed,
  size = 24,
  className,
}: ProgressIconProps) {
  return (
    <IconComponent
      size={size}
      weight={completed ? "fill" : "regular"}
      className={className}
      aria-hidden
    />
  );
}
