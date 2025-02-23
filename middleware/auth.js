const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (roles = []) => {
  return (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'Aucun token, accès refusé' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Accès interdit' });
      }
      next();
    } catch (error) {
      res.status(400).json({ message: 'Token invalide' });
    }
  };
};

module.exports = auth;