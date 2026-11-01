import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        correo?: string;
      };
      userId?: string;
    }
  }
}