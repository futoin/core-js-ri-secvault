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

const DO_CHECK = ( process.env.NODE_ENV !== 'production' );

/**
 * Secret storage base
 */
class Storage {
    load( as, uuidb64, decrypt=true ) {
        this._load( as, uuidb64 );

        if ( decrypt ) {
            as.add( ( as, info ) => {
                this._decrypt( as, info );
                as.successStep( info );
            } );
        }
    }

    loadExt( as, ext_id, decrypt=true ) {
        this._loadExt( as, ext_id );

        if ( decrypt ) {
            as.add( ( as, info ) => {
                this._decrypt( as, info );
                as.successStep( info );
            } );
        }
    }

    save( as, info ) {
        this._encrypt( as, info );
        as.add( ( as ) => this._save( as, info ) );
        as.add( ( as ) => as.success( info ) ); // ensure info is returned
    }

    updateUsage( as, uuidb64, stats ) {
        if ( DO_CHECK ) {
            for ( let k in stats ) {
                const v = stats[k];

                switch ( k ) {
                case 'times':
                case 'bytes':
                case 'failures':
                    if ( ( parseInt( v, 10 ) !== v ) || ( v < 0 ) ) {
                        as.error( 'InvalidArgument', `Invalid stats value "${k}": "${v}"` );
                    }

                    break;

                default:
                    as.error( 'InvalidArgument', `Invalid stats name: "${k}"` );
                }
            }
        }

        this._update(
            as,
            uuidb64,
            stats
        );
    }

    remove( as, _uuidb64 ) {
        as.error( 'NotImplemented' );
    }

    list( as, _prefix=null ) {
        as.error( 'NotImplemented' );
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

    _encrypt( as, _info ) {
    }

    _decrypt( as, _info ) {
    }
}

module.exports = Storage;
