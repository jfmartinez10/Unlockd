'use strict';

const express = require('express');
const router  = express.Router();

/* TODO: Implementar en Fase siguiente */
router.all('*', (_req, res) => {
    res.status(501).json({ success: false, message: 'Próximamente' });
});

module.exports = router;
