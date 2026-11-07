import { createHash } from 'node:crypto';

const PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_PRODUCTION === 'true';

export function midtransBaseUrl() {
    return PRODUCTION ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
}

export function snapScriptUrl() {
    return `${midtransBaseUrl()}/snap/snap.js`;
}

export function isMidtransConfigured() {
    const s = process.env.MIDTRANS_SERVER_KEY || '';
    const c = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
    return Boolean(s && c && !s.startsWith('your-') && !c.startsWith('your-') && s !== 'your-server-key' && c !== 'your-client-key');
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

export async function createSnapToken({ orderId, grossAmount, customer, items, finishUrl, expiryMinutes = 60 }) {
    const body = {
        transaction_details: { order_id: orderId, gross_amount: grossAmount },
        expiry: { unit: 'minutes', duration: expiryMinutes },
    };
    if (customer)
        body.customer_details = customer;
    if (items && items.length)
        body.item_details = items.map(i => ({ id: String(i.id), price: i.price, quantity: i.qty, name: i.name }));
    if (finishUrl)
        body.callbacks = { finish: finishUrl };
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

export async function createCoreQris({ orderId, grossAmount, customer }) {
    if (!isMidtransConfigured()) return null;
    const body = {
        payment_type: 'qris',
        transaction_details: {
            order_id: orderId,
            gross_amount: Math.round(grossAmount),
        },
    };
    if (customer) {
        body.customer_details = {
            first_name: customer.name || 'Pelanggan',
        };
    }
    const res = await fetch(`${midtransBaseUrl()}/v2/charge`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader(),
            Accept: 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = Array.isArray(data.error_messages) ? data.error_messages.join(', ') : (data.status_message || `Midtrans charge HTTP ${res.status}`);
        throw new Error(msg);
    }
    const qrAction = data.actions?.find(a => a.name === 'generate-qr-code');
    return {
        qrCodeUrl: qrAction?.url || null,
        qrString: data.qr_string || null,
        transactionId: data.transaction_id,
        orderId: data.order_id,
        grossAmount: data.gross_amount,
        status: data.transaction_status,
    };
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
    if (!isMidtransConfigured()) return { status_code: '404', transaction_status: 'not_found' };
    const res = await fetch(`${midtransBaseUrl()}/v2/${encodeURIComponent(orderId)}/status`, {
        headers: { Accept: 'application/json', Authorization: authHeader() },
        cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        if (res.status === 404 || data.status_code === '404') return { status_code: '404', transaction_status: 'not_found' };
        throw new Error(data.status_message ?? `Midtrans status HTTP ${res.status}`);
    return data;
}

export function methodFromPaymentType(paymentType) {
    const type = String(paymentType || '').toLowerCase();
    if (!type)
        return 'Lainnya';
    if (type === 'qris')
        return 'QRIS';
    if (type === 'credit_card')
        return 'Kartu Kredit';
    if (type === 'cstore')
        return 'Retail Outlet';
    if (type === 'akulaku' || type === 'kredivo')
        return 'Paylater';
    if (type.includes('va') || ['bank_transfer', 'echannel', 'permata', 'bca_klikpay', 'bca_klikbca', 'cimb_clicks', 'mandiri_clickpay', 'bri_epay'].includes(type))
        return 'Virtual Account';
    if (['gopay', 'shopeepay', 'ovo', 'dana', 'linkaja', 'jeniuspay', 'sakuku', 'astrapay'].includes(type) || type.startsWith('ewallet'))
        return 'E-Wallet';
    return 'Lainnya';
}

export function isPaidStatus(status) {
    return status === 'settlement' || status === 'capture';
}