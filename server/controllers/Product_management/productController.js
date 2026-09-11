const Product = require('../../models/product_Management/Product');
const XLSX = require('xlsx');
const { pool } = require('../../config/db');

// ── Shared helper: safely parse variants from FormData ────────────────────
// Frontend sends variants as JSON string: '[{ label, sku, buyingPrice, ... }]'
const parseVariants = (raw) => {
    try {
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
};

exports.addProduct = async (req, res) => {
    try {
        const thumbnail = req.files?.['thumbnail']?.[0]?.path ?? null;
        const additionalImages = req.files?.['additionalImages']?.map(f => f.path) ?? [];

        if (!thumbnail) {
            return res.status(400).json({ success: false, message: "Main Thumbnail is required" });
        }

        const {
            name, category, sku, buyingPrice, sellingPrice,
            stockQuantity, metaKeywords, attributes, brand, variants: rawVariants, ...rest
        } = req.body;

        const variants = parseVariants(rawVariants);

        const product = await Product.create({
            ...rest,
            name,
            sku,
            category_id: Number(category),
            brand_id: brand ? Number(brand) : null,
            buyingPrice: Number(buyingPrice),
            sellingPrice: Number(sellingPrice),
            stockQuantity: Number(stockQuantity),
            thumbnail,
            additionalImages,
            metaKeywords: metaKeywords ? JSON.parse(metaKeywords) : [],
            attributes: (() => {
                try { return attributes ? JSON.parse(attributes) : []; }
                catch { return []; }
            })(),
            variants,                       // ← NEW
            createdBy: req.user.id,
        });

        res.status(201).json({ success: true, message: "Product Added successfully!", product });

    } catch (error) {
        console.error("Add Product Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.getAllProducts = async (req, res) => {
  try {
    const page       = parseInt(req.query.page)  || 1;
    const limit      = parseInt(req.query.limit) || 10;
    const search     = req.query.search     || "";
    const categoryId = req.query.category   || "";
    const showAll    = req.query.showAll    === "true"; // admin uses this

    const filters = {};
    if (search)     filters.search      = search;
    if (categoryId) filters.category_id = Number(categoryId);

    // Public/user routes only see approved products
    // Admin passes ?showAll=true to see everything
    if (!showAll) filters.status = "approved";

    const products      = await Product.find(filters, { limit, skip: (page - 1) * limit });
    const totalProducts = await Product.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error.message);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, product });

    } catch (error) {
        console.error("Get Product Error:", error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const existing = await Product.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const newThumbnail = req.files?.['thumbnail']?.[0]?.path ?? null;
        const newAdditionalImages = req.files?.['additionalImages']?.map(f => f.path) ?? null;

        const {
            name, category, sku, buyingPrice, sellingPrice,
            stockQuantity, metaKeywords, attributes, brand,
            variants: rawVariants, ...rest
        } = req.body;

        const updateData = { ...rest };

        if (name !== undefined) updateData.name = name;
        if (sku !== undefined) updateData.sku = sku;
        if (category !== undefined) updateData.category_id = Number(category);
        if (brand !== undefined) updateData.brand_id = Number(brand);
        if (buyingPrice !== undefined) updateData.buyingPrice = Number(buyingPrice);
        if (sellingPrice !== undefined) updateData.sellingPrice = Number(sellingPrice);
        if (stockQuantity !== undefined) updateData.stockQuantity = Number(stockQuantity);
        if (newThumbnail) updateData.thumbnail = newThumbnail;

        if (newAdditionalImages) updateData.additionalImages = newAdditionalImages;
        if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords ? JSON.parse(metaKeywords) : [];
        if (attributes !== undefined) updateData.attributes = (() => {
            try { return attributes ? JSON.parse(attributes) : []; }
            catch { return []; }
        })();

        // ── NEW: include variants if sent ────────────────────────────────
        if (rawVariants !== undefined) {
            updateData.variants = parseVariants(rawVariants);
        }

        const product = await Product.findByIdAndUpdate(req.params.id, updateData);

        res.status(200).json({ success: true, message: "Product updated successfully!", product });

    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, message: "Product deleted successfully!" });

    } catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};



