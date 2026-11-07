import { createClient } from '@/lib/supabase/client';

export function deriveDefaultRack(categoryName = '', code = '') {
    const c = String(categoryName || '').toLowerCase();
    if (c.includes('oli') || c.includes('pelumas') || c.includes('cairan')) return 'Rak A-01 (Oli)';
    if (c.includes('rem') || c.includes('brake')) return 'Rak B-01 (Rem)';
    if (c.includes('busi') || c.includes('pengapian')) return 'Rak B-02 (Busi)';
    if (c.includes('listrik') || c.includes('lampu') || c.includes('aki')) return 'Rak C-01 (Kelistrikan)';
    if (c.includes('mesin') || c.includes('cvt') || c.includes('roller') || c.includes('v-belt')) return 'Rak D-01 (Mesin & CVT)';
    if (c.includes('rantai') || c.includes('gear') || c.includes('gir')) return 'Rak D-02 (Rantai & Gear)';
    if (c.includes('ban') || c.includes('roda') || c.includes('velg')) return 'Rak E-01 (Ban & Roda)';
    if (c.includes('suspensi') || c.includes('shock')) return 'Rak E-02 (Suspensi)';
    if (c.includes('filter')) return 'Rak A-02 (Filter)';
    if (c.includes('baut') || c.includes('fastener')) return 'Rak G-01 (Baut)';
    const initial = code ? code.replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase() || 'A' : 'A';
    return `Rak ${initial}-01`;
}

const fieldsWithRack = 'id,code,name,category_id,purchase_price,selling_price,stock,minimum_stock,unit,rack,created_at,updated_at,is_active,categories(name)';
const fieldsBase = 'id,code,name,category_id,purchase_price,selling_price,stock,minimum_stock,unit,created_at,updated_at,is_active,categories(name)';

const mapProduct = (row) => {
    const categoryName = row.categories?.name || 'Lainnya';
    const rack = row.rack && String(row.rack).trim() ? String(row.rack).trim() : deriveDefaultRack(categoryName, row.code);
    return {
        id: row.id, code: row.code, name: row.name, category: categoryName,
        purchasePrice: Number(row.purchase_price), sellingPrice: Number(row.selling_price),
        stock: row.stock, minimumStock: row.minimum_stock, unit: row.unit,
        rack,
    };
};

export async function listStockProducts() {
    const supabase = createClient();
    try {
        const { data, error } = await supabase.from('products').select(fieldsWithRack).eq('is_active', true).order('name');
        if (!error && data) return data.map(mapProduct);
    } catch {}
    const { data, error } = await supabase.from('products').select(fieldsBase).eq('is_active', true).order('name');
    if (error) throw error;
    return (data || []).map(mapProduct);
}

export async function listStockCategories() {
    const { data, error } = await createClient().from('categories').select('id,name').order('name');
    if (error) throw error;
    return data || [];
}

export async function listStockSuppliers() {
    const { data, error } = await createClient().from('suppliers').select('id,name').order('name');
    if (error) throw error;
    return data || [];
}

export async function suggestStockCode(category) {
    const products = await listStockProducts();
    const prefix = `${category || ''}`.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'BRG';
    const used = new Set(products.map(product => product.code.toUpperCase()));
    let n = 1;
    while (used.has(`${prefix}-${String(n).padStart(3, '0')}`)) n++;
    return `${prefix}-${String(n).padStart(3, '0')}`;
}

export async function saveStockProduct(draft) {
    const supabase = createClient();
    const { data: category, error: categoryError } = await supabase.from('categories')
        .upsert({ name: draft.category }, { onConflict: 'name' }).select('id').single();
    if (categoryError) throw categoryError;
    const requestedStock = Math.trunc(Number(draft.stock));
    const rackValue = draft.rack?.trim() || '';
    const payloadWithRack = {
        code: draft.code.trim().toUpperCase(), name: draft.name.trim(), category_id: category.id,
        unit: draft.unit, purchase_price: Number(draft.purchasePrice), selling_price: Number(draft.sellingPrice),
        minimum_stock: Math.trunc(Number(draft.minimumStock)), rack: rackValue,
    };
    const payloadBase = {
        code: draft.code.trim().toUpperCase(), name: draft.name.trim(), category_id: category.id,
        unit: draft.unit, purchase_price: Number(draft.purchasePrice), selling_price: Number(draft.sellingPrice),
        minimum_stock: Math.trunc(Number(draft.minimumStock)),
    };

    let data, error;
    try {
        const query = draft.id
            ? supabase.from('products').update(payloadWithRack).eq('id', draft.id)
            : supabase.from('products').insert({ ...payloadWithRack, stock: 0 });
        const res = await query.select(fieldsWithRack).single();
        data = res.data;
        error = res.error;
    } catch {
        error = { message: 'retry base' };
    }

    if (error) {
        const queryFallback = draft.id
            ? supabase.from('products').update(payloadBase).eq('id', draft.id)
            : supabase.from('products').insert({ ...payloadBase, stock: 0 });
        const resFallback = await queryFallback.select(fieldsBase).single();
        if (resFallback.error) throw resFallback.error;
        data = { ...resFallback.data, rack: rackValue };
    }

    const currentStock = draft.id ? data.stock : 0;
    if (requestedStock !== currentStock) {
        const incoming = requestedStock > currentStock;
        const reference = draft.id ? 'KOREKSI' : (draft.opening?.reference || 'STOKAWAL');
        const notes = draft.id ? 'Penyesuaian stok dari formulir ubah barang.' : `Stok awal${draft.opening?.party ? ` dari ${draft.opening.party}` : ''}.`;
        await recordStockMovement({
            productId: data.id, type: incoming ? 'IN' : 'OUT', quantity: Math.abs(requestedStock - currentStock),
            reference, notes, kind: draft.id ? 'KOREKSI' : 'STOKAWAL', party: draft.opening?.party || null,
            date: draft.opening?.date,
        });
    }
    return { ...mapProduct(data), stock: requestedStock, rack: rackValue || data.rack };
}

