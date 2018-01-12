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
 * PBKDF2 plugin
 */
class PBKDF2Plugin extends VaultPlugin {
    derive( as, base, bits, digest, options = {} ) {
        as.add( ( as ) => {
            as.setCancel( ( as ) => {} );

            crypto.pbkdf2(
                base,
                options.salt,
                options.rounds,
                bits / 8,
                digest.toLowerCase().replace( '-', '' ),
                ( err, buf ) => {
                    if ( as.state ) {
                        if ( err ) {
                            try {
                                as.error( 'RandomFailed', `${err}` );
                            } catch ( _ ) {
                                // pass
                            }
                        } else {
                            as.success( buf );
                        }
                    }
                }
            );
        } );
    }

    /**
     * Register this plugin
     */
    static register() {
        this.registerPlugin( 'PBKDF2', new this );
    }
}

module.exports = PBKDF2Plugin;
