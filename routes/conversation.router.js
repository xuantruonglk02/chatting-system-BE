const authMiddleware = require('../middlewares/auth.middleware');
const conversationController = require('../controllers/conversation.controller');

const router = require('express').Router();

router.use(authMiddleware.verifyToken);

router.get('/ptp', conversationController.getCoversationPTP);
router.get('/get-recent', conversationController.getRecentConversations)

router.post('/create', conversationController.clientCreateConversation);

module.exports = router;
