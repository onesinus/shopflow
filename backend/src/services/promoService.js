const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { models } = require('../models');

async function getPromos() {
  const product = await models.Promo.findAll({
    raw: true
  });
  return product;
}

module.exports = { getPromos };
