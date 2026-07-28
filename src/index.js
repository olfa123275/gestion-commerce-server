const express = require('express');
const cors = require('cors');
const produitsRouter = require('./routes/produits');
const clientsRouter = require('./routes/clients');
const ventesRouter = require('./routes/ventes');
const app = express();
const PORT = 5000;
const categoriesRouter = require('./routes/categories');
const fournisseursRouter = require('./routes/fournisseurs');

app.use(cors());
app.use(express.json());

app.use('/api/produits', produitsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/ventes', ventesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/fournisseurs', fournisseursRouter);

app.get('/', (req, res) => {
  res.json({ message: 'API Gestion Commerce en ligne 🚀' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});