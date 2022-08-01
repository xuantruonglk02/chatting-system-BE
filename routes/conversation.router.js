const authMiddleware = require('../middlewares/auth.middleware');
const conversationController = require('../controllers/conversation.controller');

const router = require('express').Router();

router.use(authMiddleware.verifyToken);

router.post('/create', conversationController.clientCreateConversation);

module.exports = router;
