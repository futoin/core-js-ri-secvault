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

/**
 * Data Service
 */
class DataService extends BaseService {
    static get IFACE_IMPL() {
        return DataFace;
    }

    encrypt( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    decrypt( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    sign( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
    }

    verify( as, reqinfo ) {
        reqinfo.ccm();
        as.error( 'NotImplemented' );
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
