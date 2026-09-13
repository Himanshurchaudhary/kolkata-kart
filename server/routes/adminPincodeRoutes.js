// adminPincodeRoutes.js
// Mount at: /api/admin/pincodes

const express = require("express");
const router  = express.Router();

const {
    listPincodes,
    addPincode,
    updatePincode,
    togglePincode,
    deletePincode,
    bulkImportPincodes,
} = require("../controllers/Adminpincodecontroller");
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes protected by admin auth
router.use(verifyAdminToken);

// ── /api/admin/pincodes ───────────────────────────────────────────────────────
router.get   ("/",     protect,   listPincodes);        // GET    list with search + filter + pagination
router.post  ("/",     protect,   addPincode);           // POST   add single pincode
router.post  ("/bulk",  protect,  bulkImportPincodes);   // POST   bulk import (before :id routes)

// ── /api/admin/pincodes/:id ───────────────────────────────────────────────────
router.put   ("/:id",      protect,   updatePincode);   // PUT    update city/state/isActive
router.patch ("/:id/toggle", protect, togglePincode);   // PATCH  activate / deactivate
router.delete("/:id",     protect,    deletePincode);   // DELETE remove pincode

module.exports = router;