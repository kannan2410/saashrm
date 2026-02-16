import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  subtitle?: string;
}

const colorClasses = {
  blue: 'bg-emerald-50 text-emerald-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function StatsCard({ title, value, icon: Icon, color = 'blue', subtitle }: StatsCardProps) {
  const isTextValue = typeof value === 'string' && value.length > 6;

  return (
    <div className="card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-content-muted">{title}</p>
          <p className={clsx(
            'mt-1 font-bold text-content-primary break-words',
            isTextValue ? 'text-base sm:text-lg' : 'text-2xl'
          )}>
            {value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-content-muted">{subtitle}</p>}
        </div>
        <div className={clsx('p-2.5 rounded-lg flex-shrink-0', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
