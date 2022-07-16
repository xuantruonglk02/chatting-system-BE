const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SERVICE_EMAIL_ADDRESS,
    pass: process.env.SERVICE_EMAIL_PASSWORD
  }
});

function verificationEmailOptions(_to, _token) {
  return {
    from: `MyOnShopp <${process.env.SERVICE_EMAIL_ADDRESS}>`,
    to: _to,
    subject: `Đây là thư xác minh tài khoản email của bạn.`,
    text: `Đây là thư xác minh tài khoản email của bạn.`,
    html: `<p>Nhấn vào <a href="http://${process.env.WEB_DOMAIN}/auth/create-account?token=${_token}">đường dẫn</a> này để xác nhận. Email này có hiệu lực trong 10 phút.</p>`
  }
}

function resetPasswordEmailOptions(_to, _token) {
  return {
    from: `MyOnShopp <${process.env.SERVICE_EMAIL_ADDRESS}>`,
    to: _to,
    subject: `Đây là thư đổi mật khẩu tài khoản của bạn.`,
    text: `Đây là thư đổi mật khẩu tài khoản của bạn.`,
    html: `<p>Nhấn vào <a href="http://${process.env.WEB_DOMAIN}/auth/reset-password?token=${_token}">đường dẫn</a> này để thực hiện đổi mật khẩu. Email này có hiệu lực trong 10 phút.</p>`
  }
}

module.exports = {
  transporter,
  verificationEmailOptions,
  resetPasswordEmailOptions
}
