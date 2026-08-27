import { z } from 'zod';
export const loginSchema = z.object({ email: z.string().email('Email tidak valid.'), password: z.string().min(6, 'Password minimal 6 karakter.') });
export const movementSchema = z.object({ productId: z.string().uuid(), quantity: z.coerce.number().int().positive('Jumlah harus lebih dari 0.'), notes: z.string().max(500).optional() });
export const productSchema = z.object({ code: z.string().trim().min(1, 'Kolom ini wajib diisi.').max(30), name: z.string().trim().min(1, 'Kolom ini wajib diisi.').max(120), sellingPrice: z.coerce.number().nonnegative(), stock: z.coerce.number().int().nonnegative(), minimumStock: z.coerce.number().int().nonnegative() });
