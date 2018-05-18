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

const EncryptedStorage = require( './EncryptedStorage' );
const KeyInfo = require( './KeyInfo' );

/**
 * SQL secret storage
 */
class SQLStorage extends EncryptedStorage {
    /**
     * C-tor
     *
     * @param {AdvancedCCM} ccm - CCM instance with registered 'secvault' DB
     * @param {object} options - options
     * @param {string} options.key_table=enc_keys - name of encrypted key table
     */
    constructor( ccm, options={} ) {
        super();
        this._ccm = ccm;
        this._key_table = options.key_table || 'enc_keys';
    }

    _db() {
        return this._ccm.db( 'secvault' );
    }

    remove( as, uuidb64 ) {
        this._db()
            .delete( this._key_table )
            .where( 'uuidb64', uuidb64 )
            .execute( as );
        as.successStep();
    }

    list( as, prefix=null ) {
        const q = this._db().select( this._key_table );
        q.get( 'uuidb64' );

        if ( prefix ) {
            q.where( `ext_id LIKE`, `${prefix}%` );
        }

        q.execute( as );

        as.add( ( as, { rows } ) => {
            as.success( rows.map( ( v ) => v[0] ) );
        } );
    }

    _loadCommon( as, field, value ) {
        this._db()
            .select( this._key_table )
            .where( field, value )
            .executeAssoc( as );

        as.add( ( as, rows ) => {
            if ( !rows.length ) {
                as.error( 'UnknownKeyID', `${field}:${value}` );
            }

            const r = rows[0];
            delete r._id;

            for ( let k in r ) {
                if ( k.startsWith( 'u_' ) ) {
                    r[k] = r[k] === 'Y';
                } else if ( k.startsWith( 'stat_' ) ) {
                    r[k] = parseInt( r[k] );
                }
            }

            r.params = JSON.parse( r.params );

            const ki = new KeyInfo( r );
            as.success( ki );
        } );
    }

    _load( as, uuidb64 ) {
        this._loadCommon( as, 'uuidb64', uuidb64 );
    }

    _loadExt( as, ext_id ) {
        this._loadCommon( as, 'ext_id', ext_id );
    }

    _save( as, info ) {
        const to_save = Object.assign( {}, info );
        delete to_save.raw;
        to_save.params = JSON.stringify( to_save.params || {} );

        for ( let k in to_save ) {
            if ( k.startsWith( 'u_' ) ) {
                to_save[k] = to_save[k] ? 'Y' : 'N';
            } else if ( to_save[k] === null ) {
                delete to_save[k];
            }
        }

        const db = this._db();
        to_save.created = db.helpers().now();

        db
            .insert( this._key_table )
            .set( to_save )
            .execute( as );
        as.successStep();
    }

    _update( as, uuidb64, stats ) {
        const db = this._db();
        const uq = db.update( this._key_table );
        let have_data = false;

        for ( let s in stats ) {
            const v = stats[s];
            uq.set( s, uq.expr( `${s} + ${uq.escape( v )}` ) );
            have_data = have_data || !!v;
        }

        if ( have_data ) {
            uq.where( 'uuidb64', uuidb64 );
            uq.execute( as );
        }

        as.successStep();
    }
}

module.exports = SQLStorage;
