-- Add profile fields to users table
ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) NULL;
ALTER TABLE `users` ADD COLUMN `investment_goal` VARCHAR(255) NULL;
ALTER TABLE `users` ADD COLUMN `monthly_investment` DECIMAL(10,2) NULL;
