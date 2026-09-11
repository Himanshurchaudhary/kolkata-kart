// controllers/adminSellerController.js

const { pool } = require("../config/db");

// ══════════════════════════════════════════════════════════════════
// 1. GET ALL SELLERS
// GET /api/admin/sellers
// Query: ?status=pending|verified|blocked (optional)
// ══════════════════════════════════════════════════════════════════
const getAllSellers = async (req, res) => {
  try {
    const { status } = req.query;

    let whereClause = "";
    if (status === "pending")  whereClause = "WHERE is_approved = 0 AND is_active = 1";
    if (status === "verified") whereClause = "WHERE is_approved = 1 AND is_active = 1";
    if (status === "blocked")  whereClause = "WHERE is_active = 0";

    const [rows] = await pool.execute(`
      SELECT
        id, full_name, email, mobile, dob,
        shop_name, shop_category,
        shop_street, shop_city, shop_state, shop_pincode,
        delivery_charge, shop_description,
        pan_number, aadhar_number, pan_card_url,
        upi_id, upi_mobile,
        same_as_shop,
        pickup_street, pickup_city, pickup_state, pickup_pincode,
        working_hours_from, working_hours_to,
        terms_accepted, commission_accepted,
        is_approved, is_active,
        created_at, updated_at
      FROM sellers
      ${whereClause}
      ORDER BY created_at DESC
    `);

    res.json({ sellers: rows, total: rows.length });
  } catch (err) {
    console.error("getAllSellers error:", err);
    res.status(500).json({ message: "Failed to fetch sellers" });
  }
};

// ══════════════════════════════════════════════════════════════════
// 2. GET SINGLE SELLER
// GET /api/admin/sellers/:id
// ══════════════════════════════════════════════════════════════════
const getSellerById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        id, full_name, email, mobile, dob,
        shop_name, shop_category,
        shop_street, shop_city, shop_state, shop_pincode,
        delivery_charge, shop_description,
        pan_number, aadhar_number, pan_card_url,
        upi_id, upi_mobile,
        same_as_shop,
        pickup_street, pickup_city, pickup_state, pickup_pincode,
        working_hours_from, working_hours_to,
        is_approved, is_active,
        created_at, updated_at
       FROM sellers WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Seller not found" });

    res.json({ seller: rows[0] });
  } catch (err) {
    console.error("getSellerById error:", err);
    res.status(500).json({ message: "Failed to fetch seller" });
  }
};

// ══════════════════════════════════════════════════════════════════
// 3. UPDATE SELLER STATUS (Approve / Block / Unblock)
// PATCH /api/admin/sellers/:id
// Body: { is_approved?: 0|1, is_active?: 0|1 }
//
//   Approve  → { is_approved: 1, is_active: 1 }
//   Block    → { is_active: 0 }
//   Unblock  → { is_active: 1 }
// ══════════════════════════════════════════════════════════════════
const updateSellerStatus = async (req, res) => {
  const { id } = req.params;
  const { is_approved, is_active } = req.body;

  const updates = [];
  const values  = [];

  if (is_approved !== undefined) {
    updates.push("is_approved = ?");
    values.push(is_approved ? 1 : 0);
  }
  if (is_active !== undefined) {
    updates.push("is_active = ?");
    values.push(is_active ? 1 : 0);
  }

  if (!updates.length)
    return res.status(400).json({ message: "No fields provided to update" });

  values.push(id);

  try {
    const [result] = await pool.execute(
      `UPDATE sellers SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    if (!result.affectedRows)
      return res.status(404).json({ message: "Seller not found" });

    const [rows] = await pool.execute(
      "SELECT id, full_name, email, shop_name, is_approved, is_active FROM sellers WHERE id = ?",
      [id]
    );

    res.json({ message: "Seller updated successfully", seller: rows[0] });
  } catch (err) {
    console.error("updateSellerStatus error:", err);
    res.status(500).json({ message: "Failed to update seller" });
  }
};

module.exports = { getAllSellers, getSellerById, updateSellerStatus };