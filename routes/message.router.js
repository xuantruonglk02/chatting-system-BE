const authMiddleware = require('../middlewares/auth.middleware');
const messageController = require('../controllers/message.controller');

const router = require('express').Router();

router.get('/test/:id', (req, res) => {
  res.render('index');
});

// router.post('/send', authMiddleware.verifyToken, messageController.clientSendMessage);
router.post('/send', messageController.clientSendMessage);

module.exports = router;
