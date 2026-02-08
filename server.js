const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

// Initialize database
db;

app.listen(PORT, () => {
  console.log(`BLIP backend running on http://localhost:${PORT}`);
});