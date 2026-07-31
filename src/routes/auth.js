const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const SECRET = process.env.JWT_SECRET || 'change_moi_en_production';

// Inscription
router.post('/register', async (req, res) => {
  const { nom, email, motDePasse, role } = req.body;

  const motDePasseHache = await bcrypt.hash(motDePasse, 10);

  const utilisateur = await prisma.utilisateur.create({
    data: { nom, email, motDePasse: motDePasseHache, role: role || 'VENDEUR' },
  });

  res.status(201).json({ id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role });
});

// Connexion
router.post('/login', async (req, res) => {
  const { email, motDePasse } = req.body;

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  if (!utilisateur) {
    return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
  }

  if (!utilisateur.actif) {
    return res.status(403).json({ erreur: 'Ce compte a été désactivé' });
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
  if (!motDePasseValide) {
    return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
  }

  const token = jwt.sign(
    { id: utilisateur.id, nom: utilisateur.nom, role: utilisateur.role },
    SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, utilisateur: { id: utilisateur.id, nom: utilisateur.nom, role: utilisateur.role } });
});

module.exports = router;