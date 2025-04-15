const {
  loginUser,
  register,
  getOneUserData,
  getAllUserData,
  getTeamMembersData,
  updateUserData,
  deleteUserData,
  createProductData,
  updateProductData,
  deleteProductData,
  getAllProductsData,
  createOrderData,
  getOrdersData,
  updateOrderData,
  setupAdmin,
} = require("../controller/controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authorize, restrictTo } = require("../middleware/authorization");

const router = require("express").Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "Uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${Date.now()}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and GIF images are allowed"));
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Authentication
router.post("/login", loginUser);
router.post("/register", authorize, restrictTo(["Admin"]), register);
router.post("/setup-admin", setupAdmin);

// User Management
router.get(
  "/users/me",
  authorize,
  restrictTo(["Admin", "Manager", "Employee"]),
  getOneUserData
);
router.get("/users", authorize, restrictTo(["Admin"]), getAllUserData);
router.put("/users", authorize, restrictTo(["Admin"]), updateUserData);
router.delete("/users", authorize, restrictTo(["Admin"]), deleteUserData);

// Team Management
router.get("/team", authorize, restrictTo(["Manager"]), getTeamMembersData);

// Product Management
router.post(
  "/products",
  authorize,
  restrictTo(["Admin", "Manager"]),
  upload.single("file"),
  createProductData
);
router.put(
  "/products",
  authorize,
  restrictTo(["Admin", "Manager"]),
  upload.single("file"),
  updateProductData
);
router.delete(
  "/products",
  authorize,
  restrictTo(["Admin", "Manager"]),
  deleteProductData
);
router.get(
  "/products",
  authorize,
  restrictTo(["Admin", "Manager", "Employee"]),
  getAllProductsData
);

// Order Management
router.post("/orders", authorize, restrictTo(["Employee"]), createOrderData);
router.get(
  "/orders",
  authorize,
  restrictTo(["Manager", "Employee"]),
  getOrdersData
);
router.put("/orders", authorize, restrictTo(["Manager"]), updateOrderData);

module.exports = router;