export async function deleteStockProduct(id) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('delete_stock_product', { p_product: id });
    if (error) throw error;
    return data;
}

export async function listStockMovements() {
    const { data, error } = await createClient().from('stock_movements')
        .select('id,product_id,type,quantity,reference,notes,user_id,created_at,products(code,name,unit)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({ id: row.id, code: row.id.slice(0, 8).toUpperCase(), productId: row.product_id,
        productCode: row.products?.code || '', productName: row.products?.name || 'Produk dihapus',
        unit: row.products?.unit || '', type: row.type, kind: row.kind || (row.type === 'IN' ? 'PEMASOKAN' : 'PEMAKAIAN'),
        quantity: row.quantity, delta: row.type === 'IN' ? row.quantity : -row.quantity,
        reference: row.reference || '', party: row.party || '', notes: row.notes || '',
        date: row.movement_date || row.created_at?.slice(0, 10), createdAt: row.created_at,
        before: row.before_stock, after: row.after_stock }));
}

export async function recordStockMovement(draft) {
    const { data, error } = await createClient().rpc('record_stock_movement', {
        p_product: draft.productId, p_type: draft.type, p_quantity: Math.trunc(Number(draft.quantity)),
        p_reference: draft.reference || null, p_notes: draft.notes || null,
        p_kind: draft.kind || (draft.type === 'IN' ? 'PEMASOKAN' : 'PEMAKAIAN'),
        p_party: draft.party || null, p_date: draft.date || new Date().toISOString().slice(0, 10),
    });
    if (error) throw error;
    return data;
}

export async function applyStockOpname({ date, notes, lines }) {
    const p_lines = lines.map(line => ({ product_id: line.productId, counted: Math.trunc(Number(line.count)) }));
    const { data, error } = await createClient().rpc('set_stock_counts', { p_lines, p_date: date, p_notes: notes || null });
    if (error) throw error;
    return { adjusted: data };
}

export async function bulkImportStockProducts(rows, opening) {
    const p_rows = rows.map(row => ({
        code: row.code, name: row.name, category: row.category, unit: row.unit,
        stock: Math.trunc(Number(row.stock)), minimum_stock: Math.trunc(Number(row.minimumStock)),
        purchase_price: Number(row.purchasePrice), selling_price: Number(row.sellingPrice),
        rack: row.rack?.trim() || ''
    }));
    try {
        const { data, error } = await createClient().rpc('import_stock_products', {
            p_rows, p_date: opening.date, p_reference: opening.reference || null, p_party: opening.party || null,
        });
        if (!error) return data;
    } catch {}
    // Fallback without rack if database function doesn't accept rack column yet
    const fallbackRows = rows.map(row => ({
        code: row.code, name: row.name, category: row.category, unit: row.unit,
        stock: Math.trunc(Number(row.stock)), minimum_stock: Math.trunc(Number(row.minimumStock)),
        purchase_price: Number(row.purchasePrice), selling_price: Number(row.sellingPrice)
    }));
    const { data: fbData, error: fbError } = await createClient().rpc('import_stock_products', {
        p_rows: fallbackRows, p_date: opening.date, p_reference: opening.reference || null, p_party: opening.party || null,
    });
    if (fbError) throw fbError;
    return fbData;
}

export async function checkoutStockSale({ code, idempotencyKey, items, discount, method, paid, customerId }) {
    const { data, error } = await createClient().rpc('checkout_stock_sale', {
        p_transaction_code: code, p_idempotency_key: idempotencyKey, p_items: items,
        p_discount: Number(discount || 0), p_payment_method: method,
        p_payment_amount: Number(paid || 0), p_customer_id: customerId || null,
    });
    if (error) throw error;
    return data;
}

export async function listStockCustomers() {
    const { data, error } = await createClient().from('customers').select('id,name').order('name');
    if (error) throw error;
    return data || [];
}

