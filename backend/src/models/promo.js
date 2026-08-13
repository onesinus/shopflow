const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Promo = sequelize.define(
  'Promo',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT }
  },
  {
    tableName: 'promos',
    paranoid: true,
  }
);

module.exports = Promo;
