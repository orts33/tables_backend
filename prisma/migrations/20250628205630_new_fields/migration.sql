/*
  Warnings:

  - Added the required column `link` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentId` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Invoice` ADD COLUMN `link` VARCHAR(191) NOT NULL,
    ADD COLUMN `paymentId` INTEGER NOT NULL;
