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
const DataFace = require( './DataFace' );
const { VaultPlugin } = require( './lib/main' );

/**
 * Data Service
 */
class DataService extends BaseService {
    static get IFACE_IMPL() {
        return DataFace;
    }

    encrypt( as, reqinfo ) {
        const params = reqinfo.params();

        this._loadCryptKey( as, params.id );

        as.add( ( as, info ) => {
            const { data, mode, iv, aad } = params;

            this._storage.updateUsage( as, info.uuidb64, {
                times: 1,
                bytes: data.length,
            } );

            const p = VaultPlugin.getPlugin( info.type );
            p.encrypt( as, info.raw, data, { mode, iv, aad } );
        } );
    }

    decrypt( as, reqinfo ) {
        const params = reqinfo.params();

        this._loadCryptKey( as, params.id );

        as.add( ( as, info ) => {
            const { data, mode, aad } = params;

            this._storage.updateUsage( as, info.uuidb64, {
                times: 1,
                bytes: data.length,
            } );

            const p = VaultPlugin.getPlugin( info.type );
            as.add(
                ( as ) => p.decrypt( as, info.raw, data, { mode, aad } ),
                ( as, err ) => {
                    this._storage.updateUsage( as, info.uuidb64, {
                        failures: 1,
                    } );
                    as.add( ( as ) => as.error( err ) );
                }
            );
        } );
    }

    sign( as, reqinfo ) {
        const params = reqinfo.params();

        this._loadSignKey( as, params.id );

        as.add( ( as, info ) => {
            const { data, hash } = params;

            this._storage.updateUsage( as, info.uuidb64, {
                times: 1,
            } );

            const p = VaultPlugin.getPlugin( info.type );
            p.sign( as, info.raw, data, { hash } );
        } );
    }

    verify( as, reqinfo ) {
        const params = reqinfo.params();

        this._loadSignKey( as, params.id );

        as.add( ( as, info ) => {
            const { data, hash } = params;
            const p = VaultPlugin.getPlugin( info.type );

            as.add(
                ( as ) => p.verify( as, info.raw, data, { hash } ),
                ( as, err ) => {
                    this._storage.updateUsage( as, info.uuidb64, {
                        failures: 1,
                    } );
                    as.add( ( as ) => as.error( err ) );
                }
            );
        } );
    }

    /**
     * Register futoin.secvault.data interface with Executor
     * @alias DataService.register
     * @param {AsyncSteps} as - steps interface
     * @param {Executor} executor - executor instance
     * @param {object} options - implementation defined options
     * @returns {DataService} instance
     */
}

module.exports = DataService;
