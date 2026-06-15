const bcrypt = require('bcryptjs');

const adminHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);

module.exports = adminHash;
