import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import type { PriceHistoryPoint } from '@/types/game';

export function AssetSparkline({ history, positive }: { history: PriceHistoryPoint[]; positive: boolean }) {
  const data = history.slice(-40).map((p, i) => ({ i, price: p.price }));
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line
            type="monotone"
            dataKey="price"
            stroke={positive ? '#34d399' : '#f87171'}
            strokeWidth={1.75}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
