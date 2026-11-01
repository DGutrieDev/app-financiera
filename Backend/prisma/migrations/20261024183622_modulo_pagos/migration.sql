-- AlterTable
ALTER TABLE `suscripcion` ADD COLUMN `pagadoMes` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Pago` (
    `id` VARCHAR(191) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `monto` DOUBLE NOT NULL,
    `categoria` VARCHAR(191) NULL DEFAULT 'General',
    `usuarioId` VARCHAR(191) NOT NULL,
    `tarjetaId` VARCHAR(191) NULL,
    `suscripcionId` VARCHAR(191) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_tarjetaId_fkey` FOREIGN KEY (`tarjetaId`) REFERENCES `Tarjeta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_suscripcionId_fkey` FOREIGN KEY (`suscripcionId`) REFERENCES `Suscripcion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
