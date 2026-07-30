const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/', async (req, res) => {
  const ventes = await prisma.vente.findMany({
    include: {
      client: true,
      lignesVente: { include: { produit: true, retours: true } },
      facture: true,
    },
  });
  res.json(ventes);
});

router.post('/', async (req, res) => {
  const { clientId, lignes, montantPaye } = req.body;

  const resultat = await prisma.$transaction(async (tx) => {
    // 1. Créer la vente
    const nouvelleVente = await tx.vente.create({ data: { clientId } });

    // 2. Créer les lignes de vente et calculer le total
    let total = 0;
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

      total += produit.prix * ligne.quantite;
    }

    // 3. Déterminer le montant réellement payé et le statut
    const paye = montantPaye !== undefined ? montantPaye : total;
    const resteAPayer = total - paye;
    const estCredit = resteAPayer > 0;

    let statut = 'PAYEE';
    if (paye === 0) statut = 'CREDIT';
    else if (resteAPayer > 0) statut = 'PARTIELLE';

    const venteMiseAJour = await tx.vente.update({
      where: { id: nouvelleVente.id },
      data: { estCredit, montantPaye: paye },
    });

    // 4. Mettre à jour le solde crédit du client si besoin
    if (resteAPayer > 0) {
      await tx.client.update({
        where: { id: clientId },
        data: { soldeCredit: { increment: resteAPayer } },
      });
    }

    // 5. Générer le numéro de facture (ex: FAC-0001)
    const nombreFactures = await tx.facture.count();
    const numero = `FAC-${String(nombreFactures + 1).padStart(4, '0')}`;

    const facture = await tx.facture.create({
      data: { numero, venteId: nouvelleVente.id, statut },
    });

    return { vente: venteMiseAJour, facture, total };
  });

  res.status(201).json(resultat);
});

module.exports = router;