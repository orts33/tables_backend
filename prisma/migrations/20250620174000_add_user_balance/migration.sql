-- AlterTable
ALTER TABLE `User` ADD COLUMN `balance` DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `User_tokens_wonTables_idx` ON `User`(`tokens`, `wonTables`);
