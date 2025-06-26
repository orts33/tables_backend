/*
  Warnings:

  - The values [FIRST_DEPOSIT,SUBSEQUENT_DEPOSIT,MILESTONE] on the enum `ReferralReward_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `entryFee` on the `Table` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(65,30)`.
  - You are about to drop the column `tokens` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `User_tokens_wonTables_idx` ON `User`;

-- AlterTable
ALTER TABLE `ReferralReward` MODIFY `amount` DECIMAL(65, 30) NOT NULL,
    MODIFY `type` ENUM('FIRST_BET', 'SUBSEQUENT_BET') NOT NULL;

-- AlterTable
ALTER TABLE `Table` MODIFY `entryFee` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `TableUser` ADD COLUMN `isFirstBet` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `tokens`;

-- CreateIndex
CREATE INDEX `User_balance_wonTables_idx` ON `User`(`balance`, `wonTables`);
