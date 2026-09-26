import app from './app.js';
import { initDb } from './db.js';

const port = Number(process.env.PORT || 3001);

await initDb();

app.listen(port, () => {
  console.log(`Loan EMI Tracker API running on http://localhost:${port}`);
});
