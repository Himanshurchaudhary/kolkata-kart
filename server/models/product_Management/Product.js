const { pool } = require('../../config/db');

const createProductTables = async () => {
    // Main products table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id               INT AUTO_INCREMENT PRIMARY KEY,
            name             VARCHAR(255)  NOT NULL,
            slug             VARCHAR(255)  NOT NULL UNIQUE,
            shortDescription TEXT          NOT NULL,
            description      LONGTEXT      NOT NULL,
            brand_id         INT,
            unit             VARCHAR(50)   NOT NULL,
            sku              VARCHAR(100)  NOT NULL UNIQUE,
            category_id      INT           NOT NULL,
            buyingPrice      DECIMAL(10,2) NOT NULL,
            sellingPrice     DECIMAL(10,2) NOT NULL,
            discountPrice    DECIMAL(10,2) DEFAULT 0,
            stockQuantity    INT           NOT NULL,
            minOrderQuantity INT           DEFAULT 1,
            thumbnail        VARCHAR(500)  NOT NULL,
            videoType        ENUM('Upload','YouTube','Vimeo','Dailymotion'),
            videoUrl         VARCHAR(500),
            metaTitle        VARCHAR(255),
            metaDescription  TEXT,
            createdBy        INT,
            createdAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (brand_id)    REFERENCES brands(id)     ON DELETE SET NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
            FOREIGN KEY (createdBy)   REFERENCES admins(id)     ON DELETE SET NULL
        )
    `);

    // additionalImages — one row per image, linked to product
    await pool.query(`
        CREATE TABLE IF NOT EXISTS product_images (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            imageUrl   VARCHAR(500) NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `);

    // metaKeywords — one row per keyword
    await pool.query(`
        CREATE TABLE IF NOT EXISTS product_keywords (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            keyword    VARCHAR(255) NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `);

    // attributes — key/value pairs per product
    await pool.query(`
        CREATE TABLE IF NOT EXISTS product_attributes (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            \`key\`    VARCHAR(255) NOT NULL,
            \`value\`  VARCHAR(255) NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `);

    // ── NEW: product variants ──────────────────────────────────────────────
    await pool.query(`
        CREATE TABLE IF NOT EXISTS product_variants (
            id               INT AUTO_INCREMENT PRIMARY KEY,
            product_id       INT           NOT NULL,
            label            VARCHAR(255)  NOT NULL,
            sku              VARCHAR(100)  NOT NULL UNIQUE,
            buyingPrice      DECIMAL(10,2) NOT NULL,
            sellingPrice     DECIMAL(10,2) NOT NULL,
            discountPrice    DECIMAL(10,2) DEFAULT 0,
            stockQuantity    INT           NOT NULL DEFAULT 0,
            minOrderQuantity INT           DEFAULT 1,
            isDefault        TINYINT(1)    DEFAULT 0,
            createdAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `);
};

createProductTables();

/* ── Internal helpers ────────────────────────────────────────────────────── */

const insertChildren = async (productId, additionalImages, metaKeywords, attributes) => {
    if (additionalImages?.length > 0) {
        const rows = additionalImages.map(url => [productId, url]);
        await pool.query(`INSERT INTO product_images (product_id, imageUrl) VALUES ?`, [rows]);
    }
    if (metaKeywords?.length > 0) {
        const rows = metaKeywords.map(k => [productId, k]);
        await pool.query(`INSERT INTO product_keywords (product_id, keyword) VALUES ?`, [rows]);
    }
    if (attributes?.length > 0) {
        const rows = attributes.map(a => [productId, a.key, a.value]);
        await pool.query(
            `INSERT INTO product_attributes (product_id, \`key\`, \`value\`) VALUES ?`, [rows]
        );
    }
};

const deleteChildren = async (productId) => {
    await pool.query(`DELETE FROM product_images     WHERE product_id = ?`, [productId]);
    await pool.query(`DELETE FROM product_keywords   WHERE product_id = ?`, [productId]);
    await pool.query(`DELETE FROM product_attributes WHERE product_id = ?`, [productId]);
};

// ── NEW: variant helpers ───────────────────────────────────────────────────

/**
 * Insert variants for a product.
 * variants = [{ label, sku, buyingPrice, sellingPrice, discountPrice, stockQuantity, minOrderQuantity, isDefault }]
 */
const insertVariants = async (productId, variants) => {
    if (!variants?.length) return;
    const rows = variants.map((v, i) => [
        productId,
        v.label,
        v.sku,
        Number(v.buyingPrice) || 0,
        Number(v.sellingPrice) || 0,
        Number(v.discountPrice) || 0,
        Number(v.stockQuantity) || 0,
        Number(v.minOrderQuantity) || 1,
        i === 0 ? 1 : (v.isDefault ? 1 : 0),   // first variant = default unless overridden
    ]);
    await pool.query(
        `INSERT INTO product_variants
            (product_id, label, sku, buyingPrice, sellingPrice, discountPrice, stockQuantity, minOrderQuantity, isDefault)
         VALUES ?`,
        [rows]
    );
};

const deleteVariants = async (productId) => {
    await pool.query(`DELETE FROM product_variants WHERE product_id = ?`, [productId]);
};

const attachVariants = async (product) => {
    const [variants] = await pool.query(
        `SELECT id, label, sku, buyingPrice, sellingPrice, discountPrice,
                stockQuantity, minOrderQuantity, isDefault
         FROM product_variants
         WHERE product_id = ?
         ORDER BY isDefault DESC, id ASC`,
        [product.id]
    );
    product.variants = variants;
    return product;
};

// ─────────────────────────────────────────────────────────────────────────────

const attachChildren = async (product) => {
    const [images] = await pool.query(`SELECT imageUrl FROM product_images     WHERE product_id = ?`, [product.id]);
    const [keywords] = await pool.query(`SELECT keyword  FROM product_keywords   WHERE product_id = ?`, [product.id]);
    const [attributes] = await pool.query(`SELECT \`key\`, \`value\` FROM product_attributes WHERE product_id = ?`, [product.id]);

    product.additionalImages = images.map(r => r.imageUrl);
    product.metaKeywords = keywords.map(r => r.keyword);
    product.attributes = attributes;

    // attach variants too
    await attachVariants(product);
    return product;
};

const BASE_SELECT = `
    SELECT
        p.*,
        c.name        AS category_name,
        c.thumbnail   AS category_thumbnail,
        b.name        AS brand_name,
        a.name        AS createdBy_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands     b ON p.brand_id    = b.id
    LEFT JOIN admins     a ON p.createdBy   = a.id
`;

const shape = (row) => {
    if (!row) return null;
    row.category = { id: row.category_id, name: row.category_name, thumbnail: row.category_thumbnail };
    row.brand = { id: row.brand_id, name: row.brand_name };
    row.createdBy = { id: row.createdBy, name: row.createdBy_name };
    ['category_name', 'category_thumbnail', 'brand_name', 'createdBy_name'].forEach(k => delete row[k]);
    return row;
};

/* ── Model methods ───────────────────────────────────────────────────────── */

const Product = {

    create: async (data) => {
        const { additionalImages, metaKeywords, attributes, variants, ...flat } = data;

        const fields = Object.keys(flat);
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(f => flat[f]);

        const [result] = await pool.query(
            `INSERT INTO products (${fields.join(', ')}) VALUES (${placeholders})`,
            values
        );

        await insertChildren(result.insertId, additionalImages, metaKeywords, attributes);
        await insertVariants(result.insertId, variants);   // ← NEW

        const [rows] = await pool.query(`${BASE_SELECT} WHERE p.id = ?`, [result.insertId]);
        return attachChildren(shape(rows[0]));
    },

    find: async (filters = {}, { limit, skip } = {}) => {
        let where = 'WHERE 1=1';
        const vals = [];

        if (filters.search) {
            where += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
            vals.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.category_id) {
            where += ` AND p.category_id = ?`;
            vals.push(filters.category_id);
        }
        if (filters.status) {
            where += ` AND p.status = ?`;
            vals.push(filters.status);
        }

        let query = `${BASE_SELECT} ${where} ORDER BY p.createdAt DESC`;
        if (limit) { query += ` LIMIT ?`; vals.push(limit); }
        if (skip) { query += ` OFFSET ?`; vals.push(skip); }

        const [rows] = await pool.query(query, vals);
        return Promise.all(rows.map(r => attachChildren(shape(r))));
    },

    countDocuments: async (filters = {}) => {
        let where = 'WHERE 1=1';
        const vals = [];

        if (filters.search) {
            where += ` AND (name LIKE ? OR sku LIKE ?)`;
            vals.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.category_id) {
  where += ` AND category_id = ?`;
  vals.push(filters.category_id);
}
if (filters.status) {
  where += ` AND status = ?`;
  vals.push(filters.status);
}

        const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM products ${where}`, vals);
        return rows[0].total;
    },

    findById: async (id) => {
        const [rows] = await pool.query(`${BASE_SELECT} WHERE p.id = ?`, [id]);
        if (!rows[0]) return null;
        return attachChildren(shape(rows[0]));
    },

    findByIdAndUpdate: async (id, data) => {
        const { additionalImages, metaKeywords, attributes, variants, ...flat } = data;

        if (Object.keys(flat).length > 0) {
            const fields = Object.keys(flat);
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const values = fields.map(f => flat[f]);
            await pool.query(`UPDATE products SET ${setClause} WHERE id = ?`, [...values, id]);
        }

        if (additionalImages !== undefined || metaKeywords !== undefined || attributes !== undefined) {
            await deleteChildren(id);
            await insertChildren(id, additionalImages ?? [], metaKeywords ?? [], attributes ?? []);
        }

        // ── NEW: replace variants when provided ────────────────────────────
        if (variants !== undefined) {
            await deleteVariants(id);
            await insertVariants(id, variants);
        }

        const [rows] = await pool.query(`${BASE_SELECT} WHERE p.id = ?`, [id]);
        return attachChildren(shape(rows[0]));
    },

    findByIdAndDelete: async (id) => {
        const [rows] = await pool.query(`SELECT * FROM products WHERE id = ?`, [id]);
        if (!rows[0]) return null;
        await pool.query(`DELETE FROM products WHERE id = ?`, [id]);
        return rows[0];
    }
};

module.exports = Product;