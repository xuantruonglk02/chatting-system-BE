const userController = require('../controllers/user.controller');

const router = require('express').Router();

router.post('/:userId', async (req, res) => {
  const ids = await userController.getSocketIds([req.params.userId]);
  console.log(ids);
  return res.json({ data: ids});
});

module.exports = router;
