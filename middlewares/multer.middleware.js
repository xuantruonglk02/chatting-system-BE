const multer = require('multer');
const path = require('path');
const { randomBytes } = require('node:crypto');

const storagePath = 'public/storage';
const MIME_TYPE_PATHS = {
  image: `${storagePath}/images`,
  video: `${storagePath}/videos`
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const fileType = file.mimetype.split('/')[0];
    callback(null, MIME_TYPE_PATHS[fileType]);
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = `${randomBytes(12).toString('hex')}_${Date.now()}`;
    callback(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
