'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { rupiah, todayISO } from '@/lib/demo-data';
import { recordStockMovement } from '@/lib/supabase/stock-products';
import { parseMoneyAutoRupiah } from '@/lib/money-format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

function splitRow(line) {
  if (line.includes('\t')) return line.split('\t');
  if (line.includes(';')) return line.split(';');
  return line.split(',');
}

const isHeader = (line) =>
  /\bkode\b/i.test(line) && (/\bjumlah\b/i.test(line) || /\bqty\b/i.test(line) || /\bnama\b/i.test(line));

export function StockMovementBulkDialog({
  open,
  onOpenChange,
  type = 'IN',
  products = [],
  onDone,
}) {
  const incoming = type === 'IN';
  const [text, setText] = useState('');
  const [date, setDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setText('');
      setDate(todayISO());
    }
  }, [open]);

  const headers = incoming
    ? ['Kode Barang', 'Jumlah Masuk', 'Supplier (Opsional)', 'No. Referensi (Opsional)', 'Harga Beli (Opsional)']
    : ['Kode Barang', 'Jumlah Keluar', 'Jenis Penggunaan', 'No. Referensi (Opsional)'];

  const productMap = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      map.set(p.code.toLowerCase().trim(), p);
    }
    return map;
  }, [products]);

  // Parsing baris Excel
  const analyze = useMemo(() => {
    const raw = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const lines = raw
      .map((line, i) => ({ line, no: i + 1 }))
      .filter(({ line }) => !isHeader(line));

    if (!lines.length) return { rows: [], importable: [], invalid: 0 };

    const rows = lines.map(({ line, no }) => {
      const cells = splitRow(line).map((c) => c.trim());
      const rawCode = cells[0] || '';
      const rawQty = cells[1] || '0';
      const party = cells[2] || (incoming ? 'Supplier Umum' : 'Penjualan');
      const reference = cells[3] || (incoming ? 'MASUK-EXCEL' : 'KELUAR-EXCEL');
      const rawPrice = incoming && cells[4] ? parseMoneyAutoRupiah(cells[4]) : null;

      const qty = parseInt(rawQty.replace(/[^\d]/g, ''), 10) || 0;
      const product = productMap.get(rawCode.toLowerCase());

      let error = null;
      if (!rawCode) {
        error = 'Kode barang kosong';
      } else if (!product) {
        error = `Kode "${rawCode}" tidak ditemukan di katalog stok`;
      } else if (qty <= 0) {
        error = 'Jumlah harus lebih besar dari 0';
      } else if (!incoming && qty > product.stock) {
        error = `Stok tidak cukup (sisa ${product.stock} ${product.unit})`;
      }

      const before = product ? product.stock : 0;
      const after = product ? (incoming ? before + qty : before - qty) : 0;

      return {
        line: no,
        raw: line,
        code: rawCode,
        product,
        qty,
        party,
        reference,
        price: rawPrice,
        before,
        after,
        isValid: !error,
        error,
      };
    });

    const importable = rows.filter((r) => r.isValid);
    const invalid = rows.filter((r) => !r.isValid).length;

    return { rows, importable, invalid };
  }, [text, productMap, incoming]);

  const { rows, importable, invalid } = analyze;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rows.length) return toast.error('Tempelkan data baris dari Excel terlebih dahulu.');
    if (invalid > 0) return toast.error(`${invalid} baris tidak valid. Mohon koreksi sebelum menyimpan.`);

    setSubmitting(true);
    let successCount = 0;

    try {
      for (const row of importable) {
        await recordStockMovement({
          productId: row.product.id,
          type,
          quantity: row.qty,
          reference: row.reference,
          party: row.party,
          notes: `Impor massal Excel ${incoming ? 'Barang Masuk' : 'Barang Keluar'}`,
          date,
        });
        successCount++;
      }

      toast.success(`Berhasil mencatat mutasi ${successCount} barang ${incoming ? 'masuk' : 'keluar'}!`);
      onOpenChange(false);
      onDone?.();
    } catch (err) {
      toast.error(err.message || 'Sebagian atau seluruh mutasi gagal disimpan.');
    } finally {
      setSubmitting(false);
    }
  }

  const Icon = incoming ? ArrowDownToLine : ArrowUpFromLine;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              className={`grid size-9 place-items-center rounded-xl ${
                incoming ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              }`}
            >
              <Icon className="size-5" />
            </span>
            <div>
              <DialogTitle>Impor Massal Barang {incoming ? 'Masuk' : 'Keluar'} dari Excel</DialogTitle>
              <DialogDescription>
                Salin baris tabel dari file Excel lalu tempel di kolom teks di bawah.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="rounded-xl border border-border bg-muted/60 p-3">
            <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <FileSpreadsheet className="size-4 text-muted-foreground" />
              <span>Urutan kolom Excel:</span>
              {headers.map((h, i) => (
                <span
                  key={h}
                  className="rounded-md bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground border border-border"
                >
                  {i + 1}. {h}
                </span>
              ))}
            </p>
            {incoming && (
              <p className="mt-2 text-[11px] text-emerald-500 font-medium">
                💡 <strong>Auto-konfigurasi Rupiah:</strong> Jika pekerja mengetik harga tanpa &apos;000&apos; (misal tulis 5 atau 45), sistem otomatis menyesuaikan menjadi Rp 5.000 atau Rp 45.000.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bulk-mv-text" className="text-xs font-semibold">
              Data dari Excel (Copy-Paste)
            </label>
            <Textarea
              id="bulk-mv-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Contoh baris Excel:\nBRG-001\t10\tSupplier Dian\tPO-2026-01\nBRG-002\t25\tPT Astra\tINV-9921`}
              rows={6}
              className="font-mono text-xs leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">
              Pemisah otomatis: Tab (Excel), koma, atau titik koma. Baris judul (header) dilewati otomatis.
            </p>
          </div>

          {/* Tanggal Mutasi */}
          <div className="w-full sm:w-1/2">
            <label htmlFor="bulk-date" className="block text-xs font-semibold mb-1">
              Tanggal Mutasi
            </label>
            <input
              id="bulk-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs outline-none focus:border-primary"
            />
          </div>

          {/* Tabel Preview */}
          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="max-h-[35vh] overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 border-b border-border bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-right text-muted-foreground">No</th>
                      <th className="px-3 py-2 text-left text-muted-foreground">Kode</th>
                      <th className="px-3 py-2 text-left text-muted-foreground">Nama Barang</th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Jumlah</th>
                      <th className="px-3 py-2 text-center text-muted-foreground">Dampak Stok</th>
                      <th className="px-3 py-2 text-left text-muted-foreground">
                        {incoming ? 'Supplier' : 'Keperluan'}
                      </th>
                      <th className="px-3 py-2 text-right text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r) => (
                      <tr key={r.line} className="hover:bg-muted/40 transition-colors">
                        <td className="px-3 py-2 text-right font-mono text-[10px] text-muted-foreground">
                          {r.line}
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold">{r.code || '—'}</td>
                        <td className="px-3 py-2 font-medium">
                          {r.product ? (
                            r.product.name
                          ) : (
                            <span className="text-red-500 font-normal">{r.error}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {r.qty} {r.product?.unit || ''}
                        </td>
                        <td className="px-3 py-2 text-center text-[11px] text-muted-foreground">
                          {r.product ? (
                            <span>
                              {r.before} → <strong className="text-foreground">{r.after}</strong>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">
                          {r.party}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 className="size-3" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-red-500 border border-red-500/20">
                              <AlertCircle className="size-3" />
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ringkasan */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3 text-xs">
                <div>
                  Total baris: <strong>{rows.length}</strong> · Siap diproses:{' '}
                  <strong className="text-emerald-500">{importable.length}</strong>
                  {invalid > 0 && (
                    <span className="ml-2 text-red-500 font-bold">({invalid} bermasalah)</span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  Total kuantitas: {importable.reduce((sum, r) => sum + r.qty, 0)} unit
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={!importable.length || invalid > 0 || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Icon data-icon="inline-start" />
                  <span>Simpan {importable.length} Barang {incoming ? 'Masuk' : 'Keluar'}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
