const { pool } = require('../config/db');

const createComboTables = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS combo_offers (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            name            VARCHAR(255)   NOT NULL,
            slug            VARCHAR(255)   NOT NULL UNIQUE,
            description     TEXT,
            thumbnail       VARCHAR(500),
            comboPrice      DECIMAL(10,2)  NOT NULL,
            discountLabel   VARCHAR(100),
            status          ENUM('active','inactive') DEFAULT 'active',
            startDate       DATE,
            endDate         DATE,
            stockQuantity   INT            DEFAULT 0,
            totalMrp        DECIMAL(10,2)  DEFAULT 0,
            createdBy       INT,
            createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (createdBy) REFERENCES admins(id) ON DELETE SET NULL
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS combo_offer_products (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            combo_id      INT NOT NULL,
            product_id    INT NOT NULL,
            quantity      INT DEFAULT 1,
            FOREIGN KEY (combo_id)   REFERENCES combo_offers(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)     ON DELETE CASCADE,
            UNIQUE KEY unique_combo_product (combo_id, product_id)
        )
    `);
};

createComboTables();

/* ── Helpers ──────────────────────────────────────────────── */

const attachProducts = async (combo) => {
    const [rows] = await pool.query(`
        SELECT
            cop.quantity,
            p.id, p.name, p.sku, p.thumbnail,
            p.sellingPrice, p.buyingPrice, p.discountPrice,
            p.stockQuantity, p.unit,
            c.name AS category_name
        FROM combo_offer_products cop
        JOIN products   p ON cop.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE cop.combo_id = ?
        ORDER BY cop.id ASC
    `, [combo.id]);
    combo.products = rows;
    return combo;
};

// ── FIXED: admins JOIN hataya — frontend ko createdBy ki zaroorat nahi ──
const BASE_SELECT = `
    SELECT co.*
    FROM combo_offers co
`;

const shape = (row) => {
    if (!row) return null;
    return row;
};

/* ── Model ────────────────────────────────────────────────── */

const ComboOffer = {

    create: async (data) => {
        const { products, ...flat } = data;

        const fields = Object.keys(flat);
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(f => flat[f]);

        const [result] = await pool.query(
            `INSERT INTO combo_offers (${fields.join(', ')}) VALUES (${placeholders})`,
            values
        );

        const comboId = result.insertId;

        if (products?.length > 0) {
            const rows = products.map(p => [comboId, p.product_id, p.quantity || 1]);
            await pool.query(
                `INSERT INTO combo_offer_products (combo_id, product_id, quantity) VALUES ?`,
                [rows]
            );
        }

        const [rows2] = await pool.query(`${BASE_SELECT} WHERE co.id = ?`, [comboId]);
        return attachProducts(shape(rows2[0]));
    },

    find: async (filters = {}, { limit, skip } = {}) => {
        let where = 'WHERE 1=1';
        const vals = [];

        if (filters.search) {
            where += ` AND co.name LIKE ?`;
            vals.push(`%${filters.search}%`);
        }
        if (filters.status) {
            where += ` AND co.status = ?`;
            vals.push(filters.status);
        }

        let query = `${BASE_SELECT} ${where} ORDER BY co.createdAt DESC`;
        if (limit) { query += ` LIMIT ?`; vals.push(Number(limit)); }
        if (skip)  { query += ` OFFSET ?`; vals.push(Number(skip)); }

        const [rows] = await pool.query(query, vals);
        return Promise.all(rows.map(r => attachProducts(shape(r))));
    },

    countDocuments: async (filters = {}) => {
        let where = 'WHERE 1=1';
        const vals = [];
        if (filters.search) { where += ` AND name LIKE ?`; vals.push(`%${filters.search}%`); }
        if (filters.status) { where += ` AND status = ?`;  vals.push(filters.status); }
        const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM combo_offers ${where}`, vals);
        return rows[0].total;
    },

    findById: async (id) => {
        const [rows] = await pool.query(`${BASE_SELECT} WHERE co.id = ?`, [id]);
        if (!rows[0]) return null;
        return attachProducts(shape(rows[0]));
    },

    findByIdAndUpdate: async (id, data) => {
        const { products, ...flat } = data;

        if (Object.keys(flat).length > 0) {
            const fields = Object.keys(flat);
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const values = fields.map(f => flat[f]);
            await pool.query(`UPDATE combo_offers SET ${setClause} WHERE id = ?`, [...values, id]);
        }

        if (products !== undefined) {
            await pool.query(`DELETE FROM combo_offer_products WHERE combo_id = ?`, [id]);
            if (products.length > 0) {
                const rows = products.map(p => [id, p.product_id, p.quantity || 1]);
                await pool.query(
                    `INSERT INTO combo_offer_products (combo_id, product_id, quantity) VALUES ?`,
                    [rows]
                );
            }
        }

        const [rows] = await pool.query(`${BASE_SELECT} WHERE co.id = ?`, [id]);
        return attachProducts(shape(rows[0]));
    },

    findByIdAndDelete: async (id) => {
        const [rows] = await pool.query(`SELECT * FROM combo_offers WHERE id = ?`, [id]);
        if (!rows[0]) return null;
        await pool.query(`DELETE FROM combo_offers WHERE id = ?`, [id]);
        return rows[0];
    }
};

module.exports = ComboOffer;