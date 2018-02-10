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
const AES_IV_LEN = 16;
const GCM_IV_LEN = 12;
const GCMCCM_AUTHTAG_LEN = 16;

/**
 * AES plugin
 */
class AESPlugin extends VaultPlugin {
    _validateKeyBits( as, bits ) {
        switch ( bits ) {
        case 128:
        case 192:
        case 256:
            return;

        default:
            as.error( 'NotSupported', `Invalid AES key length: ${bits}` );
        }
    }

    _validateMode( as, mode ) {
        switch ( mode ) {
        case 'CBC':
        case 'CTR':
            return { optimal_iv_len: AES_IV_LEN, is_auth: false };
        /*
         * Not Yet supported
        case 'CCM':
            return { optimal_iv_len: AES_IV_LEN, is_auth: true };
        */

        case 'GCM':
            return { optimal_iv_len: GCM_IV_LEN, is_auth: true };

        default:
            as.error( 'NotSupported', `Invalid AES Mode: ${mode}` );
        }
    }

    defaultBits() {
        return 128;
    }

    generate( as, options = {} ) {
        const bits = options.bits || this.defaultBits();
        this._validateKeyBits( as, bits );
        this.random( as, bits / 8 );
    }

    encrypt( as, key, data, options = {} ) {
        const bits = key.length * 8;
        const mode = options.mode || 'CBC';

        this._validateKeyBits( as, bits );
        const { optimal_iv_len, is_auth } = this._validateMode( as, mode );
        const iv_len = options.iv_length || optimal_iv_len;

        if ( !options.iv ) {
            this.random( as, iv_len );
        } else if ( options.iv.length !== iv_len ) {
            as.error( 'InvalidIV', `Forced IV for AES-${mode} must be of ${iv_len} bytes length` );
        }

        as.add( ( as, new_iv ) => {
            const iv = new_iv || options.iv;

            const cipher = crypto.createCipheriv(
                `aes-${bits}-${mode.toLowerCase()}`, key, iv );

            const { aad } = options;

            if ( is_auth && aad ) {
                cipher.setAAD( aad );
            }

            const edata = [
                cipher.update( data, 'utf8' ),
                cipher.final(),
            ];

            edata.push( iv );

            if ( is_auth ) {
                const authtag_length = options.authtag_length || GCMCCM_AUTHTAG_LEN;
                edata.push( cipher.getAuthTag().slice( 0, authtag_length ) );
            }

            as.success( Buffer.concat( edata ) );
        } );
    }

    decrypt( as, key, edata, options = {} ) {
        const bits = key.length * 8;
        const mode = options.mode || 'CBC';

        this._validateKeyBits( as, bits );
        const { optimal_iv_len, is_auth } = this._validateMode( as, mode );
        const iv_len = options.iv_length || optimal_iv_len;

        as.add( ( as ) => {
            let len = edata.length;
            let end = len;
            let authtag = null;

            // extract AuthTag
            if ( is_auth ) {
                const authtag_length = options.authtag_length || GCMCCM_AUTHTAG_LEN;
                len -= authtag_length;
                authtag = edata.slice( len, end );
                end = len;
            }

            // extract IV
            len -= iv_len;
            const iv = edata.slice( len, end );
            end = len;

            //
            const cipher = crypto.createDecipheriv(
                `aes-${bits}-${mode.toLowerCase()}`, key, iv );

            // AAD
            const { aad } = options;

            if ( is_auth && aad ) {
                cipher.setAAD( aad );
            }

            // AuthTag
            if ( authtag ) {
                cipher.setAuthTag( authtag );
            }

            // Data
            const data = [
                cipher.update( edata.slice( 0, end ) ),
                cipher.final(),
            ];

            as.success( Buffer.concat( data ) );
        } );
    }

    /**
     * Register this plugin
     */
    static register() {
        this.registerPlugin( 'AES', new this );
    }
}

module.exports = AESPlugin;
