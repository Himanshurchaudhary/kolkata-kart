const { pool } = require("../config/db");
require("dotenv").config();

// ══════════════════════════════════════════════════════════════
// 1. ADD PRODUCT  (seller)
// POST /api/seller/products/add
// ══════════════════════════════════════════════════════════════
const addSellerProduct = async (req, res) => {
  try {
    const {
      name, shortDescription, description,
      category,
      buyingPrice, sellingPrice,
      stockQuantity, minOrderQuantity,
      unit, sku,
    } = req.body;

    // ── Required field check ──────────────────────────────────
    const missing = [];
    if (!name)          missing.push("name");
    if (!category)      missing.push("category");
    if (!sellingPrice)  missing.push("sellingPrice");
    if (!stockQuantity) missing.push("stockQuantity");
    if (!unit)          missing.push("unit");
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
    }

    // ── Thumbnail required ────────────────────────────────────
    if (!req.files?.thumbnail?.[0]) {
      return res.status(400).json({ message: "Product thumbnail is required" });
    }

    // ── URLs from middleware (file.path = Cloudinary URL) ─────
    const thumbnailUrl   = req.files.thumbnail[0].path;
    const additionalUrls = req.files?.additionalImages?.length
      ? req.files.additionalImages.map(f => f.path)
      : [];

    // ── Auto SKU & slug ───────────────────────────────────────
    const finalSku = sku?.trim() || `GK-${req.sellerId}-${Date.now()}`;
    const slug     = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Date.now();

    // ── DB insert ─────────────────────────────────────────────
    const [result] = await pool.execute(
      `INSERT INTO products (
        name, slug, shortDescription, description,
        category_id, buyingPrice, sellingPrice, discountPrice,
        stockQuantity, minOrderQuantity, unit, sku,
        thumbnail, seller_id, status, createdBy
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        name.trim(),
        slug,
        shortDescription?.trim() || name.trim(),
        description?.trim()      || name.trim(),
        Number(category),
        Number(buyingPrice)      || 0,
        Number(sellingPrice),
        0,
        Number(stockQuantity),
        Number(minOrderQuantity) || 1,
        unit.trim(),
        finalSku,
        thumbnailUrl,
        req.sellerId,
        "pending",
        null,
      ]
    );

    const productId = result.insertId;

    // ── Additional images ─────────────────────────────────────
    if (additionalUrls.length) {
      const rows = additionalUrls.map(url => [productId, url]);
      await pool.query(
        "INSERT INTO product_images (product_id, imageUrl) VALUES ?",
        [rows]
      );
    }

    return res.status(201).json({
      message: "Product submitted for admin approval",
      productId,
    });

  } catch (err) {
    console.error("addSellerProduct error:", err);
    return res.status(500).json({ message: "Failed to add product. Try again." });
  }
};

// ══════════════════════════════════════════════════════════════
// 2. GET MY PRODUCTS  (seller)
// GET /api/seller/products
// ══════════════════════════════════════════════════════════════
const getMyProducts = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.name, p.thumbnail, p.sellingPrice, p.stockQuantity,
              p.status, p.createdAt,
              c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = ?
       ORDER BY p.createdAt DESC`,
      [req.sellerId]
    );
    return res.json({ products: rows });
  } catch (err) {
    console.error("getMyProducts error:", err);
    return res.status(500).json({ message: "Failed to fetch products." });
  }
};

// ══════════════════════════════════════════════════════════════
// 3. GET SELLER PRODUCT DETAIL  (seller — own product only)
// GET /api/seller/products/:id
// ══════════════════════════════════════════════════════════════
const getMyProductById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.seller_id = ?`,
      [req.params.id, req.sellerId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Product not found" });
    }
    const [images] = await pool.execute(
      "SELECT imageUrl FROM product_images WHERE product_id = ?",
      [req.params.id]
    );
    rows[0].additionalImages = images.map(r => r.imageUrl);
    return res.json({ product: rows[0] });
  } catch (err) {
    console.error("getMyProductById error:", err);
    return res.status(500).json({ message: "Failed to fetch product." });
  }
};

// ══════════════════════════════════════════════════════════════
// ADMIN CONTROLLERS
// ══════════════════════════════════════════════════════════════

// 4. GET ALL SELLER PRODUCTS  (admin)
const adminGetSellerProducts = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT p.id, p.name, p.thumbnail, p.sellingPrice, p.buyingPrice,
             p.stockQuantity, p.status, p.createdAt,
             c.name      AS category_name,
             s.full_name AS seller_name,
             s.shop_name, s.email AS seller_email
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sellers    s ON p.seller_id   = s.id
      WHERE p.seller_id IS NOT NULL
    `;
    const params = [];
    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    }
    query += " ORDER BY p.createdAt DESC";

    const [rows] = await pool.execute(query, params);
    return res.json({ products: rows });
  } catch (err) {
    console.error("adminGetSellerProducts error:", err);
    return res.status(500).json({ message: "Failed to fetch seller products." });
  }
};

// 5. APPROVE / REJECT / UPDATE STATUS  (admin)
const adminUpdateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["approved", "rejected", "pending"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const [result] = await pool.execute(
      "UPDATE products SET status = ? WHERE id = ? AND seller_id IS NOT NULL",
      [status, req.params.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ message: `Product ${status} successfully` });
  } catch (err) {
    console.error("adminUpdateProductStatus error:", err);
    return res.status(500).json({ message: "Failed to update status." });
  }
};

// 6. ADMIN GET SINGLE SELLER PRODUCT DETAIL
const adminGetSellerProductById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, c.name AS category_name,
              s.full_name AS seller_name, s.shop_name, s.email AS seller_email
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN sellers    s ON p.seller_id   = s.id
       WHERE p.id = ? AND p.seller_id IS NOT NULL`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Product not found" });
    }
    const [images] = await pool.execute(
      "SELECT imageUrl FROM product_images WHERE product_id = ?",
      [req.params.id]
    );
    rows[0].additionalImages = images.map(r => r.imageUrl);
    return res.json({ product: rows[0] });
  } catch (err) {
    console.error("adminGetSellerProductById error:", err);
    return res.status(500).json({ message: "Failed to fetch product." });
  }
};

module.exports = {
  addSellerProduct,
  getMyProducts,
  getMyProductById,
  adminGetSellerProducts,
  adminUpdateProductStatus,
  adminGetSellerProductById,
};