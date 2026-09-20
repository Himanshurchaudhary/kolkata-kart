const ComboOffer = require('../models/Combooffer');

exports.addCombo = async (req, res) => {
    try {
        const thumbnail = req.files?.['thumbnail']?.[0]?.path ?? null;

        const {
            name, description, comboPrice,
            discountLabel, status, startDate, endDate,
            stockQuantity, totalMrp,
            products: rawProducts,
        } = req.body;

        if (!name || !comboPrice) {
            return res.status(400).json({ success: false, message: "Name and Combo Price are required" });
        }

        let products = [];
        try { products = rawProducts ? JSON.parse(rawProducts) : []; } catch { products = []; }

        if (!products.length) {
            return res.status(400).json({ success: false, message: "At least one product is required in combo" });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            + '-' + Date.now();

        const combo = await ComboOffer.create({
            name,
            slug,
            description: description || '',
            thumbnail,
            comboPrice: Number(comboPrice),
            discountLabel: discountLabel || '',
            status: status || 'active',
            startDate: startDate || null,
            endDate: endDate || null,
            stockQuantity: Number(stockQuantity) || 0,
            totalMrp: Number(totalMrp) || 0,
            createdBy: req.user.id,
            products,
        });

        res.status(201).json({ success: true, message: "Combo offer created!", combo });

    } catch (error) {
        console.error("Add Combo Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.getAllCombos = async (req, res) => {
    try {
        const page      = parseInt(req.query.page)  || 1;
        const limit     = parseInt(req.query.limit) || 10;
        const search    = req.query.search || "";
        const showAll   = req.query.showAll === "true";

        const filters = {};
        if (search)   filters.search = search;
        if (!showAll) filters.status = "active";

        const combos      = await ComboOffer.find(filters, { limit, skip: (page - 1) * limit });
        const totalCombos = await ComboOffer.countDocuments(filters);

        res.status(200).json({
            success: true,
            count: combos.length,
            totalCombos,
            totalPages: Math.ceil(totalCombos / limit),
            currentPage: page,
            combos,
        });
    } catch (error) {
        console.error("Get Combos Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.getComboById = async (req, res) => {
    try {
        const combo = await ComboOffer.findById(req.params.id);
        if (!combo) return res.status(404).json({ success: false, message: "Combo not found" });
        res.status(200).json({ success: true, combo });
    } catch (error) {
        console.error("Get Combo Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.updateCombo = async (req, res) => {
    try {
        const existing = await ComboOffer.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Combo not found" });

        const newThumbnail = req.files?.['thumbnail']?.[0]?.path ?? null;

        const {
            name, description, comboPrice,
            discountLabel, status, startDate, endDate,
            stockQuantity, totalMrp,
            products: rawProducts,
        } = req.body;

        const updateData = {};
        if (name          !== undefined) updateData.name          = name;
        if (description   !== undefined) updateData.description   = description;
        if (comboPrice    !== undefined) updateData.comboPrice    = Number(comboPrice);
        if (discountLabel !== undefined) updateData.discountLabel = discountLabel;
        if (status        !== undefined) updateData.status        = status;
        if (startDate     !== undefined) updateData.startDate     = startDate || null;
        if (endDate       !== undefined) updateData.endDate       = endDate   || null;
        if (stockQuantity !== undefined) updateData.stockQuantity = Number(stockQuantity);
        if (totalMrp      !== undefined) updateData.totalMrp      = Number(totalMrp);
        if (newThumbnail)                updateData.thumbnail      = newThumbnail;
        if (name) {
            updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                + '-' + Date.now();
        }

        if (rawProducts !== undefined) {
            try { updateData.products = JSON.parse(rawProducts); } catch { updateData.products = []; }
        }

        const combo = await ComboOffer.findByIdAndUpdate(req.params.id, updateData);
        res.status(200).json({ success: true, message: "Combo updated!", combo });

    } catch (error) {
        console.error("Update Combo Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

exports.deleteCombo = async (req, res) => {
    try {
        const combo = await ComboOffer.findByIdAndDelete(req.params.id);
        if (!combo) return res.status(404).json({ success: false, message: "Combo not found" });
        res.status(200).json({ success: true, message: "Combo deleted!" });
    } catch (error) {
        console.error("Delete Combo Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};