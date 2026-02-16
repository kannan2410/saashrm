import clsx from 'clsx';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

const variantMap: Record<string, Variant> = {
  ACTIVE: 'success',
  APPROVED: 'success',
  INACTIVE: 'gray',
  ON_LEAVE: 'warning',
  PENDING: 'warning',
  TERMINATED: 'danger',
  REJECTED: 'danger',
  CANCELLED: 'gray',
  FULL_TIME: 'info',
  PART_TIME: 'warning',
  CONTRACT: 'gray',
  INTERN: 'info',
  CASUAL: 'info',
  SICK: 'danger',
  EARNED: 'success',
  UNPAID: 'warning',
};

const variantClasses: Record<Variant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  gray: 'bg-surface-bg text-content-secondary ring-surface-border',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = variantMap[status] || 'gray';
  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
