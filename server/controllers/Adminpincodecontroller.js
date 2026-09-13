// adminPincodeController.js
// CRUD + Bulk Import + Toggle for serviceable_pincodes table

const { pool } = require('../config/db');

// ─── Helper: validate pincode string ─────────────────────────────────────────
const isValidPincode = (p) => /^\d{4,10}$/.test(String(p).trim());

// ─── GET /api/admin/pincodes ──────────────────────────────────────────────────
// Query params: page, limit, search, isActive
const listPincodes = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page)  || 1);
        const limit  = Math.min(100, parseInt(req.query.limit) || 20);
        const offset = (page - 1) * limit;
        const search = req.query.search?.trim() || "";

        // isActive: "true" | "false" | undefined
        const filterActive = req.query.isActive;

        const conditions = [];
        const vals       = [];

        if (search) {
            conditions.push(`(pincode LIKE ? OR city LIKE ? OR state LIKE ?)`);
            const like = `%${search}%`;
            vals.push(like, like, like);
        }

        if (filterActive === "true" || filterActive === "false") {
            conditions.push(`isActive = ?`);
            vals.push(filterActive === "true");
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM serviceable_pincodes ${where}`,
            vals
        );

        const [pincodes] = await pool.query(
            `SELECT id, pincode, city, state, isActive, createdAt
             FROM serviceable_pincodes
             ${where}
             ORDER BY createdAt DESC
             LIMIT ? OFFSET ?`,
            [...vals, limit, offset]
        );

        return res.json({ success: true, pincodes, total: Number(total), page, limit });
    } catch (err) {
        console.error("[listPincodes]", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── POST /api/admin/pincodes ─────────────────────────────────────────────────
const addPincode = async (req, res) => {
    try {
        const { pincode, city = "", state = "", isActive = true } = req.body;

        if (!pincode || !isValidPincode(pincode)) {
            return res.status(400).json({ success: false, message: "Invalid pincode (4–10 digits)" });
        }

        // Check duplicate
        const [[exists]] = await pool.query(
            `SELECT id FROM serviceable_pincodes WHERE pincode = ? LIMIT 1`,
            [pincode.trim()]
        );
        if (exists) {
            return res.status(409).json({ success: false, message: `Pincode ${pincode} already exists` });
        }

        const [result] = await pool.query(
            `INSERT INTO serviceable_pincodes (pincode, city, state, isActive)
             VALUES (?, ?, ?, ?)`,
            [pincode.trim(), city.trim(), state.trim(), Boolean(isActive)]
        );

        const [[row]] = await pool.query(
            `SELECT * FROM serviceable_pincodes WHERE id = ?`,
            [result.insertId]
        );

        return res.status(201).json({ success: true, message: "Pincode added", pincode: row });
    } catch (err) {
        console.error("[addPincode]", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── PUT /api/admin/pincodes/:id ──────────────────────────────────────────────
// Only city, state, isActive are editable — pincode itself is immutable
const updatePincode = async (req, res) => {
    try {
        const { id } = req.params;
        const { city, state, isActive } = req.body;

        const [[row]] = await pool.query(
            `SELECT id FROM serviceable_pincodes WHERE id = ? LIMIT 1`,
            [id]
        );
        if (!row) {
            return res.status(404).json({ success: false, message: "Pincode not found" });
        }

        await pool.query(
            `UPDATE serviceable_pincodes
             SET city = ?, state = ?, isActive = ?
             WHERE id = ?`,
            [city?.trim() ?? "", state?.trim() ?? "", Boolean(isActive), id]
        );

        const [[updated]] = await pool.query(
            `SELECT * FROM serviceable_pincodes WHERE id = ?`,
            [id]
        );

        return res.json({ success: true, message: "Pincode updated", pincode: updated });
    } catch (err) {
        console.error("[updatePincode]", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── PATCH /api/admin/pincodes/:id/toggle ────────────────────────────────────
const togglePincode = async (req, res) => {
    try {
        const { id }      = req.params;
        const { isActive } = req.body;           // boolean sent from frontend

        if (typeof isActive !== "boolean") {
            return res.status(400).json({ success: false, message: "isActive (boolean) required" });
        }

        const [[row]] = await pool.query(
            `SELECT id FROM serviceable_pincodes WHERE id = ? LIMIT 1`,
            [id]
        );
        if (!row) {
            return res.status(404).json({ success: false, message: "Pincode not found" });
        }

        await pool.query(
            `UPDATE serviceable_pincodes SET isActive = ? WHERE id = ?`,
            [isActive, id]
        );

        return res.json({
            success: true,
            message: isActive ? "Pincode activated" : "Pincode deactivated",
        });
    } catch (err) {
        console.error("[togglePincode]", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── DELETE /api/admin/pincodes/:id ──────────────────────────────────────────
const deletePincode = async (req, res) => {
    try {
        const { id } = req.params;

        const [[row]] = await pool.query(
            `SELECT id, pincode FROM serviceable_pincodes WHERE id = ? LIMIT 1`,
            [id]
        );
        if (!row) {
            return res.status(404).json({ success: false, message: "Pincode not found" });
        }

        await pool.query(`DELETE FROM serviceable_pincodes WHERE id = ?`, [id]);

        return res.json({ success: true, message: `Pincode ${row.pincode} deleted` });
    } catch (err) {
        console.error("[deletePincode]", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── POST /api/admin/pincodes/bulk ───────────────────────────────────────────
// Body: { pincodes: [{ pincode, city, state, isActive? }] }
// Skips duplicates silently via INSERT IGNORE
const bulkImportPincodes = async (req, res) => {
    try {
        const { pincodes } = req.body;

        if (!Array.isArray(pincodes) || pincodes.length === 0) {
            return res.status(400).json({ success: false, message: "pincodes array required" });
        }

        // Validate each row
        const invalid = pincodes.filter(p => !isValidPincode(p.pincode));
        if (invalid.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid pincodes: ${invalid.map(p => p.pincode).join(", ")}`,
            });
        }

        // Build multi-row INSERT IGNORE
        const values      = pincodes.map(p => [
            String(p.pincode).trim(),
            String(p.city  ?? "").trim(),
            String(p.state ?? "").trim(),
            p.isActive !== false,               // default true
        ]);

        const [result] = await pool.query(
            `INSERT IGNORE INTO serviceable_pincodes (pincode, city, state, isActive)
             VALUES ?`,
            [values]
        );

        return res.json({
            success : true,
            message : `${result.affectedRows} pincodes imported (duplicates skipped)`,
            imported: result.affectedRows,
            skipped : pincodes.length - result.affectedRows,
        });
    } catch (err) {
        console.error("[bulkImportPincodes]", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    listPincodes,
    addPincode,
    updatePincode,
    togglePincode,
    deletePincode,
    bulkImportPincodes,
};