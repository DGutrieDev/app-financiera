/*
  Warnings:

  - You are about to drop the `gastos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ingresos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `suscripciones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tarjetas_credito` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuarios` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `gastos` DROP FOREIGN KEY `gastos_tarjetaCreditoId_fkey`;

-- DropForeignKey
ALTER TABLE `gastos` DROP FOREIGN KEY `gastos_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `ingresos` DROP FOREIGN KEY `ingresos_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `suscripciones` DROP FOREIGN KEY `suscripciones_tarjetaCreditoId_fkey`;

-- DropForeignKey
ALTER TABLE `suscripciones` DROP FOREIGN KEY `suscripciones_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `tarjetas_credito` DROP FOREIGN KEY `tarjetas_credito_usuarioId_fkey`;

-- DropTable
DROP TABLE `gastos`;

-- DropTable
DROP TABLE `ingresos`;

-- DropTable
DROP TABLE `suscripciones`;

-- DropTable
DROP TABLE `tarjetas_credito`;

-- DropTable
DROP TABLE `usuarios`;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `pais` VARCHAR(191) NOT NULL DEFAULT 'Costa Rica',
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Usuario_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ingreso` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `monto` DOUBLE NOT NULL,
    `frecuencia` VARCHAR(191) NOT NULL DEFAULT 'Mensual',
    `usuarioId` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tarjeta` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `deudaActual` DOUBLE NOT NULL DEFAULT 0,
    `diaPago` INTEGER NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Suscripcion` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `monto` DOUBLE NOT NULL,
    `diaCobro` INTEGER NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `tarjetaId` VARCHAR(191) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Gasto` (
    `id` VARCHAR(191) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `monto` DOUBLE NOT NULL,
    `categoria` VARCHAR(191) NULL DEFAULT 'General',
    `usuarioId` VARCHAR(191) NOT NULL,
    `tarjetaId` VARCHAR(191) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ingreso` ADD CONSTRAINT `Ingreso_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tarjeta` ADD CONSTRAINT `Tarjeta_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Suscripcion` ADD CONSTRAINT `Suscripcion_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Suscripcion` ADD CONSTRAINT `Suscripcion_tarjetaId_fkey` FOREIGN KEY (`tarjetaId`) REFERENCES `Tarjeta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gasto` ADD CONSTRAINT `Gasto_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gasto` ADD CONSTRAINT `Gasto_tarjetaId_fkey` FOREIGN KEY (`tarjetaId`) REFERENCES `Tarjeta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
