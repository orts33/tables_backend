-- DropForeignKey
ALTER TABLE `TableUser` DROP FOREIGN KEY `TableUser_userId_fkey`;

-- DropIndex
DROP INDEX `TableUser_userId_tableId_key` ON `TableUser`;

-- AddForeignKey
ALTER TABLE `TableUser` ADD CONSTRAINT `TableUser_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `Table`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
