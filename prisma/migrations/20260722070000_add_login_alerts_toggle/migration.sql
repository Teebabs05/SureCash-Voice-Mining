-- Split login-alert emails out from the general wallet-activity email
-- toggle into their own switch (default on) so users and admins can turn
-- login notifications on/off independently of wallet emails.
ALTER TABLE `User` ADD COLUMN `loginAlertsEnabled` BOOLEAN NOT NULL DEFAULT true;
