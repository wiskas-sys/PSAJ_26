import QRCode from 'qrcode';

/**
 * Menghitung CRC-16-CCITT untuk standar EMVCo QRIS (Polynomial 0x1021, Init 0xFFFF)
 */
function crc16(data) {
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
function tlv(tag, value) {
  const str = String(value ?? '');
  const len = String(str.length).padStart(2, '0');
  return `${tag}${len}${str}`;
}

/**
 * Menghasilkan string QRIS Dinamis standar nasional Indonesia
 */
export function generateQrisString({ amount, orderId = 'TRX-001' }) {
  const amtStr = String(Math.round(amount));

  // Merchant Account Info (NMID Dian Motor)
  const mai26 =
    tlv('00', 'ID.CO.QRIS.WWW') +
    tlv('01', '936009180000000000') +
    tlv('02', '000000000001') +
    tlv('03', 'UME');

  // Additional Data (Reference Order ID)
  const additionalData = tlv('01', orderId);

  let raw =
    tlv('00', '01') + // Payload Format Indicator
    tlv('01', '12') + // Point of Initiation: 12 (Dynamic QR)
    tlv('26', mai26) + // Merchant Account Information
    tlv('52', '5533') + // Merchant Category: 5533 (Automotive parts)
    tlv('53', '360') + // Currency: IDR (360)
    tlv('54', amtStr) + // Transaction Amount (Tag 54)
    tlv('58', 'ID') + // Country Code
    tlv('59', 'DIAN MOTOR BENGKEL') + // Merchant Name
    tlv('60', 'BANYUMAS') + // Merchant City
    tlv('61', '53100') + // Postal Code
    tlv('62', additionalData) + // Additional Data
    '6304'; // CRC Header

  const checksum = crc16(raw);
  return `${raw}${checksum}`;
}

/**
 * Membuat Gambar QR Code base64 DataURL (PNG)
 */
export async function generateQrisDataUrl({ amount, orderId }) {
  const qrisString = generateQrisString({ amount, orderId });
  const dataUrl = await QRCode.toDataURL(qrisString, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
  return { qrisString, dataUrl };
}

/**
 * Menghasilkan nominal unik 3 digit (contoh Rp 50.000 -> Rp 50.012)
 */
export function generateUniqueNominal(baseAmount) {
  const uniqueCode = Math.floor(Math.random() * 90) + 10; // 10 s/d 99
  const total = Number(baseAmount) + uniqueCode;
  return {
    baseAmount: Number(baseAmount),
    uniqueCode,
    totalAmount: total,
  };
}

