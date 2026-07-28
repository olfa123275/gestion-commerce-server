const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Récupérer tous les produits (avec catégorie et fournisseur inclus)
router.get('/', async (req, res) => {
  const produits = await prisma.produit.findMany({
    include: { categorie: true, fournisseur: true },
  });
  res.json(produits);
});

// Créer un nouveau produit
router.post('/', async (req, res) => {
  const { nom, prix, stock, codeQR, seuilAlerte, categorieId, fournisseurId } = req.body;
  const produit = await prisma.produit.create({
    data: {
      nom,
      prix,
      stock,
      codeQR,
      seuilAlerte: seuilAlerte || 5,
      categorieId: categorieId || null,
      fournisseurId: fournisseurId || null,
    },
  });
  res.status(201).json(produit);
});

module.exports = router;