require('dotenv').config();
const migrate = require('./db/migrate');
const app = require('./app');

migrate();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Traveler running on http://localhost:${PORT}`);
});
