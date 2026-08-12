const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sku: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(280), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    priceCents: { type: DataTypes.INTEGER, allowNull: false, field: 'price_cents' },
    categoryId: { type: DataTypes.INTEGER, allowNull: true, field: 'category_id' },
    brand: { type: DataTypes.STRING(100) },
    imageUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'image_url' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'products',
    paranoid: true,
  }
);

Product.associate = function (models) {
  Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
  Product.hasMany(models.ProductVariant, { foreignKey: 'productId', as: 'variants' });
  Product.hasOne(models.Inventory, { foreignKey: 'productId', as: 'inventory' });
  Product.hasMany(models.Review, { foreignKey: 'productId', as: 'reviews' });
  Product.hasMany(models.WishlistItem, { foreignKey: 'productId', as: 'wishlistedBy' });
};

module.exports = Product;
