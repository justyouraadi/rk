-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_customer_id_fkey`;

-- DropIndex
DROP INDEX `orders_customer_id_fkey` ON `orders`;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `user_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

