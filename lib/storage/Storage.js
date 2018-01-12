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

/**
 * Secret storage base
 */
class Storage {
    load( as, uuidb64 ) {
        this._load( as, uuidb64 );
        as.add( ( as, info ) => this._decrypt( as, info ) );
    }

    loadExt( as, ext_id ) {
        this._load( as, ext_id );
        as.add( ( as, info ) => this._decrypt( as, info ) );
    }

    save( as, info ) {
        this._encrypt( as, info );
        this._save( as, info );
    }

    updateUsage( as, uuidb64, stats ) {
        this._update(
            as,
            uuidb64,
            {
                stat_times: stats.times || 0,
                stat_bytes: stats.bytes || 0,
                stat_failures: stats.failures || 0,
            }
        );
    }

    _load( as, _uuidb64 ) {
        as.error( 'NotImplemented' );
    }

    _loadExt( as, _ext_id ) {
        as.error( 'NotImplemented' );
    }

    _save( as, _info ) {
        as.error( 'NotImplemented' );
    }

    _update( as, _uuidb64, _stats ) {
        as.error( 'NotImplemented' );
    }

    _encrypt( as, _uuidb64, _info ) {
    }

    _decrypt( as, _uuidb64, _info ) {
    }
}

module.exports = Storage;
