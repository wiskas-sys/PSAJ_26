'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';

const CONFIG = {
  Kategori: { table: 'categories', title: 'Kategori', description: 'Atur kelompok produk DIAN MOTOR.', add: 'Tambah Kategori', columns: [['name', 'Nama'], ['description', 'Deskripsi']], required: ['name'] },
  Supplier: { table: 'suppliers', title: 'Supplier', description: 'Kelola data pemasok DIAN MOTOR.', add: 'Tambah Supplier', columns: [['name', 'Nama Supplier'], ['phone', 'Nomor Telepon'], ['email', 'Email'], ['address', 'Alamat']], required: ['name'] },
  Pelanggan: { table: 'customers', title: 'Pelanggan', description: 'Kelola data pelanggan DIAN MOTOR.', add: 'Tambah Pelanggan', columns: [['name', 'Nama'], ['phone', 'Nomor Telepon'], ['address', 'Alamat']], required: ['name'] },
};

export function SupabaseCrudPage({ entity }) {
  const config = CONFIG[entity];
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from(config.table).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    setRows(data || []);
  }, [config.table]);
  useEffect(() => { load().catch(error => toast.error(error.message || `Gagal memuat ${entity.toLowerCase()}.`)); }, [load, entity]);
  const shown = useMemo(() => rows.filter(row => config.columns.some(([key]) => `${row[key] ?? ''}`.toLowerCase().includes(query.toLowerCase()))), [rows, query, config.columns]);
  function startAdd() { setDraft({}); setOpen(true); }
  function startEdit(row) { setDraft({ ...row }); setOpen(true); }
  async function save() {
    if (config.required.some(key => !`${draft[key] ?? ''}`.trim())) return toast.error('Lengkapi kolom wajib.');
    setBusy(true);
    try {
      const payload = Object.fromEntries(config.columns.map(([key]) => [key, `${draft[key] ?? ''}`.trim() || null]));
      const supabase = createClient();
      const result = draft.id
        ? await supabase.from(config.table).update(payload).eq('id', draft.id)
        : await supabase.from(config.table).insert(payload);
      if (result.error) throw result.error;
      await load(); setOpen(false); toast.success('Data berhasil disimpan.');
    } catch (error) { toast.error(error.message || 'Gagal menyimpan data.'); }
    finally { setBusy(false); }
  }
  async function remove(row) {
    if (!window.confirm(`Hapus ${row.name}?`)) return;
    try {
      const { error } = await createClient().from(config.table).delete().eq('id', row.id);
      if (error) throw error;
      await load(); toast.success('Data berhasil dihapus.');
    } catch (error) { toast.error(error.message || 'Gagal menghapus data.'); }
  }
  return <div className="flex flex-col gap-5">
    <PageHeader title={config.title} description={config.description}><Button onClick={startAdd}><Plus data-icon="inline-start"/>{config.add}</Button></PageHeader>
    <div className="table-surface">
      <div className="flex gap-3 border-b border-border p-3.5"><div className="input-with-icon min-w-0 flex-1"><Search className="size-4"/><Input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Cari ${entity.toLowerCase()}...`} className="h-10"/></div></div>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border">{config.columns.map(([, label]) => <th key={label} className="px-3.5 py-2.5 text-left font-medium uppercase tracking-wide">{label}</th>)}<th className="px-3.5 py-2.5 text-right font-medium uppercase tracking-wide">Aksi</th></tr></thead>
        <tbody>{shown.map(row => <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50">{config.columns.map(([key]) => <td key={key} className="px-3.5 py-3 text-[13px]">{row[key] || '—'}</td>)}<td className="px-3.5 py-3 text-right"><DropdownMenu><DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><MoreHorizontal/><span className="sr-only">Aksi {row.name}</span></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => startEdit(row)}><Pencil className="size-4"/>Edit</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => remove(row)}><Trash2 className="size-4"/>Hapus</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>)}</tbody>
      </table></div>
      {!shown.length && <p className="py-16 text-center text-muted-foreground">{query ? 'Tidak ada data yang cocok.' : `Belum ada data ${entity.toLowerCase()}.`}</p>}
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{draft.id ? `Edit ${entity}` : config.add}</DialogTitle><DialogDescription>Data disimpan langsung ke Supabase.</DialogDescription></DialogHeader><FieldGroup>{config.columns.map(([key, label]) => <Field key={key}><FieldLabel>{label}{config.required.includes(key) ? ' *' : ''}</FieldLabel><Input className="h-11" value={draft[key] ?? ''} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))}/></Field>)}</FieldGroup><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
