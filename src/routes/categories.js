const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Récupérer toutes les catégories
router.get('/', async (req, res) => {
  const categories = await prisma.categorie.findMany();
  res.json(categories);
});

// Créer une nouvelle catégorie
router.post('/', async (req, res) => {
  const { nom } = req.body;
  const categorie = await prisma.categorie.create({
    data: { nom },
  });
  res.status(201).json(categorie);
});

// Supprimer une catégorie
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.categorie.delete({ where: { id: parseInt(id) } });
  res.status(204).send();
});

module.exports = router;