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

const UUIDTool = require( 'futoin-uuid' );
const _isEmpty = require( 'lodash/isEmpty' );

const BaseService = require( './lib/BaseService' );
const KeyFace = require( './KeyFace' );
const { VaultPlugin } = require( './lib/main' );
const KeyInfo = require( './lib/storage/KeyInfo' );

/**
 * Key Service
 */
class KeyService extends BaseService {
    static get IFACE_IMPL() {
        return KeyFace;
    }

    unlock( as, reqinfo ) {
        as.add(
            ( as ) => {
                this._storage.setStorageSecret( as, reqinfo.params().secret );
                reqinfo.result( true );
            },
            ( as, err ) => {
                as.error( 'InvalidSecret' );
            }
        );
    }

    lock( as, reqinfo ) {
        this._storage.setStorageSecret( as, null );
        as.add( as => reqinfo.result( true ) );
    }

    _newKey( as, reqinfo, gen_cb, inject=false ) {
        const { ext_id, usage, key_type, gen_params } = reqinfo.params();
        const storage = this._storage;
        const usage_set = new Set( usage );

        const info = new KeyInfo( {
            uuidb64 : UUIDTool.genB64(),
            ext_id,
            u_encrypt : usage_set.set( 'encrypt' ),
            u_sign : usage_set.set( 'sign' ),
            u_derive : usage_set.set( 'derive' ),
            u_shared : usage_set.set( 'shared' ),
            u_temp : usage_set.set( 'temp' ),
            type : key_type,
        } );

        if ( typeof gen_params === 'object' ) {
            info.params = Object.assign( {}, gen_params );
        } else if ( typeof gen_params === 'number' ) {
            info.params = { bits : parseInt( gen_params ) };
        } else if ( typeof gen_params === 'string' ) {
            info.params = { curve : gen_params };
        }

        as.add(
            ( as ) => {
                storage.loadExt( as, ext_id, false );
            },
            ( as, err ) => {
                as.add( ( as ) => gen_cb( as, key_type, info.params ) );
                as.add(
                    ( as, key ) => {
                        let p_key;

                        try {
                            p_key = VaultPlugin.getPlugin( key_type );
                        } catch ( _ ) {
                            as.error( 'UnsupportedKey' );
                        }

                        try {
                            p_key.validateKey( key );
                        } catch ( _ ) {
                            as.error( 'InvalidKey' );
                        }

                        info.raw = key;
                        storage.save( as, info );
                    },
                    ( as, err ) => {
                        storage.loadExt( as, ext_id, false );
                    }
                );
            }
        );

        as.add( ( as, old_info ) => {
            if ( ( old_info.u_encrypt !== usage_set.set( 'encrypt' ) ) ||
                 ( old_info.u_sign !== usage_set.set( 'sign' ) ) ||
                 ( old_info.u_derive !== usage_set.set( 'derive' ) ) ||
                 ( old_info.u_shared !== usage_set.set( 'shared' ) ) ||
                 ( old_info.u_temp !== usage_set.set( 'temp' ) ) ||
                 ( old_info.type !== key_type ) ||
                 ( !_isEmpty( old_info.params, info.params ) ) ||
                 ( inject && !old_info.raw.equals( info.raw ) )
            ) {
                as.error( 'OrigMismatch' );
            }
        } );
    }

    generateKey( as, reqinfo ) {
        this._newKey( as, reqinfo, ( as, key_type, options ) => {
            const p = VaultPlugin.getPlugin( key_type );
            p.generate( as, options );
        } );
    }

    injectKey( as, reqinfo ) {
        this._newKey( as, reqinfo, ( as ) => {
            as.success( reqinfo.params().data );
        } );
    }

    injectEncryptedKey( as, reqinfo ) {
        this._newKey( as, reqinfo, ( as ) => {
            const { data, enc_key, mode } = reqinfo.params();
            this._loadCryptKey( as, enc_key );

            as.add( ( as, enc_key_info ) => {
                const p = VaultPlugin.getPlugin( enc_key_info.type );

                as.add(
                    ( as ) => {
                        p.decrypt( as, enc_key_info.raw, data, { mode } );
                    },
                    ( as, err ) => {
                        this._storage.updateUsage( as, enc_key_info.uuidb64, {
                            failures: 1,
                        } );
                        as.add( ( as ) => as.error( err ) );
                    }
                );
            } );
        } );
    }

