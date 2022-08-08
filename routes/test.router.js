const upload = require('../middlewares/multer.middleware');

const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('file');
});
router.post('/single', upload.single('avatar'), (req, res) => {
  console.log(req.file);
});
router.post('/multiple', upload.array('attachment', 9), (req, res) => {
  console.log(req.files);
});

module.exports = router;
