const { pool } = require('../../config/db');

const createCartTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                user_id    INT NOT NULL,
                product_id INT NOT NULL,
                variant_id INT NULL DEFAULT NULL,
                quantity   INT NOT NULL DEFAULT 1,
                createdAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_cart_item (user_id, product_id, variant_id),
                FOREIGN KEY (user_id)    REFERENCES users(id)            ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id)         ON DELETE CASCADE,
                FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
            )
        `);
        console.log('cart_items table ready.');
    } catch (err) {
        console.error('Cart table creation failed:', err.message);
    }
};

createCartTable();

const getCartWithProducts = async (userId) => {
    const [items] = await pool.query(`
        SELECT
            ci.id, ci.user_id, ci.product_id, ci.combo_id, ci.quantity, ci.variant_id,
            p.name, p.thumbnail,
            p.buyingPrice   AS base_buyingPrice,
            p.sellingPrice  AS base_sellingPrice,
            p.discountPrice AS base_discountPrice,
            p.stockQuantity AS base_stockQuantity,
            p.unit, p.minOrderQuantity,
            pv.label         AS variant_label,
            pv.sku           AS variant_sku,
            pv.sellingPrice  AS variant_sellingPrice,
            pv.buyingPrice   AS variant_buyingPrice,
            pv.stockQuantity AS variant_stockQuantity,
            c.name          AS combo_name,
            c.thumbnail     AS combo_thumbnail,
            c.comboPrice    AS combo_price,
            c.totalMrp      AS combo_mrp,
            c.stockQuantity AS combo_stock,
            c.status        AS combo_status
        FROM cart_items ci
        LEFT JOIN products p          ON ci.product_id = p.id
        LEFT JOIN product_variants pv ON ci.variant_id = pv.id
        LEFT JOIN combo_offers c      ON ci.combo_id   = c.id
        WHERE ci.user_id = ?
        ORDER BY ci.createdAt ASC
    `, [userId]);

    const comboIds = [...new Set(items.filter(r => r.combo_id).map(r => r.combo_id))];
    const comboProducts = {};
    if (comboIds.length) {
        const [rows] = await pool.query(`
            SELECT cop.combo_id, cop.quantity,
                   p.id, p.name, p.thumbnail, p.unit, p.sellingPrice, p.buyingPrice
            FROM combo_offer_products cop
            JOIN products p ON cop.product_id = p.id
            WHERE cop.combo_id IN (?)
        `, [comboIds]);
        rows.forEach(r => {
            if (!comboProducts[r.combo_id]) comboProducts[r.combo_id] = [];
            comboProducts[r.combo_id].push({
                id: r.id, name: r.name, thumbnail: r.thumbnail, unit: r.unit,
                quantity: r.quantity,
                sellingPrice: Number(r.sellingPrice),
                buyingPrice: r.buyingPrice != null ? Number(r.buyingPrice) : null,
            });
        });
    }

    return {
        user_id: userId,
        items: items.map(row => {
            // ── COMBO ROW ──
            if (row.combo_id) {
                const comboPrice = Number(row.combo_price);
                const totalMrp = Number(row.combo_mrp);
                return {
                    id: row.id,
                    quantity: row.quantity,
                    isCombo: true,
                    variant: null,
                    combo: {
                        id: row.combo_id,
                        name: row.combo_name,
                        thumbnail: row.combo_thumbnail,
                        comboPrice, totalMrp,
                        stockQuantity: row.combo_stock,
                        status: row.combo_status,
                        products: comboProducts[row.combo_id] || [],
                    },
                    // CartDrawer / Checkout ke liye product-jaisa shape
                    product: {
                        id: null,
                        name: row.combo_name,
                        thumbnail: row.combo_thumbnail,
                        image: row.combo_thumbnail,
                        sellingPrice: comboPrice,
                        price: comboPrice,
                        buyingPrice: totalMrp,
                        discountPrice: null,
                        stockQuantity: row.combo_stock,
                        unit: 'combo',
                        minOrderQuantity: 1,
                    },
                };
            }

            // ── NORMAL PRODUCT ROW ──
            const hasVariant = !!row.variant_id;
            const sellingPrice = hasVariant && row.variant_sellingPrice != null
                ? Number(row.variant_sellingPrice) : Number(row.base_sellingPrice);
            const buyingPrice = hasVariant && row.variant_buyingPrice != null
                ? Number(row.variant_buyingPrice) : Number(row.base_buyingPrice);
            const stockQuantity = hasVariant && row.variant_stockQuantity != null
                ? row.variant_stockQuantity : row.base_stockQuantity;

            return {
                id: row.id,
                quantity: row.quantity,
                isCombo: false,
                variant: hasVariant ? {
                    id: row.variant_id,
                    label: row.variant_label,
                    sku: row.variant_sku,
                    sellingPrice: Number(row.variant_sellingPrice),
                } : null,
                product: {
                    id: row.product_id,
                    name: row.name,
                    thumbnail: row.thumbnail,
                    image: row.thumbnail,
                    buyingPrice, sellingPrice,
                    discountPrice: row.base_discountPrice != null ? Number(row.base_discountPrice) : null,
                    price: sellingPrice,
                    stockQuantity,
                    unit: row.unit,
                    minOrderQuantity: row.minOrderQuantity ?? 1,
                },
            };
        }),
    };
};

const Cart = {

    findByUser: async (userId) => {
        return await getCartWithProducts(userId);
    },

    addOrIncrement: async (userId, productId, quantity = 1, variantId = null) => {
        const vid = variantId || null;
        console.log('[Cart] addOrIncrement:', { userId, productId, quantity, variantId: vid });

        if (vid === null) {
            const [existing] = await pool.query(`
                SELECT id FROM cart_items
                WHERE user_id = ? AND product_id = ? AND variant_id IS NULL
            `, [userId, productId]);

            if (existing.length > 0) {
                await pool.query(`
                    UPDATE cart_items SET quantity = quantity + ?
                    WHERE user_id = ? AND product_id = ? AND variant_id IS NULL
                `, [quantity, userId, productId]);
            } else {
                await pool.query(`
                    INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
                    VALUES (?, ?, NULL, ?)
                `, [userId, productId, quantity]);
            }
        } else {
            const [existing] = await pool.query(`
                SELECT id FROM cart_items
                WHERE user_id = ? AND product_id = ? AND variant_id = ?
            `, [userId, productId, vid]);

            if (existing.length > 0) {
                await pool.query(`
                    UPDATE cart_items SET quantity = quantity + ?
                    WHERE user_id = ? AND product_id = ? AND variant_id = ?
                `, [quantity, userId, productId, vid]);
            } else {
                await pool.query(`
                    INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
                    VALUES (?, ?, ?, ?)
                `, [userId, productId, vid, quantity]);
            }
        }

        return await getCartWithProducts(userId);
    },

    addOrIncrementCombo: async (userId, comboId, quantity = 1) => {
    const [[combo]] = await pool.query(
        `SELECT id, stockQuantity, status, startDate, endDate
         FROM combo_offers WHERE id = ?`, [comboId]
    );
    if (!combo || combo.status !== 'active') {
        throw Object.assign(new Error('Combo not available.'), { status: 404 });
    }

    const now = Date.now();
    if (combo.startDate && new Date(combo.startDate).getTime() > now) {
        throw Object.assign(new Error('This combo offer has not started yet.'), { status: 400 });
    }
    if (combo.endDate && new Date(combo.endDate).setHours(23, 59, 59, 999) < now) {
        throw Object.assign(new Error('This combo offer has expired.'), { status: 400 });
    }

    const [[existing]] = await pool.query(
        `SELECT id, quantity FROM cart_items WHERE user_id = ? AND combo_id = ?`,
        [userId, comboId]
    );
    const newQty = (existing?.quantity || 0) + quantity;

    if (newQty > combo.stockQuantity) {
        throw Object.assign(
            new Error(`Only ${combo.stockQuantity} combo(s) available.`), { status: 400 }
        );
    }

    if (existing) {
        await pool.query(`UPDATE cart_items SET quantity = ? WHERE id = ?`, [newQty, existing.id]);
    } else {
        await pool.query(
            `INSERT INTO cart_items (user_id, product_id, variant_id, combo_id, quantity)
             VALUES (?, NULL, NULL, ?, ?)`,
            [userId, comboId, quantity]
        );
    }
    return await getCartWithProducts(userId);
},

    // ✅ cart_item ka id se update/delete karo — product_id se nahi
    updateQuantity: async (userId, cartItemId, quantity) => {
    if (quantity <= 0) {
        await pool.query(
            `DELETE FROM cart_items WHERE id = ? AND user_id = ?`, [cartItemId, userId]
        );
    } else {
        const [[row]] = await pool.query(
            `SELECT ci.combo_id, c.stockQuantity
             FROM cart_items ci LEFT JOIN combo_offers c ON c.id = ci.combo_id
             WHERE ci.id = ? AND ci.user_id = ?`, [cartItemId, userId]
        );
        if (row?.combo_id && quantity > row.stockQuantity) {
            throw Object.assign(
                new Error(`Only ${row.stockQuantity} combo(s) available.`), { status: 400 }
            );
        }
        await pool.query(
            `UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?`,
            [quantity, cartItemId, userId]
        );
    }
    return await getCartWithProducts(userId);
},

    // ✅ cart_item ka id se delete karo — product_id se nahi
    removeItem: async (userId, cartItemId) => {
        await pool.query(
            `DELETE FROM cart_items WHERE id = ? AND user_id = ?`,
            [cartItemId, userId]
        );
        return await getCartWithProducts(userId);
    },

    findByUserRaw: async (userId) => {
        return await getCartWithProducts(userId);
    },

    clearByUser: async (userId) => {
        await pool.query(
            `DELETE FROM cart_items WHERE user_id = ?`, [userId]
        );
    },
};

module.exports = Cart;