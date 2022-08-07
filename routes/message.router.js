const authMiddleware = require('../middlewares/auth.middleware');
const messageController = require('../controllers/message.controller');

const router = require('express').Router();

router.use(authMiddleware.verifyToken);

router.get('/test/:id', (req, res) => {
  res.render('index');
});

router.get('/get', messageController.getMessages);

router.post('/send', messageController.clientSendMessage);

module.exports = router;
