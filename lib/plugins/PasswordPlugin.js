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
const password_gen = require( '../password_gen' );

/**
 * Password plugin
 *
 * Allows passwords from 4 to 255 unicode characters in length.
 * Supports custom characters set through options.chars.
 *
 * Supports secure password verification.
 */
class PasswordPlugin extends VaultPlugin {
    _validateKeyBits( as, bits ) {
        const bytes = bits >> 3;

        if ( ( bits & 0x3 ) ||
            ( bytes < 4 ) ||
            ( bytes > 255 )
        ) {
            as.error( 'NotSupported', `Invalid Password length: ${bits}` );
        }
    }

    defaultBits() {
        return 128;
    }

    generate( as, options = {} ) {
        const bits = options.bits || this.defaultBits();
        this._validateKeyBits( as, bits );
        const res = password_gen( bits >> 3, options.chars );
        as.successStep( Buffer.from( res ) );
    }

    validateKey( as, key ) {
        this._validateKeyBits( as, key.length << 3 );
    }

    verify( as, key, _edata, sig, _options = {} ) {
        try {
            const res = crypto.timingSafeEqual( key, sig );

            if ( !res ) {
                as.error( 'InvalidSignature' );
            }
        } catch ( _ ) {
            as.error( 'InvalidSignature' );
        }
    }

    /**
     * Register this plugin
     */
    static register() {
        this.registerPlugin( 'Password', new this );
    }
}

module.exports = PasswordPlugin;
