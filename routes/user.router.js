const authMiddleware = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

const router = require('express').Router();

router.use(authMiddleware.verifyToken);

router.post('/online-status', userController.getUserOnlineStatuses);
router.post('/:userId', async (req, res) => {
  const ids = await userController.getSocketIds([req.params.userId]);
  console.log(ids);
  return res.json({ data: ids});
});

module.exports = router;
