const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Récupérer tous les clients
router.get('/', async (req, res) => {
  const clients = await prisma.client.findMany();
  res.json(clients);
});

// Créer un nouveau client
router.post('/', async (req, res) => {
  const { nom, telephone } = req.body;
  const client = await prisma.client.create({
    data: { nom, telephone },
  });
  res.status(201).json(client);
});

module.exports = router;