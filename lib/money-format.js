/**
 * Utility pemformatan rupiah dan angka ribuan otomatis
 */

/**
 * Format angka ke string ribuan (contoh: 50000 -> "50.000")
 */
export function formatThousands(val) {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d]/g, ''), 10);
  if (Number.isNaN(num) || num === 0) return '';
  return num.toLocaleString('id-ID');
}

/**
 * Parsing string ribuan menjadi integer murni (contoh: "50.000" -> 50000)
 */
export function parseThousands(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d]/g, '');
  const num = parseInt(cleaned, 10);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Auto-konfigurasi harga ke Rupiah untuk Excel impor.
 * Jika pekerja menginput angka tanpa 000 (contoh: 5 atau 15 atau 150),
 * sistem otomatis mengonversi ke ribuan (contoh: 5 -> 5000, 150 -> 150000).
 */
export function parseMoneyAutoRupiah(val) {
  if (!val) return '0';
  const cleaned = String(val).replace(/[^\d]/g, '');
  let num = parseInt(cleaned, 10);
  if (!Number.isFinite(num) || num <= 0) return '0';

  // Jaga-jaga bila pekerja hanya menulis nominal puluhan/satuan ribu tanpa '000'
  // (misal 5 maksudnya 5.000, 45 maksudnya 45.000, 150 maksudnya 150.000)
  if (num < 1000) {
    num = num * 1000;
  }

  return String(num);
}

