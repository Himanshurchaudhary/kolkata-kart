const SellerWalletUtil = require("../models/SellerWallet");
const { pool: dbPool } = require("../config/db");
 
/**
 * Credit the seller's wallet when an order is delivered/completed.
 *
 * @param {number} orderId
 * @param {string} newStatus  — the status being set
 */
const creditSellerWalletForOrder = async (orderId, newStatus) => {
  if (!["Delivered", "Completed"].includes(newStatus)) return;
 
  try {
    const commissionPct = Number(process.env.SELLER_COMMISSION_PERCENT || 10);
 
    // Find the seller linked to this order via order_items → products → sellers
    const [sellerRows] = await dbPool.execute(
      `SELECT p.seller_id, o.total, o.orderNumber, o.id AS oid
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products    p  ON p.id = oi.product_id
       WHERE o.id = ? AND p.seller_id IS NOT NULL
       LIMIT 1`,
      [orderId]
    );
 
    if (!sellerRows.length || !sellerRows[0].seller_id) return; // direct sale, no seller
 
    const { seller_id, total, orderNumber, oid } = sellerRows[0];
 
    const result = await SellerWalletUtil.creditOrder({
      sellerId:     seller_id,
      orderId:      oid,
      orderNumber,
      orderTotal:   Number(total),
      commissionPct,
    });
 
    if (result.alreadyCredited) {
      console.log(`[Wallet] Order ${orderNumber} already credited — skipped`);
    } else {
      console.log(
        `[Wallet] Order ${orderNumber} → ₹${result.creditedAmt} credited to seller ${seller_id}` +
        ` (commission ₹${result.commissionAmt} @ ${commissionPct}%)`
      );
    }
  } catch (err) {
    // Non-blocking — log but don't crash the status update
    console.error("[creditSellerWalletForOrder]", err.message);
  }
};
 
module.exports = { creditSellerWalletForOrder };