    deriveKey( as, reqinfo ) {
        this._newKey( as, reqinfo, ( as, key_type ) => {
            const { base_key, kdf, hash, salt, other } = reqinfo.params();

            const p_key = VaultPlugin.getPlugin( key_type );
            const bits = other.bits || p_key.defaultBits();
            const options = Object.assign( { salt }, other );
            let p_kdf;

            try {
                p_kdf = VaultPlugin.getPlugin( kdf );
            } catch ( _ ) {
                as.error( 'UnsupportedDerivation' );
            }

            this._storage.load( as, base_key );

            as.add( ( as, base_key_info ) => {
                if ( !base_key_info.u_derive ) {
                    as.error( 'NotApplicable' );
                }

                p_kdf.derive( as, base_key_info.raw, bits, hash, options );
            } );
        } );
    }

    wipeKey( as, reqinfo ) {
        this._storage.remove( as, reqinfo.params().id );
    }

    _exposeCommon( as, reqinfo, out_cb ) {
        this._storage.load( as, reqinfo.params().id );

        as.add( ( as, info ) => {
            if ( !info.u_shared ) {
                as.error( 'NotApplicable' );
            }

            out_cb( as, info );
        } );
    }

    exposeKey( as, reqinfo ) {
        this._exposeCommon( as, reqinfo, ( as, info ) => {
            as.success( info.raw );
        } );
    }

    encryptedKey( as, reqinfo ) {
        this._exposeCommon( as, reqinfo, ( as, info ) => {
            const { mode, enc_key } = reqinfo.params();

            this._loadCryptKey( as, enc_key );
            as.add( ( as, enc_key_info ) => {
                const p_enc = VaultPlugin.get( enc_key.type );
                const raw = info.raw;

                this._storage.updateUsage( as, enc_key_info.uuidb64, {
                    times: 1,
                    bytes: raw.length,
                } );

                p_enc.encrypt( as, enc_key_info.raw, raw, { mode } );
            } );
        } );
    }

    pubEncryptedKey( as, reqinfo ) {
        this._exposeCommon( as, reqinfo, ( as, info ) => {
            const { pubkey, key_type } = reqinfo.params();

            const p_enc = VaultPlugin.get( key_type );

            if ( !p_enc.isAsymetric() ) {
                as.error( 'NotApplicable' );
            }

            p_enc.encrypt( as, pubkey, info.raw );
        } );
    }

    publicKey( as, reqinfo ) {
        this._loadCryptKey( as, reqinfo.params().id );

        as.add( ( as, info ) => {
            const p = VaultPlugin.get( info.type );

            if ( !p.isAsymetric() ) {
                as.error( 'NotApplicable' );
            }

            p.pubkey( as, info.raw );
        } );
    }

    keyInfo( as, reqinfo ) {
        this._storage.load( as, reqinfo.params().id, false );

        as.add( ( as, info ) => {
            const usage = [];

            for ( let u of [ 'encrypt', 'sign', 'derive', 'shared', 'temp' ] ) {
                if ( info[`u_${u}`] ) {
                    usage.push( u );
                }
            }

            as.success( {
                id : info.uuidb64,
                type: info.type,
                params: info.params,
                created: info.created,
                used_times: info.stat_times,
                used_bytes: info.stat_bytes,
                sig_failures: info.stat_failures,
            } );
        } );
    }

    listKeys( as ) {
        this._storage.list( as );
    }

    /**
     * Register futoin.secvault.keys interface with Executor
     * @alias KeyService.register
     * @param {AsyncSteps} as - steps interface
     * @param {Executor} executor - executor instance
     * @param {object} options - implementation defined options
     * @returns {KeyService} instance
     */
}

module.exports = KeyService;
