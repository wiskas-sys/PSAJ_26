'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { sales, rupiah } from '@/lib/demo-data';
export function SalesChart() {
    return <div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={sales} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24}/><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12}/><YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v / 1000000}jt`}/><Tooltip formatter={(value) => rupiah(Number(value))} contentStyle={{ borderRadius: 8, borderColor: 'var(--border)' }}/><Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} fill="url(#salesFill)"/></AreaChart></ResponsiveContainer></div>;
}
