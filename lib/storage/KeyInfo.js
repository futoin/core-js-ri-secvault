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

const PROP_NAMES = Object.freeze( [
    'uuidb64',
    'raw',
    'ext_id',
    'u_encrypt',
    'u_sign',
    'u_derive',
    'u_shared',
    'u_temp',
    'type',
    'params',
    'data',
    'created',
    'stat_times',
    'stat_bytes',
    'stat_failures',
] );

/**
 * Sealed key info
 */
class KeyInfo {
    static get PROP_NAMES() {
        return PROP_NAMES;
    }

    /**
     * C-tor
     * @param {object} info={} - optional default values
     */
    constructor( info={} ) {
        for ( var f of PROP_NAMES ) {
            const v = info[f];
            this[f] = ( v !== undefined ) ? v : null;
        }

        Object.seal( this );
    }
}

module.exports = KeyInfo;
