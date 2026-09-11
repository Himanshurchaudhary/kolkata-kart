const FlashSale = require('../models/FlashSale');
const Product   = require('../models/product_Management/Product');

// @desc Create New Flash Sale
exports.addFlashSale = async (req, res) => {
    try {
        const { name, minDiscount, startDate, startTime, endDate, endTime, description } = req.body;

        const desktopFile = req.files?.desktopMedia?.[0];
        const mobileFile   = req.files?.mobileMedia?.[0];

        if (!desktopFile) {
            return res.status(400).json({ success: false, message: "Desktop banner (image or video) is required" });
        }
        if (!mobileFile) {
            return res.status(400).json({ success: false, message: "Mobile banner (image or video) is required" });
        }

        const flashSale = await FlashSale.create({
            name,
            minDiscount,
            startDate,
            startTime,
            endDate,
            endTime,
            description,
            desktopMedia: desktopFile.path,
            desktopMediaType: desktopFile.mediaType,   // 'image' | 'video' — set by compressAndUploadFields middleware
            mobileMedia: mobileFile.path,
            mobileMediaType: mobileFile.mediaType,
        });

        res.status(201).json({ success: true, message: "Flash Sale Created!", flashSale });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Get All Flash Sales
exports.getFlashSales = async (req, res) => {
    try {
        const sales = await FlashSale.find();   // sorted by startDate ASC in model
        res.status(200).json({ success: true, sales });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Get Single Flash Sale (with products)
exports.getFlashSaleById = async (req, res) => {
    try {
        const sale = await FlashSale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });
        res.status(200).json({ success: true, sale });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Update Flash Sale
exports.updateFlashSale = async (req, res) => {
    try {
        const updateData = { ...req.body };

        const desktopFile = req.files?.desktopMedia?.[0];
        const mobileFile   = req.files?.mobileMedia?.[0];

        // sirf jo file naye se upload hui usi ko update karo, baaki jaisa tha waisa rahe
        if (desktopFile) {
            updateData.desktopMedia = desktopFile.path;
            updateData.desktopMediaType = desktopFile.mediaType;
        }
        if (mobileFile) {
            updateData.mobileMedia = mobileFile.path;
            updateData.mobileMediaType = mobileFile.mediaType;
        }

        const sale = await FlashSale.findByIdAndUpdate(req.params.id, updateData);
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });
        res.status(200).json({ success: true, message: "Flash Sale Updated!", sale });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Toggle Flash Sale Active Status
exports.toggleFlashSaleStatus = async (req, res) => {
    try {
        const sale = await FlashSale.toggleStatus(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });
        res.status(200).json({
            success: true,
            message: `Flash Sale ${sale.isActive ? 'Activated' : 'Deactivated'}`,
            sale
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Delete Flash Sale
exports.deleteFlashSale = async (req, res) => {
    try {
        const sale = await FlashSale.findByIdAndDelete(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });
        res.status(200).json({ success: true, message: "Flash Sale Deleted!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Add Product to Flash Sale
exports.addProductToFlashSale = async (req, res) => {
    try {
        const { productId } = req.body;

        const sale = await FlashSale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });

        const alreadyIn = await FlashSale.hasProduct(req.params.id, productId);
        if (alreadyIn) {
            return res.status(400).json({ success: false, message: "Product already in this Flash Sale" });
        }

        const updated = await FlashSale.addProduct(req.params.id, productId);
        res.status(200).json({ success: true, message: "Product added to Flash Sale!", sale: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Update a product's price/quantity within a Flash Sale
exports.updateProductInFlashSale = async (req, res) => {
    try {
        const { price, quantity } = req.body;

        const product = await Product.findByIdAndUpdate(
            req.params.productId,
            { sellingPrice: price, stockQuantity: quantity }
        );
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({ success: true, message: "Product updated!", product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Remove Product from Flash Sale
exports.removeProductFromFlashSale = async (req, res) => {
    try {
        const sale = await FlashSale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });

        const updated = await FlashSale.removeProduct(req.params.id, req.params.productId);
        res.status(200).json({ success: true, message: "Product removed from Flash Sale!", sale: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};