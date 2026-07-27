const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Récupérer toutes les ventes (avec leurs lignes et produits)
router.get('/', async (req, res) => {
  const ventes = await prisma.vente.findMany({
    include: {
      client: true,
      lignesVente: { include: { produit: true } },
    },
  });
  res.json(ventes);
});

// Créer une nouvelle vente
router.post('/', async (req, res) => {
  const { clientId, lignes } = req.body;
  // lignes = [{ produitId: 1, quantite: 2 }, { produitId: 3, quantite: 1 }]

  const vente = await prisma.$transaction(async (tx) => {
    const nouvelleVente = await tx.vente.create({
      data: { clientId },
    });

    for (const ligne of lignes) {
      const produit = await tx.produit.findUnique({ where: { id: ligne.produitId } });

      await tx.ligneVente.create({
        data: {
          venteId: nouvelleVente.id,
          produitId: ligne.produitId,
          quantite: ligne.quantite,
          prixUnite: produit.prix,
        },
      });

      await tx.produit.update({
        where: { id: ligne.produitId },
        data: { stock: { decrement: ligne.quantite } },
      });
    }

    return nouvelleVente;
  });

  res.status(201).json(vente);
});

module.exports = router;