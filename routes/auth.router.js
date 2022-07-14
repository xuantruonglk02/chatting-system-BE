const authController = require('../controllers/auth.controller');

const router = require('express').Router();

router.post('/login', authController.login);

module.exports = router;
