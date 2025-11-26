import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import solo el auth route por ahora
import authRoutes from './routes/authRoutes.js';
import productsRoutes from './routes/productsRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import membershipsRoutes from './routes/membershipsRoutes.js';
import sociosRoutes from './routes/sociosRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3300;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://hexodus-backend.vercel.app',
    'https://hexodus-project.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Hexodus Backend API - Firebase Edition',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/memberships', membershipsRoutes);
app.use('/api/socios', sociosRoutes);
app.use('/api/reports', reportsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth/`);
  console.log(`📼 Products endpoints: http://localhost:${PORT}/api/products/`);
  console.log(`🛒 Sales endpoints: http://localhost:${PORT}/api/sales/`);
  console.log(`🎫 Memberships endpoints: http://localhost:${PORT}/api/memberships/`);
  console.log(`👥 Socios endpoints: http://localhost:${PORT}/api/socios/`);
  console.log(`📊 Reports endpoints: http://localhost:${PORT}/api/reports/`);
});

export default app;