const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');

const router = require('express').Router();

router.use(authMiddleware.verifyToken);

router.get('/test/:id', (req, res) => {
  res.render('index');
});

router.get('/get', messageController.getMessages);

router.post('/send', upload.array('attachment', 9), messageController.clientSendMessage);

module.exports = router;
