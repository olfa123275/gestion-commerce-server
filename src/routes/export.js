const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const prisma = require('../prismaClient');

function parserPeriode(req) {
  const debut = req.query.debut ? new Date(req.query.debut) : new Date('2000-01-01');
  const fin = req.query.fin ? new Date(req.query.fin) : new Date();
  fin.setHours(23, 59, 59, 999); // inclut toute la journée de fin
  return { debut, fin };
}

function entetePdf(doc, titre) {
  doc.fontSize(18).text(titre, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#666').text(`Généré le ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });
  doc.moveDown(1.5);
  doc.fillColor('#000');
}

// Export historique des ventes
router.get('/ventes', async (req, res) => {
  const { debut, fin } = parserPeriode(req);

  const ventes = await prisma.vente.findMany({
    where: { date: { gte: debut, lte: fin } },
    include: { client: true, lignesVente: { include: { produit: true } }, facture: true },
    orderBy: { date: 'asc' },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="historique-ventes.pdf"');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  entetePdf(doc, 'Historique des ventes');

  let totalGlobal = 0;
  ventes.forEach((v) => {
    const total = v.lignesVente.reduce((s, l) => s + l.prixUnite * l.quantite, 0);
    totalGlobal += total;

    doc.fontSize(11).fillColor('#000').text(
      `${v.facture?.numero || '—'}   ${new Date(v.date).toLocaleDateString('fr-FR')}   ${v.client.nom}   ${total.toFixed(2)} DT   [${v.facture?.statut || '—'}]`
    );
    v.lignesVente.forEach((l) => {
      doc.fontSize(9).fillColor('#555').text(`   • ${l.produit.nom} × ${l.quantite} = ${(l.prixUnite * l.quantite).toFixed(2)} DT`);
    });
    doc.moveDown(0.5);
  });

  doc.moveDown(1);
  doc.fontSize(13).fillColor('#000').text(`Total : ${totalGlobal.toFixed(2)} DT   (${ventes.length} ventes)`, { align: 'right' });

  doc.end();
});

// Export des crédits (ventes non entièrement payées)
router.get('/credits', async (req, res) => {
  const { debut, fin } = parserPeriode(req);

  const ventes = await prisma.vente.findMany({
    where: { date: { gte: debut, lte: fin }, estCredit: true },
    include: { client: true, lignesVente: true, facture: true },
    orderBy: { date: 'asc' },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="historique-credits.pdf"');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  entetePdf(doc, 'Historique des crédits');

  let totalDu = 0;
  ventes.forEach((v) => {
    const total = v.lignesVente.reduce((s, l) => s + l.prixUnite * l.quantite, 0);
    const reste = total - v.montantPaye;
    totalDu += reste;

    doc.fontSize(11).fillColor('#000').text(
      `${v.facture?.numero || '—'}   ${new Date(v.date).toLocaleDateString('fr-FR')}   ${v.client.nom}   Total: ${total.toFixed(2)} DT   Payé: ${v.montantPaye.toFixed(2)} DT   Reste: ${reste.toFixed(2)} DT`
    );
    doc.moveDown(0.3);
  });

  doc.moveDown(1);
  doc.fontSize(13).text(`Total dû sur la période : ${totalDu.toFixed(2)} DT`, { align: 'right' });

  doc.end();
});

// Export des mouvements de stock
router.get('/mouvements-stock', async (req, res) => {
  const { debut, fin } = parserPeriode(req);

  const mouvements = await prisma.mouvementStock.findMany({
    where: { date: { gte: debut, lte: fin } },
    include: { produit: true },
    orderBy: { date: 'asc' },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="mouvements-stock.pdf"');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  entetePdf(doc, 'Mouvements de stock');

  const libelles = { VENTE: 'Vente', RETOUR: 'Retour', REAPPROVISIONNEMENT: 'Réapprovisionnement', AJUSTEMENT: 'Ajustement' };

  mouvements.forEach((m) => {
    doc.fontSize(10).fillColor('#000').text(
      `${new Date(m.date).toLocaleString('fr-FR')}   ${m.produit.nom}   ${libelles[m.type] || m.type}   ${m.quantite > 0 ? '+' : ''}${m.quantite}   ${m.motif || ''}`
    );
  });

  doc.moveDown(1);
  doc.fontSize(11).text(`Total : ${mouvements.length} mouvement(s)`, { align: 'right' });

  doc.end();
});

// Export des retours
router.get('/retours', async (req, res) => {
  const { debut, fin } = parserPeriode(req);

  const retours = await prisma.retour.findMany({
    where: { date: { gte: debut, lte: fin } },
    include: { ligneVente: { include: { produit: true, vente: { include: { client: true } } } } },
    orderBy: { date: 'asc' },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="historique-retours.pdf"');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  entetePdf(doc, 'Historique des retours');

  let totalRetours = 0;
  retours.forEach((r) => {
    totalRetours += r.montant;
    const client = r.ligneVente.vente.client.nom;
    const produit = r.ligneVente.produit.nom;
    doc.fontSize(10).fillColor('#000').text(
      `${new Date(r.date).toLocaleDateString('fr-FR')}   ${client}   ${produit} × ${r.quantite}   ${r.montant.toFixed(2)} DT`
    );
  });

  doc.moveDown(1);
  doc.fontSize(11).text(`Total : ${totalRetours.toFixed(2)} DT   (${retours.length} retour(s))`, { align: 'right' });

  doc.end();
});


module.exports = router;