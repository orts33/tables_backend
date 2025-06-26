/*
  Warnings:

  - The values [REFERRAL_BONUS_BOOST] on the enum `LevelReward_rewardType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Referral` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReferralReward` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Referral` DROP FOREIGN KEY `Referral_referredId_fkey`;

-- DropForeignKey
ALTER TABLE `Referral` DROP FOREIGN KEY `Referral_referrerId_fkey`;

-- DropForeignKey
ALTER TABLE `ReferralReward` DROP FOREIGN KEY `ReferralReward_referralId_fkey`;

-- AlterTable
ALTER TABLE `LevelReward` MODIFY `rewardType` ENUM('PRIZE_BOOST', 'FREE_ENTRY', 'PREMIUM_TABLE_ACCESS', 'VIP_CLAN', 'DOUBLE_XP', 'DISCOUNT', 'EXCLUSIVE_AVATAR', 'LEGEND_STATUS') NOT NULL;

-- DropTable
DROP TABLE `Referral`;

-- DropTable
DROP TABLE `ReferralReward`;
