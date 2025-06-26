-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `telegramId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `wonTables` INTEGER NOT NULL DEFAULT 0,
    `totalGames` INTEGER NOT NULL DEFAULT 0,
    `clanId` INTEGER NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `xp` DOUBLE NOT NULL DEFAULT 0,
    `tokens` DOUBLE NOT NULL DEFAULT 0,

    UNIQUE INDEX `User_telegramId_key`(`telegramId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LevelReward` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `level` INTEGER NOT NULL,
    `rewardType` ENUM('PRIZE_BOOST', 'FREE_ENTRY', 'PREMIUM_TABLE_ACCESS', 'REFERRAL_BONUS_BOOST', 'VIP_CLAN', 'DOUBLE_XP', 'DISCOUNT', 'EXCLUSIVE_AVATAR', 'LEGEND_STATUS') NOT NULL,
    `amount` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Table` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('LINEAR', 'RANDOM') NOT NULL DEFAULT 'LINEAR',
    `entryFee` INTEGER NOT NULL,
    `prizeFund` INTEGER NOT NULL,
    `status` ENUM('OPEN', 'CLOSED', 'FINISHED') NOT NULL DEFAULT 'OPEN',
    `inviteLink` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Table_inviteLink_key`(`inviteLink`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TableUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `tableId` INTEGER NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TablePrize` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tableId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `position` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Clan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `creatorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Clan_name_key`(`name`),
    UNIQUE INDEX `Clan_creatorId_key`(`creatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Referral` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `referrerId` INTEGER NOT NULL,
    `referredId` INTEGER NOT NULL,
    `referredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReferralReward` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `referralId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `type` ENUM('FIRST_DEPOSIT', 'SUBSEQUENT_DEPOSIT', 'MILESTONE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_clanId_fkey` FOREIGN KEY (`clanId`) REFERENCES `Clan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LevelReward` ADD CONSTRAINT `LevelReward_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TableUser` ADD CONSTRAINT `TableUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TableUser` ADD CONSTRAINT `TableUser_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `Table`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TablePrize` ADD CONSTRAINT `TablePrize_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `Table`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TablePrize` ADD CONSTRAINT `TablePrize_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Clan` ADD CONSTRAINT `Clan_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referredId_fkey` FOREIGN KEY (`referredId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferralReward` ADD CONSTRAINT `ReferralReward_referralId_fkey` FOREIGN KEY (`referralId`) REFERENCES `Referral`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
