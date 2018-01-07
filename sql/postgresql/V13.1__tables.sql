
CREATE TYPE enabled_enum AS ENUM('N', 'Y');

CREATE TABLE enc_keys (
    "uuidb64" CHARACTER(22) NOT NULL PRIMARY KEY,
    "ext_id" VARCHAR(128) NOT NULL UNIQUE,
    "u_encrypt" enabled_enum NOT NULL,
    "u_sign" enabled_enum NOT NULL,
    "u_derive" enabled_enum NOT NULL,
    "u_shared" enabled_enum NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "params" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "created" TIMESTAMP NOT NULL,
    "stat_times" INTEGER NOT NULL DEFAULT 0,
    "stat_bytes" BIGINT NOT NULL DEFAULT 0,
    "stat_failures" INTEGER NOT NULL DEFAULT 0
);
