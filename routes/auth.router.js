const authController = require('../controllers/auth.controller');

const router = require('express').Router();

router.post('/login', authController.login);
router.post('/register-email', authController.registerEmail);
router.post('/create-account');
router.post('/forget-password/verify-email');
router.post('/reset-password');

module.exports = router;
