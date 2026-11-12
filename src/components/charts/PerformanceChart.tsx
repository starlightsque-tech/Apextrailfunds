'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Point = { label: string; cumulative: number; monthly: number };

export default function PerformanceChart({ data }: { data: Point[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="cum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d8b25a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#d8b25a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#8b93a1', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tick={{ fill: '#8b93a1', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={{
              background: '#12151b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              fontSize: 12,
              color: '#fff'
            }}
            formatter={(value: number, name: string) => [
              `${value > 0 ? '+' : ''}${value.toFixed(2)}%`,
              name === 'cumulative' ? 'Cumulative (net)' : 'Monthly (net)'
            ]}
            labelStyle={{ color: '#9aa1ad' }}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="#d8b25a"
            strokeWidth={1.8}
            fill="url(#cum)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
