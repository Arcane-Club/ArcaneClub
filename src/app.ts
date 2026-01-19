import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorMiddleware } from './middlewares/errorMiddleware';
import authRoutes from './routes/authRoutes';
import contentRoutes from './routes/contentRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import miscRoutes from './routes/miscRoutes';
import notificationRoutes from './routes/notificationRoutes';
import path from 'path';

const app = express();

// Middlewares
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow loading images
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
app.use('/pages', express.static(path.join(process.cwd(), 'public/pages')));

// Routes
app.get('/', (req, res) => {
  res.send('Arcane Club API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', contentRoutes);

// Error handling
app.use(errorMiddleware);

export default app;
