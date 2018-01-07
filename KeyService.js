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

const BaseService = require( './lib/BaseService' );
const KeyFace = require( './KeyFace' );

/**
 * Key Service
 */
class KeyService extends BaseService {
    static get IFACE_IMPL() {
        return KeyFace;
    }

    unlock( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    lock( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    generateKey( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    injectKey( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    injectEncryptedKey( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    deriveKey( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    wipeKey( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    exposeKey( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    encryptedKey( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    pubEncryptedKey( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    publicKey( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    keyInfo( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    listKeys( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
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
