const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
const authorize = (req, res, next) => {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];
    console.log(token, "token");
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    jwt.verify(token, "qwertyuiopasdfghjklzxcvbnm", (err, decoded) => {
      if (err) {
        console.log("JWT error:", err);
        return res
          .status(401)
          .json({ success: false, message: "Token invalid" });
      }

      console.log("Token decoded:", decoded);
      req.decoded = decoded;
      next();
    });
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Middleware to restrict access by role
const restrictTo = (roles) => {
  return (req, res, next) => {
    if (!req.decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const userRole = req.decoded.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Insufficient permissions",
      });
    }

    console.log(`User role ${userRole} authorized for roles:`, roles);
    next();
  };
};

module.exports = { authorize, restrictTo };
