'use strict';

/**
 * @file
 *
 * Copyright 2018 FutoIn Project (https://futoin.org)
 * Copyright 2018 Andrey Galkin <andrey@futoin.org>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const _defaults = require( 'lodash/defaults' );
const UUIDTool = require( 'futoin-uuid' );

const Storage = require( './Storage' );
const KeyInfo = require( './KeyInfo' );
const VaultPlugin = require( '../plugins/VaultPlugin' );

// hide KEKs as much as possible
const g_keks = new WeakMap();

const CIPHER_DEFAULTS = {
    type: 'AES',
    bits: 256,
    mode: 'GCM',
    aad: Buffer.from( 'SecVault' ),
};

const KDF_DEFAULTS = {
    type: 'HKDF',
    salt: 'SecVault',
    info: 'KEK', // if HKDF
    rounds: 1000, // if PBKDF2
    digest: 'SHA-512',
};

// Force full UUID length even for GCM
const FORCED_IV_LENGTH = 16;
const KEK_TEST = 'KEKTEST';

/**
 * Encrypted secret storage base
 *
 * Assume there is
 */
class EncryptedStorage extends Storage {
    constructor() {
        super();

        this._enc_plugin = null;
        this._cipher_opts = null;
    }

    /**
     * Configure common storage secret which is used to encrypt keys
     * @param {AsyncSteps} as - AsyncSteps interface
     * @param {Buffer} secret - some arbitrary secret
     * @param {object} cipher_opts={} - options for encryption/decryption
     * @param {string} cipher_opts.type=AES - cipher type
     * @param {integer} cipher_opts.bits=256 - key length for KDF
     * @param {string} cipher_opts.mode=GCM - cipher block mode
     * @param {string} cipher_opts.aad=SecVault - additional auth data
     * @param {object|null} kdf_opts={} - KDF options, null to disable
     * @param {string} kdf_opts.type=HKDF - KDF type
     * @param {string} kdf_opts.salt=SecVault - KDF salt
     * @param {string} kdf_opts.info=KEK - info parameter for HKDF
     * @param {string} kdf_opts.rounds=1000 - rounds for PBKDF2
     */
    setStorageSecret( as, secret, cipher_opts = {}, kdf_opts = {} ) {
        if ( secret === null ) {
            this._enc_plugin = null;
            g_keks.delete( this );
            return;
        }

        if ( !Buffer.isBuffer( secret ) ) {
            secret = Buffer.from( secret );
        }

        cipher_opts = _defaults( {}, cipher_opts, CIPHER_DEFAULTS );
        Object.freeze( cipher_opts ); // ensure no side effects

        const vp = VaultPlugin.getPlugin( cipher_opts.type );
        let raw_key;

        if ( kdf_opts ) {
            kdf_opts = _defaults( {}, kdf_opts, KDF_DEFAULTS );
            const p_kdf = VaultPlugin.getPlugin( kdf_opts.type );

            p_kdf.derive( as, secret, cipher_opts.bits, kdf_opts.digest, kdf_opts );
            as.add( ( as, key ) => raw_key = key );
        } else {
            raw_key = Buffer.from( secret );
        }

        as.add(
            ( as ) => {
                this._loadExt( as, KEK_TEST, false );

                as.add( ( as, key_info ) => {
                    vp.decrypt(
                        as,
                        raw_key,
                        Buffer.from( key_info.data, 'base64' ),
                        Object.assign(
                            {},
                            cipher_opts,
                            {
                                iv_length: FORCED_IV_LENGTH,
                            }
                        )
                    );
                } );
                as.add( ( as, raw ) => {
                    if ( !raw.equals( Buffer.from( KEK_TEST ) ) ) {
                        as.error( 'InvalidSecret' );
                    }
                } );
            },
            ( as, err ) => {
                if ( err === 'UnknownKeyID' ) {
                    const key_info = new KeyInfo( {
                        uuidb64 : UUIDTool.genB64(),
                        ext_id: KEK_TEST,
                        type: cipher_opts.type,
                    } );
                    const opts = Object.assign(
                        {},
                        cipher_opts,
                        {
                            // natural unique IV
                            iv: Buffer.from( key_info.uuidb64, 'base64' ),
                            iv_length: FORCED_IV_LENGTH,
                        }
                    );
                    vp.encrypt(
                        as,
                        raw_key,
                        Buffer.from( KEK_TEST ),
                        opts
                    );
                    as.add( ( as, edata ) => {
                        key_info.data = edata.toString( 'base64' );
                        this._save( as, key_info );
                    } );
                }
            }
        );
        as.add( ( as ) => {
            g_keks.set( this, raw_key );
            this._cipher_opts = cipher_opts;
            this._enc_plugin = vp;
        } );
    }

    /**
     * Check if storage is locked
     * @return {boolean} true, if locked
     */
    isLocked() {
        return !this._enc_plugin;
    }

    _encrypt( as, key_info ) {
        const kek = g_keks.get( this );
        const opts = Object.assign(
            {},
            this._cipher_opts,
            {
                // natural unique IV
                iv: Buffer.from( key_info.uuidb64, 'base64' ),
                iv_length: FORCED_IV_LENGTH,
            }
        );

        const enc_plugin = this._enc_plugin;

        if ( !enc_plugin || !kek ) {
            as.error( 'LockedStorage' );
        }

        enc_plugin.encrypt( as, kek, key_info.raw, opts );
        as.add( ( as, edata ) => key_info.data = edata.toString( 'base64' ) );
    }

    _decrypt( as, key_info ) {
        const kek = g_keks.get( this );
        const opts = Object.assign(
            {},
            this._cipher_opts,
            { iv_length: FORCED_IV_LENGTH }
        );

        const enc_plugin = this._enc_plugin;

        if ( !enc_plugin || !kek ) {
            as.error( 'LockedStorage' );
        }

        enc_plugin.decrypt(
            as, kek,
            Buffer.from( key_info.data, 'base64' ),
            opts );
        as.add( ( as, raw ) => key_info.raw = raw );
    }
}

module.exports = EncryptedStorage;
