const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');

// Lister tous les utilisateurs (sans les mots de passe)
router.get('/', async (req, res) => {
  const utilisateurs = await prisma.utilisateur.findMany({
    select: { id: true, nom: true, email: true, role: true, actif: true, createdAt: true },
  });
  res.json(utilisateurs);
});

// Créer un utilisateur
router.post('/', async (req, res) => {
  const { nom, email, motDePasse, role } = req.body;
  const motDePasseHache = await bcrypt.hash(motDePasse, 10);
  const utilisateur = await prisma.utilisateur.create({
    data: { nom, email, motDePasse: motDePasseHache, role: role || 'VENDEUR' },
  });
  res.status(201).json({ id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role, actif: utilisateur.actif });
});

// Activer / désactiver un utilisateur
router.put('/:id/statut', async (req, res) => {
  const { id } = req.params;
  const { actif } = req.body;
  const utilisateur = await prisma.utilisateur.update({
    where: { id: parseInt(id) },
    data: { actif },
    select: { id: true, nom: true, email: true, role: true, actif: true },
  });
  res.json(utilisateur);
});

module.exports = router;