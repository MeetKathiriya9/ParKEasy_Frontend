import type { ReactNode } from 'react';

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendUp,
  accent = 'blue',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'cyan' | 'violet';
}) {
  const accentMap: Record<string, string> = {
    blue: 'text-[#3b82f6] bg-[#2563eb]/10',
    green: 'text-[#10b981] bg-[#10b981]/10',
    amber: 'text-[#f59e0b] bg-[#f59e0b]/10',
    red: 'text-[#ef4444] bg-[#ef4444]/10',
    cyan: 'text-[#06b6d4] bg-[#06b6d4]/10',
    violet: 'text-[#8b5cf6] bg-[#8b5cf6]/10',
  };
  return (
    <div className="pe-card p-5 pe-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#8a98b5] font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trendUp ? 'text-[#10b981]' : 'text-[#ef4444]'}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-[#5a6a8a]">vs last week</span>
        </div>
      )}
    </div>
  );
}

export function Badge({
  children,
  color = 'blue',
}: {
  children: ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'cyan';
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-[#2563eb]/15 text-[#3b82f6]',
    green: 'bg-[#10b981]/15 text-[#10b981]',
    amber: 'bg-[#f59e0b]/15 text-[#f59e0b]',
    red: 'bg-[#ef4444]/15 text-[#ef4444]',
    gray: 'bg-[#2a3a5c] text-[#8a98b5]',
    cyan: 'bg-[#06b6d4]/15 text-[#06b6d4]',
  };
  return <span className={`pe-badge ${colorMap[color]}`}>{children}</span>;
}

export function ProgressBar({ value, max = 100, color = '#2563eb' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 rounded-full bg-[#1e2d4d] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-[#8a98b5] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, message }: { icon: ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1e2d4d] flex items-center justify-center text-[#5a6a8a] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#e8edf5]">{title}</h3>
      <p className="text-sm text-[#8a98b5] mt-1 max-w-sm">{message}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${maxWidth} w-full pe-card p-6 pe-fade-in max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-[#8a98b5] hover:text-[#e8edf5] text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };
  return (
    <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center font-bold text-white`}>
      {initials}
    </div>
  );
}

export function MiniBarChart({ data, height = 120 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md bg-gradient-to-t from-[#2563eb] to-[#3b82f6] transition-all duration-500 hover:from-[#3b82f6] hover:to-[#06b6d4]" style={{ height: `${(d.value / max) * (height - 24)}px` }} />
          <span className="text-[10px] text-[#5a6a8a]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function MiniLineChart({ data, height = 120 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 80 - 10;
    return `${x},${y}`;
  });
  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points={points.join(' ')} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polyline points={`${points.join(' ')} 100,100 0,100`} fill="url(#chartGrad)" opacity="0.2" />
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#0b1220" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-[#5a6a8a]">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
