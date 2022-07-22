const authController = require('../controllers/auth.controller');

const router = require('express').Router();

router.get('/create-account', authController.checkEmailRegistrationToken);
router.get('/reset-password', authController.checkPasswordRecoveryToken);

router.post('/login', authController.login);
router.post('/register-email', authController.registerEmail);
router.post('/create-account', authController.createAccount);
router.post('/forget-password/verify-email', authController.verifyEmailForPasswordRecovering);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
