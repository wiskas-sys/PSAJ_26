'use client';
import { useState } from 'react';
import { CheckCheck, PackageX, ReceiptText, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

const initialNotes = [
    { id: 1, title: 'Stok Oli Mesin hampir habis.', desc: 'Sisa stok telah mencapai batas minimum.', time: '10 menit lalu', Icon: TriangleAlert, read: false },
    { id: 2, title: 'Stok Kampas Rem telah habis.', desc: 'Segera lakukan pemesanan kepada supplier.', time: '42 menit lalu', Icon: PackageX, read: false },
    { id: 3, title: 'Transaksi baru berhasil dibuat.', desc: 'TRX-260827-018 sebesar Rp246.000.', time: '1 jam lalu', Icon: ReceiptText, read: true },
];

export default function Page() {
    const [notes, setNotes] = useState(initialNotes);
    const unread = notes.filter(n => !n.read).length;
    function markRead(id) { setNotes(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); }
    function markAll() { if (!unread)
            return; setNotes(prev => prev.map(n => ({ ...n, read: true }))); toast.success('Semua notifikasi ditandai dibaca.'); }
    return <div className="flex flex-col gap-5"><PageHeader eyebrow="NOTIFICATION CENTER" title="Notifikasi" description="Pembaruan penting operasional bengkel."> <Button variant="outline" onClick={markAll} disabled={!unread}><CheckCheck data-icon="inline-start"/>Tandai Semua Dibaca</Button></PageHeader>
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-[17px] border border-border bg-card shadow-[0_14px_42px_rgba(0,0,0,.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,.3)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-3"><p className="font-mono text-[10px] font-bold tracking-[.12em] text-muted-foreground">{unread} UNREAD · ALL SYSTEMS</p><span className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-[9px] font-bold text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]"/>LIVE</span></div>
      {notes.length === 0 && <p className="py-20 text-center text-sm text-muted-foreground">Tidak ada notifikasi.</p>}
      {notes.map(({ id, title, desc, time, Icon, read }) => <article key={id} onClick={() => !read && markRead(id)} className={`flex gap-4 border-b border-border p-5 last:border-0 ${read ? '' : 'cursor-pointer bg-primary/[0.03] transition-colors hover:bg-primary/[0.06]'}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}><Icon className="size-5"/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-4"><h2 className={`text-sm font-semibold ${read ? 'text-muted-foreground' : ''}`}>{title}</h2>{!read && <span className="size-2 shrink-0 rounded-full bg-primary"/>}</div><p className="mt-1 text-[13px] text-muted-foreground">{desc}</p><p className="mt-2 font-mono text-[10px] text-muted-foreground">{time}</p></div></article>)}
    </div>
  </div>;
}