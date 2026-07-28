import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { NetWorthPoint } from '@/types/game';
import { formatMoney } from '@/lib/format';

export function NetWorthChart({ data }: { data: NetWorthPoint[] }) {
  const chartData = data.map((p) => ({ day: p.day, netWorth: Math.round(p.netWorth) }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab84a" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#eab84a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tickFormatter={(d) => `Day ${d}`}
            stroke="#8a8a92"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis
            tickFormatter={(v) => formatMoney(v, { compact: true })}
            stroke="#8a8a92"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            contentStyle={{
              background: '#10161f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              fontSize: 12,
            }}
            labelFormatter={(d) => `Day ${d}`}
            formatter={(value) => [formatMoney(Number(value)), 'Net Worth']}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#eab84a"
            strokeWidth={2}
            fill="url(#netWorthGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
