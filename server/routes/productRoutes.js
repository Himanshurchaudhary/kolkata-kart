const express = require('express');
const router = express.Router();
const multer = require('multer');
const memStorage = multer({ storage: multer.memoryStorage() });

const {
  addProduct, getAllProducts, getProductById,
  updateProduct, deleteProduct, bulkImportProducts,
} = require('../controllers/Product_management/productController');

const { compressAndUpload, compressAndUploadFields } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');
const { addBrand, getBrands, updateBrand, deleteBrand } = require('../controllers/Product_management/brandController');

// ─── Product routes ───────────────────────────────────────────

router.post(
  '/add', protect,
  ...compressAndUploadFields(
    [{ name: 'thumbnail', maxCount: 1 }, { name: 'additionalImages', maxCount: 5 }],
    'ReadyGrocery/Products'
  ),
  addProduct
);

router.get('/allFree', getAllProducts);
router.get('/all', protect, getAllProducts);
router.get('/:id', protect, getProductById);

router.put(
  '/update/:id', protect,
  ...compressAndUploadFields(
    [{ name: 'thumbnail', maxCount: 1 }, { name: 'additionalImages', maxCount: 5 }],
    'ReadyGrocery/Products'
  ),
  updateProduct
);

router.delete('/delete/:id', protect, deleteProduct);

// ─── Brand routes ─────────────────────────────────────────────

router.post('/brand/add', protect, ...compressAndUpload('logo', 'ReadyGrocery/Brands'), addBrand);
router.get('/brand/all', getBrands);
router.put('/brand/update/:id', protect, ...compressAndUpload('logo', 'ReadyGrocery/Brands'), updateBrand);
router.delete('/brand/delete/:id', protect, deleteBrand);

// ─── Bulk import (Excel — no image) ──────────────────────────

router.post(
  '/bulk-import', protect,
  memStorage.fields([{ name: 'excelFile', maxCount: 1 }]),
  bulkImportProducts
);

module.exports = router;