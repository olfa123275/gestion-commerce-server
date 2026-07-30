const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/', async (req, res) => {
  const maintenant = new Date();
  const debutJour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

  // Récupérer toutes les lignes de vente avec leur vente et produit associés
  const lignes = await prisma.ligneVente.findMany({
    include: { vente: true, produit: true },
  });

  // Calcul du CA du jour et du mois
  let caJour = 0;
  let caMois = 0;
  for (const ligne of lignes) {
    const montant = ligne.prixUnite * ligne.quantite;
    if (ligne.vente.date >= debutJour) caJour += montant;
    if (ligne.vente.date >= debutMois) caMois += montant;
  }

  // Produits les plus vendus (top 5 par quantité)
  const quantitesParProduit = {};
  for (const ligne of lignes) {
    const nom = ligne.produit.nom;
    quantitesParProduit[nom] = (quantitesParProduit[nom] || 0) + ligne.quantite;
  }
  const produitsPopulaires = Object.entries(quantitesParProduit)
    .map(([nom, quantite]) => ({ nom, quantite }))
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 5);

  // Alertes stock bas
  const tousLesProduits = await prisma.produit.findMany();
  const alertesStock = tousLesProduits.filter((p) => p.stock <= p.seuilAlerte);

  // CA des 7 derniers jours (pour le graphique)
  const graphique7jours = [];
  for (let i = 6; i >= 0; i--) {
    const jour = new Date(debutJour);
    jour.setDate(jour.getDate() - i);
    const finJour = new Date(jour);
    finJour.setDate(finJour.getDate() + 1);

    const caCeJour = lignes
      .filter((l) => l.vente.date >= jour && l.vente.date < finJour)
      .reduce((somme, l) => somme + l.prixUnite * l.quantite, 0);

    graphique7jours.push({
      date: jour.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      ca: caCeJour,
    });
  }

  res.json({ caJour, caMois, produitsPopulaires, alertesStock, graphique7jours });
});

module.exports = router;