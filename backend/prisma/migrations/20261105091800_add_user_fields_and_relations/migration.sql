-- AlterTable
ALTER TABLE `users` ADD COLUMN `profilePicture` TEXT NULL,
    ADD COLUMN `status` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `email` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_phone_key` ON `users`(`phone`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

