import { z } from 'zod';
export const loginSchema = z.object({ email: z.string().email('Email tidak valid.'), password: z.string().min(6, 'Password minimal 6 karakter.') });
const requiredText = (label) => z.string().trim().min(1, `${label} wajib diisi.`).max(120, `${label} maksimal 120 karakter.`);
const count = (label, min = 0) => z.coerce.number().int(`${label} harus bilangan bulat.`).min(min, min > 0 ? `${label} harus lebih dari 0.` : `${label} tidak boleh negatif.`);

export const productSchema = z.object({
    code: z.string().trim().min(1, 'Kode barang wajib diisi.').max(30, 'Kode barang maksimal 30 karakter.'),
    name: requiredText('Nama barang'),
    category: z.string().trim().min(1, 'Kategori wajib dipilih.'),
    unit: z.string().trim().min(1, 'Satuan wajib dipilih.'),
    purchasePrice: z.coerce.number().min(0, 'Harga beli tidak boleh negatif.'),
    sellingPrice: z.coerce.number().min(0, 'Harga jual tidak boleh negatif.'),
    stock: count('Stok awal'),
    minimumStock: count('Stok minimum'),
});
export const movementSchema = z.object({
    productId: z.string().min(1, 'Produk wajib dipilih.'),
    type: z.enum(['IN', 'OUT']),
    quantity: count('Jumlah', 1),
    date: z.string().min(1, 'Tanggal wajib diisi.'),
    reference: z.string().trim().max(60, 'Nomor referensi maksimal 60 karakter.').optional().or(z.literal('')),
    party: z.string().trim().max(60, 'Keterangan maksimal 60 karakter.').optional().or(z.literal('')),
    notes: z.string().trim().max(500, 'Catatan maksimal 500 karakter.').optional().or(z.literal('')),
});
export const bulkRowSchema = z.object({
    code: z.string().trim().min(1, 'Kode barang kosong.').max(30),
    name: requiredText('Nama barang'),
    category: z.string().trim().min(1, 'Kategori kosong.'),
    unit: z.string().trim().min(1, 'Satuan kosong.'),
    stock: count('Stok'),
    minimumStock: count('Stok minimum'),
    purchasePrice: z.coerce.number().min(0, 'Harga beli tidak valid.'),
    sellingPrice: z.coerce.number().min(0, 'Harga jual tidak valid.'),
});

export const openingSchema = z.object({
    date: z.string().min(1, 'Tanggal penerimaan wajib diisi.'),
    reference: z.string().trim().max(60, 'Nomor referensi maksimal 60 karakter.').optional().or(z.literal('')),
    party: z.string().trim().max(60, 'Supplier maksimal 60 karakter.').optional().or(z.literal('')),
});
export function fieldErrors(result) {
    const map = {};
    for (const issue of result.error.issues) map[issue.path[0]] = issue.message;
    return map;
}
