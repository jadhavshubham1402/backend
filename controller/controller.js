const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  getOneUser,
  createUser,
  getAllUsers,
  getTeamMembers,
  updateUser,
  deleteUser,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  createOrder,
  getOrdersByEmployeeIds,
  updateOrder,
} = require("../service/service");
const User = require("../model/user");
const Product = require("../model/product");
require("dotenv").config();

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new Error("Invalid Credentials");
    }
    let user = await getOneUser({ email }).lean();

    if (!user) {
      throw new Error("User not found");
    }

    let compareResult = await bcrypt.compare(password, user.password);

    if (compareResult) {
      const token = jwt.sign(
        { user: { id: user._id, role: user.role } },
        process.env.JWT_SECRET || "qwertyuiopasdfghjklzxcvbnm",
        {
          expiresIn: "1d",
          algorithm: "HS256",
        }
      );

      delete user.password;

      res.json({
        code: 200,
        user,
        token,
        message: "Welcome",
      });
    } else {
      res.status(401).send({
        message: "Invalid Credentials",
      });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
}

async function register(req, res, next) {
  try {
    let { name, email, password, role, managerId } = req.body;

    let userData = await getOneUser({ email }).lean();

    if (userData) {
      throw new Error("User already exists");
    }

    if (req.decoded?.user?.role !== "Admin") {
      throw new Error("Only Admins can register users");
    }

    if (!["Manager", "Employee"].includes(role)) {
      throw new Error("Invalid role");
    }

    password = bcrypt.hashSync(password, 10);

    await createUser({
      name,
      email,
      password,
      role,
      managerId: managerId || null,
    });

    res.json({
      code: 201,
      message: "User created",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

async function getOneUserData(req, res, next) {
  try {
    let userData = await getOneUser({
      _id: req.decoded.user.id,
    }).lean();

    if (!userData) {
      throw new Error("User not found");
    }

    delete userData.password;

    res.json({
      code: 200,
      data: userData,
    });
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
}

async function getAllUserData(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const sortBy = req.query.sortBy || "name";
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
    const search = req.query.search || "";
    const role = req.query.role || "";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role && ["Admin", "Manager", "Employee"].includes(role)) {
      query.role = role;
    }

    const sort = {};
    sort[sortBy] = sortOrder;

    const users = await getAllUsers(page, limit, query, sort);
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      code: 200,
      data: {
        data: users.map((user) => {
          const userObj = user;
          delete userObj.password;
          return userObj;
        }),
        totalPages,
      },
    });
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
}

async function getTeamMembersData(req, res, next) {
  try {
    if (req.decoded.user.role !== "Manager") {
      throw new Error("Only Managers can view team members");
    }
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const sortBy = req.query.sortBy || "name";
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
    const search = req.query.search || "";
    const role = req.query.role || "";

    const query = { managerId: req.decoded.user.id };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role && ["Manager", "Employee"].includes(role)) {
      query.role = role;
    }

    const sort = {};
    sort[sortBy] = sortOrder;

    const teamData = await getTeamMembers(
      req.decoded.user.id,
      page,
      limit,
      query,
      sort
    );
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      code: 200,
      data: {
        data: teamData.map((user) => {
          const userObj = user;
          delete userObj.password;
          return userObj;
        }),
        totalPages,
      },
    });
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
}

