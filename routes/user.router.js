const authMiddleware = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

const router = require('express').Router();

router.use(authMiddleware.verifyToken);

router.get('/online-status', userController.getUserOnlineStatuses);
router.post('/profile/change/name', userController.changeUserName);
router.post('/profile/change/password', userController.changeUserPassword);
router.post('/profile/change/avatar', userController.changeUserAvatar);

module.exports = router;
