/*
  Warnings:

  - You are about to drop the column `actualizadoEn` on the `tarjeta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `tarjeta` DROP COLUMN `actualizadoEn`,
    ADD COLUMN `limite` DOUBLE NOT NULL DEFAULT 0;
