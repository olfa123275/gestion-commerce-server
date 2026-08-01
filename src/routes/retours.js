const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.post('/', async (req, res) => {
  const { ligneVenteId, quantite } = req.body;

  try {
    const resultat = await prisma.$transaction(async (tx) => {
      const ligne = await tx.ligneVente.findUnique({
        where: { id: ligneVenteId },
        include: { retours: true, produit: true },
      });

      if (!ligne) throw new Error('Ligne de vente introuvable');

      const dejaRetourne = ligne.retours.reduce((s, r) => s + r.quantite, 0);
      const quantiteRestante = ligne.quantite - dejaRetourne;

      if (quantite > quantiteRestante) {
        throw new Error(`Impossible de retourner ${quantite} : seulement ${quantiteRestante} disponible(s) au retour`);
      }

      const montant = quantite * ligne.prixUnite;

      const retour = await tx.retour.create({
        data: { ligneVenteId, quantite, montant },
      });

      await tx.produit.update({
        where: { id: ligne.produitId },
        data: { stock: { increment: quantite } },
      });

      await tx.mouvementStock.create({
        data: {
          produitId: ligne.produitId,
          type: 'RETOUR',
          quantite: quantite,
        },
      });

      return retour;
    });

    res.status(201).json(resultat);
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
});

module.exports = router;