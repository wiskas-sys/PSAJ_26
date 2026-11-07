import QRCode from 'qrcode';

/**
 * QRIS Stand Resmi Dian Motor (Bank BCA / ASPI National Switch)
 * NMID: ID1024353680076 | Terminal: A01 | MCC: 7538 (Bengkel Motor)
 */
export const OFFICIAL_DIAN_MOTOR_QRIS =
  '00020101021126650013ID.CO.BCA.WWW011893600014000261346802150008850026134680303UKE51440014ID.CO.QRIS.WWW0215ID10243536800760303UKE5204753853033605802ID5910DIAN MOTOR6006BREBES61055227362070703A016304DF54';

/**
 * Menghitung CRC-16-CCITT untuk standar EMVCo QRIS (Polynomial 0x1021, Init 0xFFFF)
 */
export function crc16(data) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Format tag TLV (Tag-Length-Value) standar EMVCo
 */
export function tlv(tag, value) {
  const str = String(value ?? '');
  const len = String(str.length).padStart(2, '0');
  return `${tag}${len}${str}`;
}

/**
 * Mengurai string EMVCo QRIS menjadi Map tag -> value
 */
export function parseTlv(emvcoString) {
  const tags = new Map();
  if (!emvcoString || typeof emvcoString !== 'string') return tags;
  const cleanStr = emvcoString.trim();
  const limit = cleanStr.includes('6304') ? cleanStr.lastIndexOf('6304') : cleanStr.length;
  let i = 0;
  while (i < limit) {
    if (i + 4 > limit) break;
    const tag = cleanStr.substring(i, i + 2);
    const len = parseInt(cleanStr.substring(i + 2, i + 4), 10);
    if (Number.isNaN(len) || i + 4 + len > limit) break;
    const val = cleanStr.substring(i + 4, i + 4 + len);
    tags.set(tag, val);
    i += 4 + len;
  }
  return tags;
}

/**
 * Mengonversi string QRIS statis resmi toko (BCA / GoPay / Nobu) menjadi QRIS dinamis dengan nominal pas
 */
export function convertStaticToDynamicQris(staticQris, { amount, orderId }) {
  if (!staticQris || typeof staticQris !== 'string') return null;
  const clean = staticQris.trim();
  if (!clean.startsWith('000201')) return null;

  const tags = parseTlv(clean);
  if (!tags.has('00')) return null;

  // Ubah tipe inisiasi ke Dinamis (12)
  tags.set('01', '12');

  // Suntikkan nominal transaksi (Tag 54)
  if (amount !== undefined && amount !== null) {
    const amtStr = String(Math.round(amount));
    tags.set('54', amtStr);
  }

  // Suntikkan referensi Order ID ke data tambahan (Tag 62)
  if (orderId) {
    const existing62 = tags.get('62') || '';
    const addTags = parseTlv(existing62);
    addTags.set('01', orderId.slice(0, 25));
    let new62 = '';
    for (const [t, v] of addTags.entries()) {
      new62 += tlv(t, v);
    }
    tags.set('62', new62);
  }

  // Susun ulang tag secara terurut
  const sortedKeys = Array.from(tags.keys()).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  let raw = '';
  for (const tag of sortedKeys) {
    if (tag === '63') continue;
    raw += tlv(tag, tags.get(tag));
  }
  raw += '6304';
  const checksum = crc16(raw);
  return `${raw}${checksum}`;
}

/**
 * Menghasilkan string QRIS Dinamis standar nasional Indonesia
 */
export function generateQrisString({
  amount,
  orderId = 'TRX-001',
  staticQris = OFFICIAL_DIAN_MOTOR_QRIS,
  merchantName = 'DIAN MOTOR',
  city = 'BREBES',
  postalCode = '52273',
  nmid = 'ID1024353680076',
}) {
  // Jika ada string QRIS statis toko terdaftar, konversi secara dinamis
  const baseStatic = staticQris || OFFICIAL_DIAN_MOTOR_QRIS;
  if (baseStatic) {
    const converted = convertStaticToDynamicQris(baseStatic, { amount, orderId });
    if (converted) return converted;
  }

  const amtStr = String(Math.round(amount));

  // Merchant Account Info (NMID Dian Motor)
  const mai26 =
    tlv('00', 'ID.CO.QRIS.WWW') +
    tlv('01', nmid) +
    tlv('02', '000000000001') +
    tlv('03', 'UKE');

  // Additional Data (Reference Order ID)
  const additionalData = tlv('01', orderId);

  const raw =
    tlv('00', '01') + // Payload Format Indicator
    tlv('01', '12') + // Point of Initiation: 12 (Dynamic QR)
    tlv('26', mai26) + // Merchant Account Information
    tlv('52', '7538') + // Merchant Category: 7538 (Automotive Repair / Bengkel)
    tlv('53', '360') + // Currency: IDR (360)
    tlv('54', amtStr) + // Transaction Amount (Tag 54)
    tlv('58', 'ID') + // Country Code
    tlv('59', merchantName.slice(0, 25)) + // Merchant Name
    tlv('60', city.slice(0, 15)) + // Merchant City
    tlv('61', postalCode.slice(0, 10)) + // Postal Code
    tlv('62', additionalData) + // Additional Data
    '6304'; // CRC Header

  const checksum = crc16(raw);
  return `${raw}${checksum}`;
}

/**
 * Membuat Gambar QR Code base64 DataURL (PNG) baik versi Dinamis maupun Statis Resmi
 */
export async function generateQrisDataUrl({ amount, orderId, staticQris, nmid }) {
  const effectiveStatic = staticQris || OFFICIAL_DIAN_MOTOR_QRIS;
  const qrisString = generateQrisString({ amount, orderId, staticQris: effectiveStatic, nmid });
  
  const [dataUrl, staticDataUrl] = await Promise.all([
    QRCode.toDataURL(qrisString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }),
    QRCode.toDataURL(effectiveStatic, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }),
  ]);

  return {
    qrisString,
    dataUrl,
    staticString: effectiveStatic,
    staticDataUrl,
  };
}

/**
 * Menghasilkan nominal unik 3 digit opsional untuk verifikasi cepat
 */
export function generateUniqueNominal(baseAmount) {
  const uniqueCode = Math.floor(Math.random() * 90) + 10;
  const total = Number(baseAmount) + uniqueCode;
  return {
    baseAmount: Number(baseAmount),
    uniqueCode,
    totalAmount: total,
  };
}
