import { ModalFooter, CancelButton, PrimaryButton } from './modal-shell';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { keywordFullTable } from '@/lib/seo-data';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
};

export function KeywordDetailModal({ onClose, keyword }: { onClose: () => void; keyword: string }) {
  const data = keywordFullTable.find((k) => k.keyword === keyword) ?? keywordFullTable[0];
  const trendData = data.trend30.map((v, i) => ({ day: `D${i + 1}`, rank: v }));
  const change = data.previousRank - data.rank;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">{data.keyword}</p>
          <p className="text-sm text-muted-foreground">Current rank: #{data.rank} (was #{data.previousRank})</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            change > 0 ? 'bg-success/10 text-success' : change < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
          )}
        >
          {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change > 0 ? `+${change}` : change}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Search Volume', value: data.volume.toLocaleString() },
          { label: 'Difficulty', value: String(data.difficulty) },
          { label: 'CPC', value: data.cpc },
          { label: 'Intent', value: data.intent },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-sm font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold">30-Day Ranking History</p>
        <div className="mt-2 h-40 rounded-xl border bg-muted/30 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="kd-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis reversed tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="rank" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#kd-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Ranking URL</p>
            <p className="text-xs text-muted-foreground">{data.url}</p>
          </div>
          <a href="#" className="flex items-center gap-1 text-xs text-primary hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
        </div>
        <div className="mt-2 border-t pt-2">
          <p className="text-xs text-muted-foreground">SERP Feature: <span className="font-medium text-foreground">{data.serp}</span></p>
        </div>
      </div>

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>Close</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
