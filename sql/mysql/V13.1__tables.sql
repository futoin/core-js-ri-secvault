
CREATE TABLE enc_keys (
    `_id` INT UNSIGNED NOT NULL auto_increment PRIMARY KEY,
    `uuidb64` CHARACTER(22) NOT NULL UNIQUE,
    `ext_id` VARCHAR(128) NOT NULL UNIQUE,
    `u_encrypt` ENUM('N', 'Y') NOT NULL,
    `u_sign` ENUM('N', 'Y') NOT NULL,
    `u_derive` ENUM('N', 'Y') NOT NULL,
    `u_shared` ENUM('N', 'Y') NOT NULL,
    `u_temp` ENUM('N', 'Y') NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `params` TEXT NOT NULL,
    `data` TEXT NOT NULL,
    `created` DATETIME NOT NULL,
    `stat_times` INTEGER NOT NULL DEFAULT 0,
    `stat_bytes` BIGINT NOT NULL DEFAULT 0,
    `stat_failures` INTEGER NOT NULL DEFAULT 0
) ENGINE=InnoDB;
