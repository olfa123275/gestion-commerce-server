const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change_moi_en_production';

function verifierToken(req, res, next) {
  const enTete = req.headers.authorization;
  if (!enTete || !enTete.startsWith('Bearer ')) {
    return res.status(401).json({ erreur: 'Token manquant' });
  }

  const token = enTete.split(' ')[1];

  try {
    const donnees = jwt.verify(token, SECRET);
    req.utilisateur = donnees; // on rend l'utilisateur disponible pour la suite
    next(); // laisse passer la requête
  } catch (err) {
    return res.status(401).json({ erreur: 'Token invalide ou expiré' });
  }
}

// Vérifie en plus que l'utilisateur est ADMIN
function verifierAdmin(req, res, next) {
  if (req.utilisateur.role !== 'ADMIN') {
    return res.status(403).json({ erreur: 'Accès réservé aux administrateurs' });
  }
  next();
}

module.exports = { verifierToken, verifierAdmin };