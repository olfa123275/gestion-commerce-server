const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Réapprovisionnement manuel
router.post('/reapprovisionnement', async (req, res) => {
  const { produitId, quantite, motif } = req.body;

  const resultat = await prisma.$transaction(async (tx) => {
    await tx.produit.update({
      where: { id: produitId },
      data: { stock: { increment: quantite } },
    });

    const mouvement = await tx.mouvementStock.create({
      data: {
        produitId,
        type: 'REAPPROVISIONNEMENT',
        quantite,
        motif: motif || null,
      },
    });

    return mouvement;
  });

  res.status(201).json(resultat);
});

// Historique des mouvements (tous produits, ou filtré par produit)
router.get('/', async (req, res) => {
  const { produitId } = req.query;
  const mouvements = await prisma.mouvementStock.findMany({
    where: produitId ? { produitId: parseInt(produitId) } : {},
    include: { produit: true },
    orderBy: { date: 'desc' },
  });
  res.json(mouvements);
});

module.exports = router;