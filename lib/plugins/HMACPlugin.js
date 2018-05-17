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
const VaultPlugin = require( './VaultPlugin' );

/**
 * HMAC plugin
 */
class HMACPlugin extends VaultPlugin {
    _validateKeyBits( as, bits ) {
        if ( ( bits & 0x3 ) ||
            ( bits < 256 ) ||
            ( bits > 512 )
        ) {
            as.error( 'NotSupported', `Invalid MAC key length: ${bits}` );
        }
    }

    defaultBits() {
        return 256;
    }

    generate( as, options = {} ) {
        const bits = options.bits || this.defaultBits();
        this._validateKeyBits( as, bits );
        this.random( as, bits >> 3 );
    }

    validateKey( as, key ) {
        this._validateKeyBits( as, key.length << 3 );
    }

    sign( as, key, data, { hash } ) {
        this.validateKey( as, key );
        hash = hash.toLowerCase().replace( '-', '' );

        try {
            const hmac = crypto.createHmac( hash, key );
            hmac.update( data );
            as.successStep( hmac.digest() );
        } catch ( e ) {
            if ( e.message === 'Unknown message digest' ) {
                as.error( 'NotSupported', `Missing hash type: ${hash}` );
            }
        }
    }

    verify( as, key, data, sig, options = {} ) {
        this.sign( as, key, data, options );

        as.add( ( as, valid_sig ) => {
            try {
                const res = crypto.timingSafeEqual( valid_sig, sig );

                if ( !res ) {
                    as.error( 'InvalidSignature' );
                }
            } catch ( _ ) {
                as.error( 'InvalidSignature' );
            }
        } );
    }

    /**
     * Register this plugin
     */
    static register() {
        this.registerPlugin( 'HMAC', new this );
    }
}

module.exports = HMACPlugin;
