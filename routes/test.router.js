const testController = require('../controllers/test.controller');

const testMiddleware = require('../middlewares/test.middleware');

const router = require('express').Router();

router.post('/', testMiddleware.pass, testController.test);

module.exports = router;
