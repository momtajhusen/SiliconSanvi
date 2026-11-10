import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';
import { seed } from './seed.js';

const PORT = process.env.PORT || 5050;

try {
  await connectDb();
  await seed();
} catch (err) {
  console.error(`MongoDB connection failed: ${err.message}`);
  console.error("Start MongoDB (e.g. 'brew services start mongodb-community') and try again.");
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Silicon & Sanvi API running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Run 'make stop' and try again.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
