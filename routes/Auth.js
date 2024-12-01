const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send('Authorization header missing');
  }

  const token = authHeader.split(' ')[1];
const JWT_SECRET="verifytoken";
  try {
    const decoded = jwt.verify(token,JWT_SECRET);
    req.user = decoded; // Attach the decoded token payload to req.user
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(403).send('Invalid token');
  }
};

module.exports = authenticate;
