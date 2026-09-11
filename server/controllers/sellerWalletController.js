const SellerWalletModel = require("../models/SellerWallet");
 
/**
 * GET /api/seller/wallet
 * Returns wallet balance + paginated transactions for the logged-in seller.
 */
const getSellerWallet = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const page     = Number(req.query.page)  || 1;
    const limit    = Number(req.query.limit) || 20;
 
    // Ensure wallet row exists (idempotent)
    await SellerWalletModel.ensureWallet(sellerId);
 
    const [wallet, { transactions, total }] = await Promise.all([
      SellerWalletModel.getWallet(sellerId),
      SellerWalletModel.getTransactions(sellerId, { page, limit }),
    ]);
 
    return res.json({
      success: true,
      wallet: {
        balance:          Number(wallet?.balance          || 0),
        total_earned:     Number(wallet?.total_earned     || 0),
        total_commission: Number(wallet?.total_commission || 0),
      },
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
      commissionPercent: Number(process.env.SELLER_COMMISSION_PERCENT || 10),
    });
  } catch (err) {
    console.error("[GET /api/seller/wallet]", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch wallet." });
  }
};
 
module.exports = { getSellerWallet };