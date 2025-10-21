import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import greetingRoutes from './routes/greetingRoutes.js';
import testRoutes from './routes/testRoutes.js';

// Cargar variables de entorno al inicio
dotenv.config();

// Verificar que las variables de entorno necesarias estén definidas
if (!process.env.SUPABASE_KEY) {
  console.error('Error: SUPABASE_KEY no está definida en el archivo .env');
  process.exit(1);
}
const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', greetingRoutes);
app.use('/api', testRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});