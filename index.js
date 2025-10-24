import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

/**
 * Importamos las rutas
 */
import greetingRoutes from './routes/greetingRoutes.js';
import testRoutes from './routes/testRoutes.js';
import sociosRoutes from './routes/sociosRoutes.js';
import ventasRoutes from './routes/ventasRoutes.js';
import membershipRoutes from './routes/membershipRoutes.js';
import authRoutes from './routes/authRoutes.js';

/**
 * Cargar variables de entorno al inicio
 */
dotenv.config();

/**
 * Verificar que las variables de entorno necesarias estén definidas
 */
if (!process.env.SUPABASE_KEY) {
  console.error('Error: SUPABASE_KEY no está definida en el archivo .env');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

/**
 * Definimos las rutas a usar
 */
app.use('/api', greetingRoutes);
app.use('/api', testRoutes);
app.use('/api', sociosRoutes);
app.use('/api', ventasRoutes);
app.use('/api', membershipRoutes);
app.use('/api', authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});