const { pool } = require('../../config/db');

const ComboWishlist = {

    findByUser: async (userId) => {
        const [rows] = await pool.query(`
            SELECT 
                cw.id AS wishlist_id,
                co.id, co.name, co.slug, co.thumbnail,
                co.comboPrice, co.totalMrp, co.discountLabel,
                co.status, co.stockQuantity
            FROM combo_wishlists cw
            JOIN combo_offers co ON cw.combo_id = co.id
            WHERE cw.user_id = ?
            ORDER BY cw.createdAt DESC
        `, [userId]);

        // Attach products for each combo
        const combos = await Promise.all(rows.map(async (combo) => {
            const [products] = await pool.query(`
                SELECT 
                    p.id, p.name, p.thumbnail,
                    p.sellingPrice, p.stockQuantity,
                    cop.quantity
                FROM combo_offer_products cop
                JOIN products p ON cop.product_id = p.id
                WHERE cop.combo_id = ?
            `, [combo.id]);
            combo.products = products;
            return combo;
        }));

        return { combos };
    },

    add: async (userId, comboId) => {
        // Check combo exists
        const [combo] = await pool.query(
            `SELECT id FROM combo_offers WHERE id = ? AND status = 'active'`,
            [comboId]
        );
        if (!combo[0]) throw new Error('Combo not found or inactive');

        await pool.query(
            `INSERT IGNORE INTO combo_wishlists (user_id, combo_id) VALUES (?, ?)`,
            [userId, comboId]
        );
        return { message: 'Added to wishlist' };
    },

    remove: async (userId, comboId) => {
        await pool.query(
            `DELETE FROM combo_wishlists WHERE user_id = ? AND combo_id = ?`,
            [userId, comboId]
        );
        return { message: 'Removed from wishlist' };
    },

    isWished: async (userId, comboId) => {
        const [rows] = await pool.query(
            `SELECT id FROM combo_wishlists WHERE user_id = ? AND combo_id = ?`,
            [userId, comboId]
        );
        return rows.length > 0;
    }
};

module.exports = ComboWishlist;