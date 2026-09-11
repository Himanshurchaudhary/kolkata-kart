const { pool } = require("../config/db");
 
// ── Create tables ─────────────────────────────────────────────────────────
const createWalletTables = async () => {
 
  // seller_wallets — one row per seller
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seller_wallets (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      seller_id     INT           NOT NULL UNIQUE,
      balance       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_earned  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_commission DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
 
  // seller_wallet_transactions — one row per order credit
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seller_wallet_transactions (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      seller_id       INT           NOT NULL,
      order_id        INT           NOT NULL,
      order_number    VARCHAR(100)  NOT NULL,
      order_total     DECIMAL(10,2) NOT NULL,
      commission_pct  DECIMAL(5,2)  NOT NULL,
      commission_amt  DECIMAL(10,2) NOT NULL,
      credited_amt    DECIMAL(10,2) NOT NULL,
      type            ENUM('credit','debit') NOT NULL DEFAULT 'credit',
      note            VARCHAR(255)  DEFAULT '',
      created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id)  REFERENCES orders(id)  ON DELETE CASCADE,
      UNIQUE KEY uq_order_seller (order_id, seller_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
 
  console.log("seller_wallets + seller_wallet_transactions tables ready");
};
 
createWalletTables();
 
// ── Model ─────────────────────────────────────────────────────────────────
const SellerWallet = {
 
  // Ensure wallet row exists for seller (call once after seller is created)
  ensureWallet: async (sellerId) => {
    await pool.execute(
      `INSERT IGNORE INTO seller_wallets (seller_id) VALUES (?)`,
      [sellerId]
    );
  },
 
  // Get wallet for a seller
  getWallet: async (sellerId) => {
    const [rows] = await pool.execute(
      `SELECT * FROM seller_wallets WHERE seller_id = ?`,
      [sellerId]
    );
    return rows[0] || null;
  },
 
  // Credit wallet after order delivery
  // Returns { alreadyCredited: true } if this order was already credited
  creditOrder: async ({ sellerId, orderId, orderNumber, orderTotal, commissionPct }) => {
 
    // Check duplicate
    const [existing] = await pool.execute(
      `SELECT id FROM seller_wallet_transactions
       WHERE order_id = ? AND seller_id = ? AND type = 'credit'`,
      [orderId, sellerId]
    );
    if (existing.length > 0) return { alreadyCredited: true };
 
    const commissionAmt = parseFloat(((orderTotal * commissionPct) / 100).toFixed(2));
    const creditedAmt   = parseFloat((orderTotal - commissionAmt).toFixed(2));
 
    // Ensure wallet exists
    await SellerWallet.ensureWallet(sellerId);
 
    // Insert transaction
    await pool.execute(
      `INSERT INTO seller_wallet_transactions
        (seller_id, order_id, order_number, order_total, commission_pct, commission_amt, credited_amt, type, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'credit', ?)`,
      [
        sellerId, orderId, orderNumber, orderTotal,
        commissionPct, commissionAmt, creditedAmt,
        `Order ${orderNumber} delivered — ${commissionPct}% commission deducted`,
      ]
    );
 
    // Update wallet balance
    await pool.execute(
      `UPDATE seller_wallets
       SET balance          = balance + ?,
           total_earned     = total_earned + ?,
           total_commission = total_commission + ?
       WHERE seller_id = ?`,
      [creditedAmt, orderTotal, commissionAmt, sellerId]
    );
 
    return { alreadyCredited: false, commissionAmt, creditedAmt };
  },
 
  // Get paginated transactions for a seller
  getTransactions: async (sellerId, { page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;
 
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM seller_wallet_transactions WHERE seller_id = ?`,
      [sellerId]
    );
 
    const [rows] = await pool.execute(
      `SELECT * FROM seller_wallet_transactions
       WHERE seller_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [sellerId, Number(limit), Number(offset)]
    );
 
    return { transactions: rows, total: Number(total) };
  },
};
 
module.exports = SellerWallet;