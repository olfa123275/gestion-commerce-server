const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Calcule le total encaissable pour une journée donnée (sans clôturer)
async function calculerTotalJour(debutJour, finJour) {
  const lignes = await prisma.ligneVente.findMany({
    where: { vente: { date: { gte: debutJour, lt: finJour } } },
    include: { vente: true },
  });

  const totalParVente = {};
  for (const ligne of lignes) {
    const montant = ligne.prixUnite * ligne.quantite;
    totalParVente[ligne.venteId] = (totalParVente[ligne.venteId] || 0) + montant;
  }

  let total = 0;
  const idsVentesDuJour = new Set();
  for (const ligne of lignes) {
    total += ligne.prixUnite * ligne.quantite;
    idsVentesDuJour.add(ligne.venteId);
  }

  const retours = await prisma.retour.findMany({
    where: { date: { gte: debutJour, lt: finJour } },
    include: { ligneVente: { include: { vente: true } } },
  });

  for (const retour of retours) {
    const vente = retour.ligneVente.vente;
    const totalVente = totalParVente[vente.id];
    if (totalVente) {
      const ratioPaye = vente.montantPaye / totalVente;
      total -= retour.montant * Math.min(ratioPaye, 1);
    }
  }

  return { total, nombreVentes: idsVentesDuJour.size };
}

// Aperçu du jour (sans clôturer) — pour vérifier avant de valider
router.get('/apercu', async (req, res) => {
  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const finJour = new Date(debutJour);
  finJour.setDate(finJour.getDate() + 1);

  const { total, nombreVentes } = await calculerTotalJour(debutJour, finJour);
  const dejaCloture = await prisma.clotureCaisse.findUnique({ where: { date: debutJour } });

  res.json({ total, nombreVentes, dejaCloture: !!dejaCloture });
});

// Historique des clôtures
router.get('/', async (req, res) => {
  const clotures = await prisma.clotureCaisse.findMany({ orderBy: { date: 'desc' } });
  res.json(clotures);
});

// Clôturer la journée en cours
router.post('/', async (req, res) => {
  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const finJour = new Date(debutJour);
  finJour.setDate(finJour.getDate() + 1);

  const dejaCloture = await prisma.clotureCaisse.findUnique({ where: { date: debutJour } });
  if (dejaCloture) {
    return res.status(400).json({ erreur: 'La caisse a déjà été clôturée aujourd\'hui' });
  }

  const { total, nombreVentes } = await calculerTotalJour(debutJour, finJour);

  const cloture = await prisma.clotureCaisse.create({
    data: {
      date: debutJour,
      totalEncaisse: total,
      nombreVentes,
      cloturePar: req.utilisateur.nom,
    },
  });

  res.status(201).json(cloture);
});

module.exports = router;