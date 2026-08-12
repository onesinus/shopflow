'use strict';

const { models } = require('../src/models');

module.exports = {
  up: async () => {
    const roleRows = await models.Role.bulkCreate(
      [
        { name: 'admin', description: 'Full platform access' },
        { name: 'staff', description: 'Operations staff - manages products and orders' },
        { name: 'customer', description: 'Storefront customer' },
      ],
      { individualHooks: true }
    );

    const roleIdByName = roleRows.reduce((acc, role) => {
      acc[role.name] = role.id;
      return acc;
    }, {});

    // Plaintext here - the User model's beforeSave hook hashes it on insert.
    const password = 'Password123!';

    const users = [
      {
        email: 'admin@shopflow.test',
        passwordHash: password,
        firstName: 'Ada',
        lastName: 'Lovelace',
        phone: '+1 415 555 0100',
        roleId: roleIdByName.admin,
        status: 'active',
        emailVerifiedAt: new Date(),
      },
      {
        email: 'staff@shopflow.test',
        passwordHash: password,
        firstName: 'Grace',
        lastName: 'Hopper',
        phone: '+1 415 555 0101',
        roleId: roleIdByName.staff,
        status: 'active',
        emailVerifiedAt: new Date(),
      },
      {
        email: 'customer@shopflow.test',
        passwordHash: password,
        firstName: 'Jordan',
        lastName: 'Rivera',
        phone: '+1 415 555 0102',
        roleId: roleIdByName.customer,
        status: 'active',
        emailVerifiedAt: new Date(),
      },
      {
        email: 'sam@example.com',
        passwordHash: password,
        firstName: 'Sam',
        lastName: 'Reyes',
        phone: '+1 415 555 0103',
        roleId: roleIdByName.customer,
        status: 'active',
        emailVerifiedAt: new Date(),
      },
      {
        email: 'tara@example.com',
        passwordHash: password,
        firstName: 'Tara',
        lastName: 'Okafor',
        phone: '+1 415 555 0104',
        roleId: roleIdByName.customer,
        status: 'active',
        emailVerifiedAt: new Date(),
      },
      {
        email: 'leo@example.com',
        passwordHash: password,
        firstName: 'Leo',
        lastName: 'Park',
        phone: '+1 415 555 0105',
        roleId: roleIdByName.customer,
        status: 'active',
        emailVerifiedAt: new Date(),
      },
      {
        // Account created before the profile migration - no Profile row exists.
        email: 'maria@example.com',
        passwordHash: password,
        firstName: 'Maria',
        lastName: 'Souza',
        phone: '+1 415 555 0106',
        roleId: roleIdByName.customer,
        status: 'active',
        emailVerifiedAt: new Date(),
      },
      {
        email: 'dormant@example.com',
        passwordHash: password,
        firstName: 'Dormant',
        lastName: 'Account',
        phone: '+1 415 555 0107',
        roleId: roleIdByName.customer,
        status: 'disabled',
        emailVerifiedAt: new Date(),
      },
    ];

    const createdUsers = await models.User.bulkCreate(users, { individualHooks: true });

    const userByEmail = createdUsers.reduce((acc, user) => {
      acc[user.email] = user;
      return acc;
    }, {});

    const profiles = [
      { userId: userByEmail['admin@shopflow.test'].id, bio: 'Platform admin', locale: 'en', marketingOptIn: false },
      { userId: userByEmail['staff@shopflow.test'].id, bio: 'Operations', locale: 'en', marketingOptIn: false },
      { userId: userByEmail['customer@shopflow.test'].id, bio: 'Loves outdoor gear', locale: 'en', marketingOptIn: true },
      { userId: userByEmail['sam@example.com'].id, bio: '', locale: 'en', marketingOptIn: false },
      { userId: userByEmail['tara@example.com'].id, bio: 'Early adopter', locale: 'en', marketingOptIn: true },
      { userId: userByEmail['leo@example.com'].id, bio: '', locale: 'en', marketingOptIn: false },
      // NOTE: maria@example.com has deliberately no profile row (legacy account).
    ];
    await models.Profile.bulkCreate(profiles, { individualHooks: true });

    const addresses = [
      {
        userId: userByEmail['customer@shopflow.test'].id,
        label: 'Home',
        firstName: 'Jordan',
        lastName: 'Rivera',
        line1: '88 Market Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
        isDefault: true,
      },
      {
        userId: userByEmail['customer@shopflow.test'].id,
        label: 'Work',
        firstName: 'Jordan',
        lastName: 'Rivera',
        line1: '400 Mission Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
        isDefault: false,
      },
      {
        userId: userByEmail['sam@example.com'].id,
        label: 'Home',
        firstName: 'Sam',
        lastName: 'Reyes',
        line1: '12 Elm Street',
        city: 'Austin',
        state: 'TX',
        postalCode: '73301',
        country: 'US',
        isDefault: true,
      },
      {
        userId: userByEmail['tara@example.com'].id,
        label: 'Home',
        firstName: 'Tara',
        lastName: 'Okafor',
        line1: '5 Birch Lane',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
        isDefault: true,
      },
      {
        userId: userByEmail['leo@example.com'].id,
        label: 'Home',
        firstName: 'Leo',
        lastName: 'Park',
        line1: '77 King Street',
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5V 1A5',
        country: 'CA',
        isDefault: true,
      },
    ];
    await models.Address.bulkCreate(addresses, { individualHooks: true });
  },

  down: async () => {
    await models.Address.destroy({ where: {}, force: true });
    await models.Profile.destroy({ where: {}, force: true });
    await models.User.destroy({ where: {}, force: true });
    await models.Role.destroy({ where: {}, force: true });
  },
};
