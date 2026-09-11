import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 mb-4">
        <Icon className="h-7 w-7 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-zinc-400">{description}</p>
      )}
      {actionLabel && (
        <div className="mt-5">
          {actionHref ? (
            <Link href={actionHref} className="btn btn-primary">
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className="btn btn-primary">
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
