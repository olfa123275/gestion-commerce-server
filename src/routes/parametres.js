const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Récupérer les paramètres (créer une valeur par défaut si aucune n'existe encore)
router.get('/', async (req, res) => {
  let parametres = await prisma.parametresCommerce.findFirst();
  if (!parametres) {
    parametres = await prisma.parametresCommerce.create({
      data: { nomCommerce: 'Mon Commerce', devise: 'TND', seuilAlerteDefaut: 5 },
    });
  }
  res.json(parametres);
});

// Mettre à jour les paramètres
router.put('/', async (req, res) => {
  const { nomCommerce, typeCommerce, devise, seuilAlerteDefaut } = req.body;
  let parametres = await prisma.parametresCommerce.findFirst();

  if (!parametres) {
    parametres = await prisma.parametresCommerce.create({
      data: { nomCommerce, typeCommerce, devise, seuilAlerteDefaut },
    });
  } else {
    parametres = await prisma.parametresCommerce.update({
      where: { id: parametres.id },
      data: { nomCommerce, typeCommerce, devise, seuilAlerteDefaut },
    });
  }

  res.json(parametres);
});

module.exports = router;