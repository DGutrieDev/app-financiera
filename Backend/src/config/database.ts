import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseConnection {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
      console.log('Conexión a MySQL inicializada con Prisma 6 (Singleton).');
    }
    return DatabaseConnection.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.$disconnect();
      console.log('🔌 Conexión a MySQL cerrada.');
    }
  }
}

export const db = DatabaseConnection.getInstance();
export default DatabaseConnection;