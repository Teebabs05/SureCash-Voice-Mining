-- Master on/off switch (default on) for wallet-activity + login emails.
ALTER TABLE `User` ADD COLUMN `emailNotificationsEnabled` BOOLEAN NOT NULL DEFAULT true;
