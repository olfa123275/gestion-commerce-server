const express = require('express');
const cors = require('cors');
const produitsRouter = require('./routes/produits');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/api/produits', produitsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'API Gestion Commerce en ligne 🚀' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});