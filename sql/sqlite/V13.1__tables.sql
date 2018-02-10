
CREATE TABLE enc_keys (
    "uuidb64" CHARACTER(22) NOT NULL PRIMARY KEY,
    "ext_id" VARCHAR(128) NOT NULL UNIQUE,
    "u_encrypt" CHARACTER(1) NOT NULL,
    "u_sign" CHARACTER(1) NOT NULL,
    "u_derive" CHARACTER(1) NOT NULL,
    "u_shared" CHARACTER(1) NOT NULL,
    "u_temp" CHARACTER(1) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "params" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "created" TIMESTAMP NOT NULL,
    "stat_times" INTEGER NOT NULL DEFAULT 0,
    "stat_bytes" BIGINT NOT NULL DEFAULT 0,
    "stat_failures" INTEGER NOT NULL DEFAULT 0
);
