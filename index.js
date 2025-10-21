import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import greetingRoutes from './routes/greetingRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', greetingRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});