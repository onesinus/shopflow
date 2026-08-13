const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { models } = require('../models');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/paginate');

async function getMe(userId) {
  const user = await models.User.findByPk(userId, {
    include: [
      { model: models.Role, as: 'role' },
      { model: models.Profile, as: 'profile' },
      { model: models.Address, as: 'addresses' },
    ],
  });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function updateMe(userId, updates) {
  const user = await models.User.findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');

  await models.User.update({ ...updates }, { where: { id: userId } });

  let profile = await models.Profile.findOne({ where: { userId } });
  if (!profile) {
    profile = await models.Profile.create({ userId });
  }
  const profilePatch = {};
  ['bio', 'locale', 'marketingOptIn'].forEach((key) => {
    if (updates[key] !== undefined) profilePatch[key] = updates[key];
  });
  await profile.update(profilePatch);

  return getMe(userId);
}

async function listAddresses(userId) {
  return models.Address.findAll({
    where: { userId },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'ASC'],
    ],
  });
}

async function addAddress(userId, address) {
  return sequelize.transaction(async (transaction) => {
    const count = await models.Address.count({ where: { userId }, transaction });
    const isDefault = count === 0 ? true : Boolean(address.isDefault);

    if (isDefault) {
      await models.Address.update(
        { isDefault: false },
        { where: { userId }, transaction }
      );
    }

    return models.Address.create(
      {
        userId,
        ...address,
        isDefault,
      },
      { transaction }
    );
  });
}

async function removeAddress(userId, addressId) {
  const address = await models.Address.findOne({ where: { id: addressId, userId } });
  if (!address) throw ApiError.notFound('Address not found');
  await address.destroy();
  return { ok: true };
}

async function listUsers(query) {
  const { page, limit, offset } = buildPagination(query);
  const where = {};

  if (query.search) {
    const term = `%${query.search}%`;
    where[Op.or] = [
      { email: { [Op.like]: term } },
      { firstName: { [Op.like]: term } },
      { lastName: { [Op.like]: term } },
    ];
  }
  if (query.role) where.roleId = query.role;
  if (query.status) where.status = query.status;

  const { rows, count } = await models.User.findAndCountAll({
    where,
    include: [{ model: models.Role, as: 'role' }],
    order: [['createdAt', 'DESC']],
    offset,
    limit,
    distinct: true,
  });

  return { rows, count, page, limit };
}

async function getUserDetail(userId) {
  const user = await models.User.findByPk(userId, {
    include: [
      { model: models.Role, as: 'role' },
      { model: models.Profile, as: 'profile' },
      { model: models.Address, as: 'addresses' },
      { model: models.Order, as: 'orders', limit: 10, order: [['createdAt', 'DESC']] },
    ],
  });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function setUserRole(actorId, targetId, roleId) {
  if (Number(targetId) === Number(actorId)) {
    throw ApiError.badRequest('You cannot change your own role');
  }

  const target = await models.User.findByPk(targetId);
  if (!target) throw ApiError.notFound('User not found');

  const role = await models.Role.findByPk(roleId);
  if (!role) throw ApiError.badRequest('Unknown role');

  await target.update({ roleId });
  return target;
}

module.exports = { getMe, updateMe, listAddresses, addAddress, removeAddress, listUsers, getUserDetail, setUserRole };
