-- Add 2FA fields to users table
ALTER TABLE `users` ADD COLUMN `two_factor_secret` VARCHAR(255) NULL;
ALTER TABLE `users` ADD COLUMN `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false;
