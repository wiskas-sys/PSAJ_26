import { isOwner } from '../demo-auth.js';

// Kata kunci dan frasa terlarang untuk akun Kasir (melindungi Owner)
const RESTRICTED_FOR_KASIR = [
    // Harga Beli / Modal
    'harga modal', 'harga beli', 'modal beli', 'kulakan', 'beli berapa',
    'harga supplier', 'modalnya berapa', 'harga dari pabrik', 'hpp',
    'harga pokok', 'harga distributor', 'beli ke supplier',
    
    // Keuntungan & Margin
    'keuntungan', 'margin', 'untung berapa', 'laba', 'profit',
    'untung bersih', 'laba kotor', 'laba bersih', 'persentase untung',
    'selisih harga jual dan beli', 'untung toko',
    
    // Omset & Keuangan Rahasia Owner
    'total omset', 'omset toko', 'omset hari ini', 'omset bulan ini',
    'pendapatan toko', 'total pendapatan', 'laporan keuangan',
    'uang masuk toko', 'brankas', 'saldo rekening', 'rekening owner',
    'laba rugi', 'laporan laba',
    
    // Kredensial & Akses Owner
    'password owner', 'kata sandi owner', 'email owner', 'pin owner',
    'api key', 'secret key', 'service role', 'token midtrans',
    'password database', 'supabase key', 'akses owner', 'bobol',
    'hack', 'bypass role',
    
    // Manipulasi Transaksi
    'hapus transaksi', 'void transaksi', 'palsukan struk', 'manipulasi stok',
];

/**
 * Cek apakah prompt dari kasir berpotensi mengancam kedudukan atau keuntungan owner
 * @param {string} prompt - Pesan yang diketik user
 * @param {string} userRole - Role user saat ini ('admin' | 'owner' | 'kasir')
 * @returns {{ allowed: boolean, reason?: string, warningReply?: string }}
 */
export function checkPromptSafety(prompt, userRole = 'kasir') {
    // Jika Owner, izinkan akses analitik penuh
    if (isOwner(userRole)) {
        return { allowed: true };
    }

    const lower = (prompt || '').toLowerCase();

    // Cek apakah prompt kasir mengandung topik rahasia Owner
    for (const phrase of RESTRICTED_FOR_KASIR) {
        if (lower.includes(phrase)) {
            return {
                allowed: false,
                reason: `Topik rahasia Owner: "${phrase}"`,
                warningReply:
                    `⚠️ **Akses Informasi Dibatasi**\n\n` +
                    `Maaf, informasi mengenai **harga modal/beli**, **margin keuntungan**, **total omset**, dan **data internal pemilik** merupakan kebijakan rahasia khusus **Owner Dian Motor**.\n\n` +
                    `Sebagai staf Kasir, Anda hanya memiliki hak akses untuk memantau **ketersediaan stok**, **posisi rak penyimpanan**, dan **harga jual resmi** suku cadang kepada pelanggan demi keamanan operasional bengkel.`
            };
        }
    }

    // Lolos pengecekan
    return { allowed: true };
}
