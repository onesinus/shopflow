const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const config = require('../config');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
    firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
    lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
    phone: { type: DataTypes.STRING(30) },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      field: 'role_id',
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'disabled'),
      allowNull: false,
      defaultValue: 'active',
    },
    emailVerifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'email_verified_at' },
  },
  {
    tableName: 'users',
    defaultScope: {
      attributes: { exclude: ['passwordHash'] },
    },
  }
);

User.addHook('beforeSave', async (user) => {
  if (user.changed('passwordHash')) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, config.bcryptRounds);
  }
});

User.prototype.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

User.associate = function (models) {
  User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
  User.hasOne(models.Profile, { foreignKey: 'userId', as: 'profile' });
  User.hasMany(models.Address, { foreignKey: 'userId', as: 'addresses' });
  User.hasMany(models.Cart, { foreignKey: 'userId', as: 'carts' });
  User.hasMany(models.Order, { foreignKey: 'userId', as: 'orders' });
  User.hasMany(models.Review, { foreignKey: 'userId', as: 'reviews' });
  User.hasMany(models.WishlistItem, { foreignKey: 'userId', as: 'wishlist' });
  User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
  User.hasMany(models.PasswordReset, { foreignKey: 'userId', as: 'passwordResets' });
  User.hasMany(models.EmailVerification, { foreignKey: 'userId', as: 'emailVerifications' });
  User.hasMany(models.CouponRedemption, { foreignKey: 'userId', as: 'couponRedemptions' });
  User.hasMany(models.AuditLog, { foreignKey: 'actorUserId', as: 'auditLogs' });
};

module.exports = User;
