import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import  authRoutes from './routes/auth.routes';
import financialRoutes from './routes/routes.index';

const app: Application = express();

// Seguridad Helmet
app.use(helmet());

// Configuracion de CORS
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como Postman o apps móviles) en desarrollo
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por política de CORS'));
    }
  },
  credentials: true, // Vital para permitir el intercambio de cookies HTTP-only
}));

// Rutas

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', financialRoutes);

// Confirmación de que el servidor está corriendo
app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor corriendo en el puerto ${process.env.PORT || 3000}`);
});

export default app;