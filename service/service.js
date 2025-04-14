const User = require("../model/user");
const Product = require("../model/product");
const Order = require("../model/order");

function getOneUser(data) {
  return User.findOne(data);
}

function getAllUsers(page, limit, query = {}, sort = { name: 1 }) {
  return User.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
}

function getTeamMembers(
  managerId,
  page,
  limit,
  query = {},
  sort = { name: 1 }
) {
  query.managerId = managerId;
  return User.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
}

function createUser(userData) {
  return User.create(userData);
}

function updateUser(userId, updateData) {
  return User.findByIdAndUpdate(userId, updateData, { new: true }).lean();
}

function deleteUser(userId) {
  return User.findByIdAndDelete(userId).lean();
}

function createProduct(productData) {
  return Product.create(productData);
}

function updateProduct(productId, updateData) {
  return Product.findByIdAndUpdate(productId, updateData, { new: true });
}

function deleteProduct(productId) {
  return Product.findByIdAndDelete(productId).lean();
}

function getProductById(id) {
  return Product.findById(id);
}

function getAllProducts(page, limit, query = {}, sort = { name: 1 }) {
  return Product.find(query)
    .populate("createdBy", "name role")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
}

function createOrder(orderData) {
  return Order.create(orderData);
}

function getOrdersByEmployeeIds(employeeIds, page, limit) {
  return Order.find({ employeeId: { $in: employeeIds } })
    .populate("productId")
    .skip((page - 1) * limit)
    .limit(limit);
}

function updateOrder(orderId, updateData) {
  return Order.findByIdAndUpdate(orderId, updateData, { new: true });
}

module.exports = {
  getOneUser,
  getAllUsers,
  getTeamMembers,
  createUser,
  updateUser,
  deleteUser,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllProducts,
  createOrder,
  getOrdersByEmployeeIds,
  updateOrder,
};
