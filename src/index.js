const express = require('express');
const cors = require('cors');
const { verifierToken, verifierAdmin } = require('./middleware/auth');

const authRouter = require('./routes/auth');
const produitsRouter = require('./routes/produits');
const clientsRouter = require('./routes/clients');
const ventesRouter = require('./routes/ventes');
const categoriesRouter = require('./routes/categories');
const fournisseursRouter = require('./routes/fournisseurs');
const statistiquesRouter = require('./routes/statistiques');
const parametresRouter = require('./routes/parametres');
const utilisateursRouter = require('./routes/utilisateurs');
const retoursRouter = require('./routes/retours');
const mouvementsStockRouter = require('./routes/mouvementsStock');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Route publique (pas besoin d'être connecté)
app.use('/api/auth', authRouter);

// Routes protégées (nécessitent un token valide)
app.use('/api/produits', verifierToken, produitsRouter);
app.use('/api/clients', verifierToken, clientsRouter);
app.use('/api/ventes', verifierToken, ventesRouter);
app.use('/api/categories', verifierToken, categoriesRouter);
app.use('/api/fournisseurs', verifierToken, fournisseursRouter);
app.use('/api/statistiques', verifierToken, statistiquesRouter);
app.use('/api/parametres', verifierToken, parametresRouter);
app.use('/api/utilisateurs', verifierToken, verifierAdmin, utilisateursRouter);
app.use('/api/retours', verifierToken, retoursRouter);
app.use('/api/mouvements-stock', verifierToken, mouvementsStockRouter);

app.get('/', (req, res) => {
  res.json({ message: 'API Gestion Commerce en ligne 🚀' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});