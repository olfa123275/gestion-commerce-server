const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/', async (req, res) => {
  const fournisseurs = await prisma.fournisseur.findMany();
  res.json(fournisseurs);
});

router.post('/', async (req, res) => {
  const { nom, telephone, adresse } = req.body;
  const fournisseur = await prisma.fournisseur.create({
    data: { nom, telephone, adresse },
  });
  res.status(201).json(fournisseur);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.fournisseur.delete({ where: { id: parseInt(id) } });
  res.status(204).send();
});








router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, telephone, adresse } = req.body;
  const fournisseur = await prisma.fournisseur.update({
    where: { id: parseInt(id) },
    data: { nom, telephone, adresse },
  });
  res.json(fournisseur);
});






module.exports = router;