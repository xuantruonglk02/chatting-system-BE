const authController = require('../controllers/auth.controller');

const router = require('express').Router();

router.get('/create-account', authController.getCreateAccountPage);

router.post('/login', authController.login);
router.post('/register-email', authController.registerEmail);
router.post('/create-account', authController.createAccount);
router.post('/forget-password/verify-email');
router.post('/reset-password');

module.exports = router;
