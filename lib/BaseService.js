'use strict';

/**
 * @file
 *
 * Copyright 2017-2018 FutoIn Project (https://futoin.org)
 * Copyright 2017-2018 Andrey Galkin <andrey@futoin.org>
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

const PingService = require( 'futoin-executor/PingService' );

const { DB_IFACEVER } = require( './main' );

/**
 * Base Service with common registration logic
 */
class BaseService extends PingService {
    /**
     * Interface name - to be overridden
     * @alias BaseFace.IFACE_IMPL
     * @property {object}
     */

    /**
     * C-tor
     * @param {Storage} storage - low-level storage instance
     * @param {object} options - passed to superclass c-tor
     * @param {integer} options.failure_limit=10000 - limit crypt key decrypt failures
     */
    constructor( storage, options ) {
        super( options );
        this._storage = storage;
        this._failure_limit = options.failure_limit || 1e4;
    }

    /**
     * Register futoin.xfers.limits interface with Executor
     * @param {AsyncSteps} as - steps interface
     * @param {Executor} executor - executor instance
     * @param {Storage} storage - low-level storage instance
     * @param {object} options - implementation defined options
     * @returns {LimitsService} instance
     */
    static register( as, executor, storage, options={} ) {
        const Face = this.IFACE_IMPL;
        const ifacename = Face.IFACE_NAME;
        const ver = Face.LATEST_VERSION;
        const ifacever = `${ifacename}:${ver}`;
        const impl = new this( storage, options );
        const spec_dirs = Face.spec();

        executor.register( as, ifacever, impl, spec_dirs );

        as.add( ( as ) => {
            const ccm = executor.ccm();
            ccm.assertIface( '#db.secvault', DB_IFACEVER );
        } );

        return impl;
    }

    _checkFailureLimit( as, info ) {
        if ( info.stat_failures > this._failure_limit ) {
            as.error( 'SecurityError', 'Failure limit has reached' );
        }
    }

    _loadCryptKey( as, id ) {
        this._storage.load( as, id );

        as.add( ( as, info ) => {
            if ( !info.u_encrypt ) {
                as.error( 'NotApplicable' );
            }

            this._checkFailureLimit( as, info );
            as.success( info );
        } );
    }

    _loadSignKey( as, id ) {
        this._storage.load( as, id );

        as.add( ( as, info ) => {
            if ( !info.u_sign ) {
                as.error( 'NotApplicable' );
            }

            this._checkFailureLimit( as, info );
            as.success( info );
        } );
    }
}

module.exports = BaseService;
