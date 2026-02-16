-- CreateTable
CREATE TABLE `holidays` (
    `id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `date` DATE NOT NULL,
    `type` ENUM('NATIONAL', 'COMPANY', 'REGIONAL') NOT NULL DEFAULT 'COMPANY',
    `description` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `holidays_company_id_idx`(`company_id`),
    INDEX `holidays_date_idx`(`date`),
    UNIQUE INDEX `holidays_company_id_date_name_key`(`company_id`, `date`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `holidays` ADD CONSTRAINT `holidays_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
