import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database';

// Import routes (to be implemented)
import authRoutes from './routes/auth.routes';
import syllabusRoutes from './routes/syllabus.routes';
// import teacherRoutes from './routes/teacher.routes';
import adminRoutes from './routes/admin.routes';

import errorMiddleware from './middleware/error.middleware';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Connect to DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/syllabus', syllabusRoutes);
// app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
