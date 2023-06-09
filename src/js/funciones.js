function generateAccessToken(jwt,user) {
  return jwt.sign(user,process.env.SECRET, {expiresIn: '2m'});
}

module.exports = {generateAccessToken}