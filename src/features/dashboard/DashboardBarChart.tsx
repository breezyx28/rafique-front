import { type ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export type DashboardBarPoint = {
  name: string
  value: number
  active?: boolean
}

type DashboardBarChartProps = {
  title: string
  total: string
  badge?: string
  chip?: string
  data: DashboardBarPoint[]
  emptyLabel: string
  yTickFormatter?: (value: number) => string
  height?: number
  className?: string
  headerRight?: ReactNode
  highlight?: 'last' | 'max'
}

function defaultYTick(value: number) {
  const n = Number(value)
  if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}k`
  return String(Math.round(n))
}

export function DashboardBarChart({
  title,
  total,
  badge,
  chip,
  data,
  emptyLabel,
  yTickFormatter = defaultYTick,
  height = 220,
  className,
  headerRight,
  highlight = 'last',
}: DashboardBarChartProps) {
  const maxValue = Math.max(0, ...data.map((row) => row.value))
  const points = data.map((row, index, arr) => ({
    ...row,
    active:
      row.active ??
      (highlight === 'max' ? row.value === maxValue && maxValue > 0 : index === arr.length - 1),
  }))
  const hasValues = points.some((row) => row.value > 0)

  return (
    <Card className={cn('border-none bg-primary text-white shadow-md', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
        <div>
          <CardTitle className="text-[15px] font-semibold text-white">{title}</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-[22px] font-bold text-white">{total}</p>
            {badge ? (
              <span className="rounded-[4px] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {badge}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerRight}
          {chip ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,255,255,0.2)] px-3 py-1 text-[11px] font-medium">
              {chip}
              <CalendarDays className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div style={{ height }}>
          {!hasValues ? (
            <div className="flex h-full items-center justify-center text-[13px] text-white/70">
              {emptyLabel}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
                <YAxis
                  tickFormatter={yTickFormatter}
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.08)' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 12,
                    color: '#1A1A2E',
                  }}
                  formatter={(value) => [Number(value ?? 0).toLocaleString(), title]}
                  labelStyle={{ color: '#6B7280' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={16}>
                  {points.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={entry.active ? '#F5F0CC' : 'rgba(255,255,255,0.35)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