async function updateUserData(req, res, next) {
  try {
    if (req.decoded.user.role !== "Admin") {
      throw new Error("Only Admins can update users");
    }

    const { userId, name, email, password, role, managerId } = req.body;

    if (!userId) {
      throw new Error("User ID is required");
    }

    if (role && !["Admin", "Manager", "Employee"].includes(role)) {
      throw new Error("Invalid role");
    }

    const updateData = { name, email, role, managerId: managerId || null };
    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }

    const user = await updateUser(userId, updateData);

    if (!user) {
      throw new Error("User not found");
    }

    const userObj = user;
    delete userObj.password;

    res.json({
      code: 200,
      data: userObj,
      message: "User updated",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

async function deleteUserData(req, res, next) {
  try {
    if (req.decoded.user.role !== "Admin") {
      throw new Error("Only Admins can delete users");
    }

    const { userId } = req.body;

    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await deleteUser(userId);

    if (!user) {
      throw new Error("User not found");
    }

    res.json({
      code: 200,
      message: "User deleted",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

async function createProductData(req, res, next) {
  try {
    if (!["Admin", "Manager"].includes(req.decoded.user.role)) {
      throw new Error("Only Admins and Managers can create products");
    }
    const { name, description, price } = req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await createProduct({
      name,
      description,
      price,
      image: image || null,
      createdBy: req.decoded.user.id,
    });
    res.json({
      code: 201,
      data: product,
      message: "Product created",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

async function updateProductData(req, res, next) {
  try {
    if (!["Admin", "Manager"].includes(req.decoded.user.role)) {
      throw new Error("Only Admins and Managers can update products");
    }
    const { productId, name, description, price } = req.body;
    if (!productId) {
      throw new Error("Product ID is required");
    }

    const productData = await getProductById(productId);

    if (!productData) {
      throw new Error("Product not found");
    }

    const product = await updateProduct(productId, {
      name: name || productData.name,
      description: description || productData.description,
      price: price || productData,
      image: req.file ? `/uploads/${req.file.filename}` : productData.image,
    });
    if (!product) {
      throw new Error("Product not found");
    }
    res.json({
      code: 200,
      data: product,
      message: "Product updated",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

async function deleteProductData(req, res, next) {
  try {
    if (!["Admin", "Manager"].includes(req.decoded.user.role)) {
      throw new Error("Only Admins and Managers can delete products");
    }
    const { productId } = req.body;

    if (!productId) {
      throw new Error("Product ID is required");
    }

    const product = await deleteProduct(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    res.json({
      code: 200,
      message: "Product deleted",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

async function getAllProductsData(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const sortBy = req.query.sortBy || "name";
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
    const search = req.query.search || "";
    const role = req.query.role || "";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (role && ["Admin", "Manager"].includes(role)) {
      const users = await User.find({ role }).select("_id").lean();
      query.createdBy = { $in: users.map((u) => u._id) };
    }

    const sort = {};
    if (sortBy === "createdBy") {
      sort["createdBy.name"] = sortOrder;
    } else {
      sort[sortBy] = sortOrder;
    }

    const products = await getAllProducts(page, limit, query, sort);
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      code: 200,
      data: {
        data: products,
        totalPages,
      },
    });
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
}

async function createOrderData(req, res, next) {
  try {
    if (req.decoded.user.role !== "Employee") {
      throw new Error("Only Employees can place orders");
    }
    const { customerName, productId } = req.body;
    const order = await createOrder({
      customerName,
      productId,
      employeeId: req.decoded.user.id,
    });
    res.json({
      code: 201,
      data: order,
      message: "Order created",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

async function getOrdersData(req, res, next) {
  try {
    if (req.decoded.user.role !== "Manager") {
      throw new Error("Only Managers can view orders");
    }
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const employees = await User.find({ managerId: req.decoded.user.id })
      .select("_id")
      .lean();
    const employeeIds = employees.map((emp) => emp._id);
    const orders = await getOrdersByEmployeeIds(employeeIds, page, limit);
    const totalOrders = await Order.countDocuments({
      employeeId: { $in: employeeIds },
    });
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      code: 200,
      data: {
        data: orders,
        totalPages,
      },
    });
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
}

async function updateOrderData(req, res, next) {
  try {
    if (req.decoded.user.role !== "Manager") {
      throw new Error("Only Managers can update orders");
    }
    const { orderId, status } = req.body;
    if (!orderId) {
      throw new Error("Order ID is required");
    }
    const order = await updateOrder(orderId, { status });
    if (!order) {
      throw new Error("Order not found");
    }
    res.json({
      code: 200,
      data: order,
      message: "Order updated",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

async function setupAdmin(req, res, next) {
  try {
    const existingAdmin = await getOneUser({ role: "Admin" }).lean();
    if (existingAdmin) {
      return res.status(400).json({
        code: 400,
        message: "Admin user already exists",
      });
    }

    const adminData = {
      name: "Admin User",
      email: "admin@example.com",
      password: "Admin123!",
      role: "Admin",
      managerId: null,
    };

    const hashedPassword = bcrypt.hashSync(adminData.password, 10);

    await createUser({
      ...adminData,
      password: hashedPassword,
    });

    res.json({
      code: 201,
      message: "Admin user created successfully",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message || "Failed to create Admin user",
    });
  }
}

module.exports = {
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
};
