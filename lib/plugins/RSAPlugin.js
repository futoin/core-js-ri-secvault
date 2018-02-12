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

const crypto = require( 'crypto' );
const pem = require( 'pem' );
const Mutex = require( 'futoin-asyncsteps/Mutex' );

const VaultPlugin = require( './VaultPlugin' );

const g_openssl_mtx = new Mutex();
const DEFAULT_SIG_HASH = 'SHA-256';

/**
 * RSA plugin
 */
class RSAPlugin extends VaultPlugin {
    defaultBits() {
        return 2048;
    }

    isAsymetric() {
        return true;
    }

    generate( as, options = {} ) {
        as.sync( g_openssl_mtx, ( as ) => {
            const bits = options.bits || this.defaultBits();
            pem.createPrivateKey( bits, function( err, res ) {
                if ( as.state ) {
                    if ( err ) {
                        try {
                            as.error( err );
                        } catch ( _ ) {
                            // pass
                        }
                    } else {
                        as.success( Buffer.from( res.key.trim() ) );
                    }
                }
            } );
            as.waitExternal();
        } );
    }

    validateKey( as, key ) {
        this.pubkey( as, key );
    }

    pubkey( as, key ) {
        as.sync( g_openssl_mtx, ( as ) => {
            pem.getPublicKey( key, function( err, res ) {
                if ( as.state ) {
                    if ( err ) {
                        try {
                            as.error( err );
                        } catch ( _ ) {
                            // pass
                        }
                    } else {
                        as.success( Buffer.from( res.publicKey.trim() ) );
                    }
                }
            } );
            as.waitExternal();
        } );
    }

    encrypt( as, key, data ) {
        const res = crypto.publicEncrypt( key, data );
        as.successStep( res );
    }

    decrypt( as, key, data ) {
        try {
            const res = crypto.privateDecrypt( key, data );
            as.successStep( res );
        } catch ( e ) {
            as.error( 'InvalidData', e.message );
        }
    }

    sign( as, key, data, options = {} ) {
        const hash = ( options.hash || DEFAULT_SIG_HASH ).toLowerCase().replace( '-', '' );
        const sign = crypto.createSign( hash );
        sign.update( data );
        const res = sign.sign( key );
        as.successStep( res );
    }

    verify( as, key, data, sig, options = {} ) {
        try {
            const hash = ( options.hash || DEFAULT_SIG_HASH ).toLowerCase().replace( '-', '' );
            const verify = crypto.createVerify( hash );
            verify.update( data );
            const res = verify.verify( key, sig );

            as.add( ( as ) => res ? as.success() : as.error( 'InvalidSignature' ) );
        } catch ( e ) {
            as.error( 'InvalidSignature', e.message );
        }
    }


    /**
     * Register this plugin
     */
    static register() {
        this.registerPlugin( 'RSA', new this );
    }
}

module.exports = RSAPlugin;
