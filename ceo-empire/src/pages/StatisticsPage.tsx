import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DollarSign, TrendingDown, Building2, Users, LineChart as LineChartIcon } from 'lucide-react';
import { useGameStore, selectNetWorth } from '@/store/gameStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { Card } from '@/components/ui/Card';
import { formatMoney } from '@/lib/format';
import { businessFinancials, investmentsValue } from '@/lib/gameEngine';
import { getBusinessTemplate } from '@/data/businesses';

const COMPOSITION_COLORS = ['#eab84a', '#1c3560', '#34d399'];

export default function StatisticsPage() {
  const state = useGameStore((s) => s.state);
  const netWorth = selectNetWorth(state);
  const totalProfit = state.totalIncomeEarned - state.totalExpensesPaid;
  const portfolioValue = investmentsValue(state);
  const businessValue = netWorth - state.cash - portfolioValue;

  const incomeByBusiness = state.businesses
    .map((b) => {
      const template = getBusinessTemplate(b.templateId);
      const fin = businessFinancials(b, state.employees, state.activeEvents);
      return { name: template?.name ?? b.templateId, profit: Math.round(fin.hourlyProfit) };
    })
    .sort((a, b) => b.profit - a.profit);

  const composition = [
    { name: 'Cash', value: Math.max(0, state.cash) },
    { name: 'Business Value', value: Math.max(0, businessValue) },
    { name: 'Investments', value: Math.max(0, portfolioValue) },
  ].filter((d) => d.value > 0);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Statistics</h1>
        <p className="text-sm text-white/40">A deep look at your empire's performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Profit"
          value={formatMoney(totalProfit, { compact: true })}
          accent={totalProfit >= 0 ? 'emerald' : 'red'}
        />
        <StatCard
          icon={<TrendingDown className="h-5 w-5" />}
          label="Total Expenses"
          value={formatMoney(state.totalExpensesPaid, { compact: true })}
          accent="red"
        />
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Businesses Owned"
          value={String(state.businesses.length)}
          accent="gold"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Employees"
          value={String(state.employees.length)}
          accent="navy"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-white">Net Worth History</h2>
          <NetWorthChart data={state.netWorthHistory} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Net Worth Composition</h2>
          {composition.length === 0 ? (
            <p className="py-10 text-center text-xs text-white/30">No assets yet.</p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={composition} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                    {composition.map((_, i) => (
                      <Cell key={i} fill={COMPOSITION_COLORS[i % COMPOSITION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#10161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                    formatter={(value) => formatMoney(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {composition.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-[11px] text-white/50">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COMPOSITION_COLORS[i % COMPOSITION_COLORS.length] }}
                />
                {c.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Profit by Business</h2>
        {incomeByBusiness.length === 0 ? (
          <p className="py-10 text-center text-xs text-white/30">Buy a business to see its performance here.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeByBusiness} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8a8a921a" vertical={false} />
                <XAxis dataKey="name" stroke="#8a8a92" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(v) => formatMoney(v, { compact: true })}
                  stroke="#8a8a92"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{ background: '#10161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  formatter={(value) => [formatMoney(Number(value)), 'Profit/hr']}
                />
                <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                  {incomeByBusiness.map((d, i) => (
                    <Cell key={i} fill={d.profit >= 0 ? '#eab84a' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="flex flex-wrap items-center gap-6 p-5">
        <div className="flex items-center gap-2">
          <LineChartIcon className="h-4 w-4 text-gold-400" />
          <span className="text-xs text-white/40">Investment Portfolio</span>
        </div>
        <span className="text-sm font-semibold text-white">{formatMoney(portfolioValue, { compact: true })}</span>
        <span className="text-xs text-white/30">{state.investments.length} position(s) held</span>
      </Card>
    </div>
  );
}
