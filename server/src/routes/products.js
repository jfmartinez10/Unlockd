'use strict';

const express                        = require('express');
const { generalLimiter }             = require('../middleware/rateLimit');
const { getAllProducts, getProductById } = require('../controllers/productController');

const router = express.Router();

router.use(generalLimiter);
router.get('/',    getAllProducts);
router.get('/:id', getProductById);

module.exports = router;
