const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/', async (req, res) => {
  const clients = await prisma.client.findMany();
  res.json(clients);
});

router.post('/', async (req, res) => {
  const { nom, telephone } = req.body;
  const client = await prisma.client.create({
    data: { nom, telephone },
  });
  res.status(201).json(client);
});

// Encaisser un paiement (diminue le solde crédit)
router.post('/:id/encaisser', async (req, res) => {
  const { id } = req.params;
  const { montant } = req.body;
  const client = await prisma.client.update({
    where: { id: parseInt(id) },
    data: { soldeCredit: { decrement: montant } },
  });
  res.json(client);
});







router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, telephone } = req.body;
  const client = await prisma.client.update({
    where: { id: parseInt(id) },
    data: { nom, telephone },
  });
  res.json(client);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.client.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ erreur: 'Impossible de supprimer : ce client a des ventes associées' });
  }
});






module.exports = router;