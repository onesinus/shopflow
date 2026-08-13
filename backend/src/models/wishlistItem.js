const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WishlistItem = sequelize.define(
  'WishlistItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
  },
  {
    tableName: 'wishlist_items',
    indexes: [{ unique: true, fields: ['user_id', 'product_id'] }],
  }
);

WishlistItem.associate = function (models) {
  WishlistItem.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  WishlistItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
};

module.exports = WishlistItem;