exports.bulkImportProducts = async (req, res) => {
    try {
        const file = req.files?.['excelFile']?.[0];
        if (!file) return res.status(400).json({ success: false, message: "Excel file required" });

        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Row 0 = merged title row, Row 1 = actual headers, Row 2+ = data
        const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = allRows[1];
        const dataRows = allRows.slice(2).map(row => {
            const obj = {};
            headers.forEach((h, i) => { if (h) obj[String(h).trim()] = row[i] ?? ''; });
            return obj;
        });
        const rows = dataRows.filter(r => Object.values(r).some(v => String(v).trim() !== ''));

        if (!rows.length) return res.status(400).json({ success: false, message: "Excel file is empty or has no data rows" });

        // Category & Brand lookup maps
        const [catRows] = await pool.query(`SELECT id, name FROM categories`);
        const [brandRows] = await pool.query(`SELECT id, name FROM brands`);
        const categoryMap = {};
        catRows.forEach(c => { categoryMap[c.name.trim().toLowerCase()] = c.id; });
        const brandMap = {};
        brandRows.forEach(b => { brandMap[b.name.trim().toLowerCase()] = b.id; });

        // Group rows: name filled = new product, name empty + v_label filled = variant row
        const productGroups = [];
        let currentGroup = null;

        for (const row of rows) {
            const hasName = row['Product Name *'] && String(row['Product Name *']).trim() !== '';
            const hasVariant = row['v_label *'] && String(row['v_label *']).trim() !== '';

            if (hasName) {
                currentGroup = { mainRow: row, variantRows: [] };
                if (hasVariant) currentGroup.variantRows.push(row);
                productGroups.push(currentGroup);
            } else if (hasVariant && currentGroup) {
                currentGroup.variantRows.push(row);
            }
        }

        const results = { success: [], failed: [] };

        for (const { mainRow: row, variantRows } of productGroups) {
            const excelRowNum = rows.indexOf(row) + 3; // +2 header rows +1 for 1-index

            try {
                // Resolve category
                let categoryId = null;
                if (row['Category Name *']) {
                    categoryId = categoryMap[String(row['Category Name *']).trim().toLowerCase()] || null;
                }

                if (!row['Product Name *'] || !row['SKU *'] || !row['New Price *'] || !categoryId) {
                    results.failed.push({
                        row: excelRowNum,
                        name: row['Product Name *'] || '(no name)',
                        reason: !categoryId
                            ? `Category "${row['Category Name *'] || ''}" not found in DB`
                            : "Missing required fields: Product Name, SKU, or New Price"
                    });
                    continue;
                }

                // Resolve brand (optional)
                let brandId = null;
                if (row['Brand Name']) {
                    brandId = brandMap[String(row['Brand Name']).trim().toLowerCase()] || null;
                }

                // Build variants
                const variants = variantRows
                    .filter(vr => vr['v_label *'] && String(vr['v_label *']).trim() !== '')
                    .map((vr, idx) => ({
                        label: String(vr['v_label *'] || '').trim(),
                        sku: String(vr['v_sku *'] || `${row['SKU *']}-V${idx + 1}`).trim(),
                        buyingPrice: Number(vr['v_buyingPrice'] || 0),
                        sellingPrice: Number(vr['v_sellingPrice *'] || 0),
                        discountPrice: Number(vr['v_discountPrice'] || 0),
                        stockQuantity: Number(vr['v_stock'] || 0),
                        minOrderQuantity: Number(vr['v_minQty'] || 1),
                        isDefault: idx === 0
                            ? true
                            : String(vr['v_isDefault']).toLowerCase() === 'yes',
                    }));

                await Product.create({
                    name: String(row['Product Name *'] || ''),
                    sku: String(row['SKU *'] || ''),
                    slug: String(row['Product Name *'] || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    shortDescription: String(row['Short Description'] || ''),
                    description: String(row['Short Description'] || ''),
                    category_id: categoryId,
                    brand_id: brandId,
                    buyingPrice: Number(row['Old Price (MRP)'] || 0),
                    sellingPrice: Number(row['New Price *'] || 0),
                    discountPrice: Number(row['Discount Price'] || 0),
                    stockQuantity: Number(row['Stock Qty'] || 0),
                    minOrderQuantity: Number(row['Min Order Qty'] || 1),
                    unit: String(row['Unit'] || 'PCS'),
                    thumbnail: row['Thumbnail URL'] || null,
                    additionalImages: [],
                    metaKeywords: [],
                    attributes: [],
                    variants,
                    createdBy: req.user.id,
                });

                results.success.push({ row: excelRowNum, name: row['Product Name *'], variantsAdded: variants.length });

            } catch (err) {
                results.failed.push({ row: excelRowNum, name: row['Product Name *'] || '(no name)', reason: err.message });
            }
        }

        res.json({
            success: results.success.length > 0,
            message: `${results.success.length} imported, ${results.failed.length} failed`,
            imported: results.success.length,
            failed: results.failed.length,
            errors: results.failed,
            details: results.success,
        });

    } catch (err) {
        console.error("Bulk import error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};