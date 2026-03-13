// server/verifyToken.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, 'your_secret_key_12345', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token.' });
    }

    req.user = user; // This attaches { id: 'R001', role: 'researcher', ... }
    next(); // Move on to the next function (the endpoint)
  });
}

module.exports = verifyToken;