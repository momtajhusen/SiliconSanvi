import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { UPLOAD_DIR } from './middleware/upload.js';

const app = express();

app.set('trust proxy', 'loopback');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use(
  '/uploads',
  (_req, res, next) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, fallthrough: false })
);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
