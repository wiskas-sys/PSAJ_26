import { createHash } from 'node:crypto';

const PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_PRODUCTION === 'true';

export function midtransBaseUrl() {
    return PRODUCTION ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
}

export function snapScriptUrl() {
    return `${midtransBaseUrl()}/snap/snap.js`;
}

export function isMidtransConfigured() {
    return Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
}

export function midtransEnvironment() {
    return isMidtransConfigured() ? (PRODUCTION ? 'production' : 'sandbox') : 'unconfigured';
}

function authHeader() {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey)
        throw new Error('MIDTRANS_SERVER_KEY belum dikonfigurasi.');
    return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;
}

export async function createSnapToken({ orderId, grossAmount, customer, items }) {
    const body = {
        transaction_details: { order_id: orderId, gross_amount: grossAmount },
    };
    if (customer)
        body.customer_details = customer;
    if (items && items.length)
        body.item_details = items.map(i => ({ id: String(i.id), price: i.price, quantity: i.qty, name: i.name }));
    const res = await fetch(`${midtransBaseUrl()}/snap/v1/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader(), Accept: 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = Array.isArray(data.error_messages) ? data.error_messages.join(', ') : `Midtrans HTTP ${res.status}`;
        throw new Error(msg);
    }
    return { token: data.token, redirectUrl: data.redirect_url };
}

export function verifyNotificationSignature(payload) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey)
        return false;
    const key = payload.signature_key;
    if (!key)
        return false;
    const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
    const hash = createHash('sha512').update(raw).digest('hex');
    return hash === key;
}

export async function getTransactionStatus(orderId) {
    const res = await fetch(`${midtransBaseUrl()}/v2/${encodeURIComponent(orderId)}/status`, {
        headers: { Accept: 'application/json', Authorization: authHeader() },
        cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data.status_message ?? `Midtrans status HTTP ${res.status}`);
    return data;
}

export function methodFromPaymentType(paymentType) {
    const type = String(paymentType || '').toLowerCase();
    if (type === 'qris')
        return 'QRIS';
    if (type === 'gopay' || type === 'shopeepay' || type === 'ovo' || type === 'dana' || type.startsWith('ewallet'))
        return 'E-Wallet';
    if (type === 'bank_transfer' || type === 'echannel' || type === 'permata' || type === 'bca_klikpay')
        return 'Virtual Account';
    if (type === 'credit_card')
        return 'Kartu Kredit';
    if (type === 'cstore')
        return 'Retail Outlet';
    if (type === 'echannel')
        return 'Virtual Account';
    return 'Lainnya';
}

export function isPaidStatus(status) {
    return status === 'settlement' || status === 'capture';
}