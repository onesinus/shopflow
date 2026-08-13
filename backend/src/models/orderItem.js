const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, auIncrement: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false, field: 'order_id' },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
    variantId: { type: DataTypes.INTEGER, allowNull: true, field: 'variant_id' },
    productName: { type: DataTypes.STRING(255), allowNull: false, field: 'product_name' },
    sku: { type: DataTypes.STRING(64) },
    unitPriceCents: { type: DataTypes.INTEGER, allowNull: false, field: 'unit_price_cents' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    totalCents: { type: DataTypes.INTEGER, allowNull: false, field: 'total_cents' },
  },
  { tableName: 'order_items' }
);

OrderItem.associate = function (models) {
  OrderItem.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
  OrderItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  OrderItem.belongsTo(models.ProductVariant, { foreignKey: 'variantId', as: 'variant' });
};

module.exports = OrderItem;
