const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Récupérer tous les produits
router.get('/', async (req, res) => {
  const produits = await prisma.produit.findMany();
  res.json(produits);
});

// Créer un nouveau produit
router.post('/', async (req, res) => {
  const { nom, prix, stock, codeQR } = req.body;
  const produit = await prisma.produit.create({
    data: { nom, prix, stock, codeQR },
  });
  res.status(201).json(produit);
});

module.exports = router;