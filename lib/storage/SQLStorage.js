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
    constructor( ccm, { key_table='enc_keys' } = {} ) {
        super();
        this._ccm = ccm;
        this._key_table = key_table;
        this._db = ccm.db( 'secvault' );
        this._evt = ccm.iface( '#secvault.evtgen' );
    }

    remove( as, uuidb64 ) {
        const xfer = this._db.newXfer();
        xfer.delete( this._key_table, { affected: 1 } )
            .where( 'uuidb64', uuidb64 );
        this._evt.addXferEvent( xfer, 'SV_DEL', { id: uuidb64 } );
        xfer.execute( as );
        as.successStep();
    }

    list( as, prefix=null ) {
        const q = this._db.select( this._key_table );
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
        this._db
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
        const db = this._db;
        const xfer = db.newXfer();
        const { uuidb64, ext_id, type } = info;

        // ---
        const iq = xfer.insert( this._key_table, { affected: 1 } );
        iq.set( 'uuidb64', uuidb64 );
        iq.set( 'ext_id', ext_id );
        iq.set( 'type', type );
        iq.set( 'params', JSON.stringify( info.params || {} ) );
        iq.set( 'data', info.data );
        iq.set( 'u_encrypt', info.u_encrypt ? 'Y' : 'N' );
        iq.set( 'u_sign', info.u_sign ? 'Y' : 'N' );
        iq.set( 'u_derive', info.u_derive ? 'Y' : 'N' );
        iq.set( 'u_shared', info.u_shared ? 'Y' : 'N' );
        iq.set( 'u_temp', info.u_temp ? 'Y' : 'N' );
        iq.set( 'created', db.helpers().now() );

        // ---
        this._evt.addXferEvent( xfer, 'SV_DEL', {
            id: uuidb64,
            ext_id,
            type,
        } );

        // ---
        xfer.execute( as );
        as.successStep();
    }

    _update( as, uuidb64, stats ) {
        const xfer = this._db.newXfer();

        //---
        const uq = xfer.update( this._key_table, { affected: 1 } );
        const evt_data = { id: uuidb64 };
        let have_data = false;

        for ( let k in stats ) {
            const v = stats[k];

            if ( v ) {
                const qk = `stat_${k}`;
                uq.set( qk, uq.expr( `${qk} + ${uq.escape( v )}` ) );
                evt_data[ k ] = v;
                have_data = true;
            }
        }

        if ( !have_data ) {
            return;
        }

        uq.where( 'uuidb64', uuidb64 );
        //---
        this._evt.addXferEvent( xfer, 'SV_UPD', evt_data );

        //---
        as.add(
            ( as ) => {
                xfer.execute( as );
                as.successStep();
            },
            ( as, err ) => {
                if ( err === 'XferCondition' ) {
                    as.error( 'UnknownKeyID' );
                }
            }
        );
    }
}

module.exports = SQLStorage;
