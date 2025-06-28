import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/database';

// Import routes
import authRoutes from './routes/auth.routes';
import syllabusRoutes from './routes/syllabus.routes';
import adminRoutes from './routes/admin.routes';
import classRoutes from './routes/class.routes';
import reportRoutes from './routes/report.routes';
import taskRoutes from './routes/task.routes';
import pdfRoutes from './routes/pdf.routes';
// Removed empty teacher routes import

import errorMiddleware from './middleware/error.middleware';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Connect to DB with error handling
connectDB().catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/pdf', pdfRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;