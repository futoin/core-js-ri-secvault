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

const VaultPlugin = require( './VaultPlugin' );

/**
 * RSA plugin
 */
class RSAPlugin extends VaultPlugin {
    generate( as, options = {} ) {
        as.error( 'NotApplicable' );
        void options;
    }

    pubkey( as, key, options = {} ) {
        as.error( 'NotApplicable' );
        void key;
        void options;
    }

    encrypt( as, key, data, options = {} ) {
        as.error( 'NotApplicable' );
        void key;
        void data;
        void options;
    }

    decrypt( as, key, data, options = {} ) {
        as.error( 'NotApplicable' );
        void key;
        void data;
        void options;
    }

    /**
     * Register this plugin
     */
    static register() {
        this.registerPlugin( 'RSA', new this );
    }
}

module.exports = RSAPlugin;
