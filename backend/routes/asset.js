const express = require("express");
const multer = require("multer");
const path = require("path");

// Import authentication middleware
const { verifyToken } = require("../controllers/authController.js");

// These are the functions that ACTUALLY exist and are exported from assetController.js
const {
  getAssets,
  updateAssetById,
  deleteAssetById,
  getAssetReport,
  getDepartments,
  getLocations,
  getUsers,
  createAssetController,
  searchAssetsController,
  getAssetByBarcode,
  patchAssetStatus,
  getAssetStats,
  getDashboardGraphs,
  getPendingAssetAudits,
  confirmAssetAudits,
  getAssetAuditHistory,
  getAssetAuditList,
  getAllAssetAudits, // <-- เพิ่มตรงนี้
  getAssetTransferLogs,
} = require("../controllers/assetController.js");

const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/")),
  filename: (req, file, cb) =>
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    ),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// --- All routes are verified to have a valid function handler ---

// Dropdown and utility routes (these don't need authentication)
router.get("/departments", getDepartments);
router.get("/locations", getLocations);
router.get("/users", getUsers);

// Barcode routes (must be before other routes to avoid conflicts)
router.get("/barcode/:barcode", verifyToken, getAssetByBarcode);
router.patch("/barcode/:barcode/status", verifyToken, patchAssetStatus);

// Core asset routes (these need authentication)
router.get("/", verifyToken, getAssets);
router.post("/", verifyToken, createAssetController);
router.get("/search", verifyToken, searchAssetsController);
router.get("/stats", verifyToken, getAssetStats);
// router.get('/report', verifyToken, getAssetReport); // Temporarily removed to fix crash

// Image upload (needs authentication)
router.post(
  "/upload-image",
  verifyToken,
  upload.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please upload a file." });
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json({ message: "Invalid file type. Only images are allowed." });
      }

      const imageUrl = `http://localhost:4000/uploads/${req.file.filename}`;
      console.log("Image uploaded successfully:", req.file.filename);
      res.status(200).json({ imageUrl });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image." });
    }
  }
);

// --- Audit routes ---
router.get("/audits/list", verifyToken, getAssetAuditList);
router.post("/audits/confirm", verifyToken, confirmAssetAudits);
router.get("/asset-audits/:assetId", verifyToken, getAssetAuditHistory);
router.get("/audits/all", verifyToken, getAllAssetAudits);

// Parameterized routes (must be last to avoid conflicts) - these need authentication
router.put("/:id", verifyToken, updateAssetById);
router.delete("/:id", verifyToken, deleteAssetById);
router.get("/dashboard-graphs", verifyToken, getDashboardGraphs);
router.get('/:id/transfer-logs', verifyToken, getAssetTransferLogs);

module.exports = router;
