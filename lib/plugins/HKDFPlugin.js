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
 * HKDF plugin
 */
class HKDFPlugin extends VaultPlugin {
    derive( as, base, bits, digest, options = {} ) {
        digest = digest.toLowerCase().replace( '-', '' );
        const req_len = Math.ceil( bits / 8 );
        const hash_len = crypto.createHash( digest ).digest().length;

        // extract
        const salt = options.salt;
        const b_salt = ( salt && salt.length ) ? Buffer.from( salt ) : Buffer.alloc( hash_len, 0 );

        const prk = crypto.createHmac( digest, b_salt ).update( base ).digest();

        // expand
        const b_info = Buffer.from( options.info || '' );
        const info_len = b_info.length;

        const steps = Math.ceil( req_len / hash_len );

        if ( steps > 0xFF ) {
            as.error( 'ArgumentError', `Derived key is too long for ${digest}: ${bits}` );
        }

        const t = Buffer.alloc( hash_len * steps + info_len + 1 );

        for ( let c = 1, start = 0, tlen = 0; c <= steps; ++c ) {
            b_info.copy( t, tlen );
            t[ tlen + info_len ] = c;

            crypto.createHmac( digest, prk )
                .update( t.slice( start, tlen + info_len + 1 ) )
                .digest()
                .copy( t, tlen );

            start = tlen;
            tlen += hash_len;
        }

        const res = Buffer.from( t.slice( 0, req_len ) );
        as.add( ( as ) => as.success( res ) );
    }

    /**
     * Register this plugin
     */
    static register() {
        this.registerPlugin( 'HKDF', new this );
    }
}

module.exports = HKDFPlugin;
