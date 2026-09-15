'use client';
import { BadgeCheck, Clock3, Wrench, Zap } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const orders = [
    { id: 'SRV-260827-012', customer: 'Budi Santoso', phone: '0812-3456-7890', plate: 'B 4123 KLM', brand: 'Honda Vario 125', job: 'Ganti oli & tune up', status: 'Dikerjakan', progress: 65, eta: '16.30' },
    { id: 'SRV-260827-011', customer: 'Andi Pratama', phone: '0813-8877-2211', plate: 'B 9081 PQR', brand: 'Yamaha NMAX', job: 'Perbaikan rem depan', status: 'Menunggu', progress: 20, eta: '17.00' },
    { id: 'SRV-260826-010', customer: 'Siti Aminah', phone: '0821-8855-4422', plate: 'F 2281 AA', brand: 'Suzuki Address', job: 'Servis berkala 10.000 km', status: 'Selesai', progress: 100, eta: '—' },
    { id: 'SRV-260826-009', customer: 'Dedi Kurnia', phone: '0856-1122-3344', plate: 'B 6054 XYZ', brand: 'Honda Beat', job: 'Penggantian aki & busi', status: 'Dikerjakan', progress: 45, eta: '17.20' },
];

const tag = (s) => s === 'Selesai' ? 'stock-chip' : s === 'Dikerjakan' ? 'stock-chip low' : 'stock-chip';

export default function Page() {
    const stats = [['Total Servis', String(orders.length), 'minggu ini', Wrench], ['Sedang Dikerjakan', '2', 'di service bay', Zap], ['Menunggu', String(orders.filter(o => o.status === 'Menunggu').length), 'antrian masuk', Clock3], ['Selesai', String(orders.filter(o => o.status === 'Selesai').length), 'bulan ini', BadgeCheck]];
    return <div className="flex flex-col gap-5"><PageHeader eyebrow="SERVICE & WORK ORDER" title="Servis" description="Pantau pekerjaan bengkel dari masuk hingga diambil."> <Button onClick={() => toast.success('Form servis baru dibuka.')}>Catat Servis</Button></PageHeader>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, note, Icon]) => <div key={label} className="metric-card"><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5"/></span></div><strong className="mt-1 block text-2xl font-bold">{value}</strong><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}</section>
    <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{orders.map(o => <div key={o.id} className="surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] text-muted-foreground">{o.id}</p><h2 className="mt-1 text-[15px] font-bold">{o.job}</h2></div><span className={tag(o.status)}>{o.status.toUpperCase()}</span></div><div className="mt-3 rounded-xl bg-muted p-3"><div className="flex justify-between"><span className="font-mono text-[11px]">{o.plate}</span><small className="text-muted-foreground">{o.brand}</small></div><p className="mt-1 text-sm font-semibold">{o.customer}</p><small className="font-mono text-[10px] text-muted-foreground">{o.phone}</small></div><div className="mt-3 flex justify-between text-xs"><span className="text-muted-foreground">Estimasi selesai</span><strong className="font-mono">{o.eta} WIB</strong></div><div className="progress-track mt-2"><span style={{ width: `${o.progress}%` }}/></div><div className="mt-4 flex justify-end gap-2"><Button variant={o.status === 'Selesai' ? 'outline' : 'default'} size="sm" onClick={() => toast.success(`${o.id} diperbarui.`)}>{o.status === 'Selesai' ? 'Detail' : 'Perbarui Servis'}</Button><Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400">Batal</Button></div></div>)}</section>
  </div>;
}