-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` ENUM('PRINTING', 'BRANDING', 'PACKAGING', 'PROMOTIONAL') NOT NULL,
    `industries` JSON NULL,
    `short_description` TEXT NULL,
    `description` TEXT NULL,
    `benefits` JSON NULL,
    `options` JSON NULL,
    `sizes` JSON NULL,
    `materials` JSON NULL,
    `finishing` JSON NULL,
    `starting_price` DOUBLE NULL,
    `image_url` TEXT NULL,
    `gallery` JSON NULL,
    `faqs` JSON NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `is_featured` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `seo_title` VARCHAR(191) NULL,
    `seo_description` TEXT NULL,
    `seo_keywords` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `services_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `industries` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `short_description` TEXT NULL,
    `description` TEXT NULL,
    `image_url` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `accent_color` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `product_count` INTEGER NOT NULL DEFAULT 0,
    `seo_title` VARCHAR(191) NULL,
    `seo_description` TEXT NULL,
    `seo_keywords` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `industries_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `parent_id` VARCHAR(191) NULL,
    `industry_id` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `image_url` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `category` ENUM('PRINTING', 'BRANDING', 'PACKAGING', 'PROMOTIONAL') NULL,
    `category_id` VARCHAR(191) NULL,
    `category_ids` JSON NULL,
    `sub_category_id` VARCHAR(191) NULL,
    `industries` JSON NULL,
    `description` TEXT NULL,
    `short_description` TEXT NULL,
    `specifications` TEXT NULL,
    `key_benefits` JSON NULL,
    `use_cases` JSON NULL,
    `size` VARCHAR(191) NULL,
    `material` VARCHAR(191) NULL,
    `finishing` VARCHAR(191) NULL,
    `gsm` VARCHAR(191) NULL,
    `printing_type` VARCHAR(191) NULL,
    `production_time` VARCHAR(191) NULL,
    `sizes` JSON NULL,
    `materials` JSON NULL,
    `finishings` JSON NULL,
    `quantity_options` JSON NULL,
    `options` JSON NULL,
    `variants` JSON NULL,
    `price_type` ENUM('FIXED', 'TIERED', 'PER_UNIT', 'CUSTOM', 'STARTING_PRICE') NULL DEFAULT 'FIXED',
    `pricing_unit` VARCHAR(191) NULL DEFAULT 'piece',
    `custom_pricing` BOOLEAN NOT NULL DEFAULT false,
    `price_tiers` JSON NULL,
    `starting_price` DOUBLE NULL,
    `min_order_quantity` INTEGER NULL DEFAULT 1,
    `is_popular` BOOLEAN NOT NULL DEFAULT false,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED', 'OUT_OF_STOCK', 'COMING_SOON') NOT NULL DEFAULT 'ACTIVE',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `image_url` TEXT NULL,
    `gallery` JSON NULL,
    `seo_title` VARCHAR(191) NULL,
    `seo_description` TEXT NULL,
    `seo_keywords` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    UNIQUE INDEX `products_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` VARCHAR(191) NOT NULL,
    `lead_id` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `whatsapp` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `business_name` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `requirement` TEXT NULL,
    `service` VARCHAR(191) NULL,
    `product` VARCHAR(191) NULL,
    `product_id` VARCHAR(191) NULL,
    `industry` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `variant` VARCHAR(191) NULL,
    `quantity` VARCHAR(191) NULL,
    `size` VARCHAR(191) NULL,
    `material` VARCHAR(191) NULL,
    `finishing` VARCHAR(191) NULL,
    `expected_date` VARCHAR(191) NULL,
    `status` ENUM('NEW', 'CONTACTED', 'QUOTED', 'IN_PROGRESS', 'CONVERTED', 'REJECTED') NOT NULL DEFAULT 'NEW',
    `source` ENUM('WEBSITE', 'WHATSAPP', 'PHONE', 'DIRECT', 'GOOGLE') NULL DEFAULT 'WEBSITE',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NULL DEFAULT 'MEDIUM',
    `notes` JSON NULL,
    `estimated_value` DOUBLE NULL,
    `assigned_to` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `leads_lead_id_key`(`lead_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotations` (
    `id` VARCHAR(191) NOT NULL,
    `quotation_number` VARCHAR(191) NOT NULL,
    `lead_id` VARCHAR(191) NULL,
    `customer_id` VARCHAR(191) NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `customer_phone` VARCHAR(191) NULL,
    `customer_email` VARCHAR(191) NULL,
    `items` JSON NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `gst_percent` DOUBLE NOT NULL DEFAULT 18,
    `gst_amount` DOUBLE NOT NULL DEFAULT 0,
    `total_amount` DOUBLE NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
    `valid_until` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `terms` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quotations_quotation_number_key`(`quotation_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_number` VARCHAR(191) NOT NULL,
    `customer_id` VARCHAR(191) NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `customer_phone` VARCHAR(191) NULL,
    `customer_email` VARCHAR(191) NULL,
    `lead_id` VARCHAR(191) NULL,
    `quotation_id` VARCHAR(191) NULL,
    `items` JSON NOT NULL,
    `total_amount` DOUBLE NOT NULL,
    `paid_amount` DOUBLE NOT NULL DEFAULT 0,
    `pending_amount` DOUBLE NOT NULL DEFAULT 0,
    `payment_status` ENUM('PENDING', 'PARTIAL', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `order_status` ENUM('PLACED', 'ARTWORK_PENDING', 'DESIGNING', 'PRINTING', 'FINISHING', 'QUALITY_CHECK', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PLACED',
    `delivery_date` VARCHAR(191) NULL,
    `shipping_address` TEXT NULL,
    `tracking_id` VARCHAR(191) NULL,
    `courier_name` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `payment_id` VARCHAR(191) NULL,
    `order_id` VARCHAR(191) NULL,
    `order_number` VARCHAR(191) NULL,
    `customer_name` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `payment_method` ENUM('UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'CARD', 'ONLINE') NULL DEFAULT 'UPI',
    `transaction_ref` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'SUCCESS',
    `paid_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_payment_id_key`(`payment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `business` VARCHAR(191) NULL,
    `photo_url` TEXT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `review` TEXT NOT NULL,
    `is_approved` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offers` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `image_url` TEXT NULL,
    `discount` VARCHAR(191) NULL,
    `starting_price` DOUBLE NULL,
    `valid_from` VARCHAR(191) NULL,
    `valid_until` VARCHAR(191) NULL,
    `cta_text` VARCHAR(191) NULL DEFAULT 'GET A QUOTE',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portfolio_items` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` ENUM('PRINTING', 'BRANDING', 'PACKAGING', 'CORPORATE', 'EVENTS', 'PROMOTIONAL', 'CAMPAIGN') NOT NULL,
    `client` VARCHAR(191) NULL,
    `date` VARCHAR(191) NULL,
    `image_url` TEXT NOT NULL,
    `gallery` JSON NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_items` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `file_type` VARCHAR(191) NULL,
    `file_size` INTEGER NULL,
    `dimensions` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `business_name` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `gstin` VARCHAR(191) NULL,
    `total_orders` INTEGER NOT NULL DEFAULT 0,
    `total_spent` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
