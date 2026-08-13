const router = require('express').Router();
const promoController = require('../controllers/promoController');

router.get('/', promoController.list);

module.exports = router;
