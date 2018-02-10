'use strict';

const child_process = require( 'child_process' );
const $as = require( 'futoin-asyncsteps' );
const DBAutoConfig = require( 'futoin-database/AutoConfig' );
const integration_suite = require( './integrationsuite' );

const AdvancedCCM = require( 'futoin-invoker/AdvancedCCM' );
const SQLStorage = require( '../lib/storage/SQLStorage' );

const DB_PORT = process.env.MYSQL_PORT || '3309';

describe( 'MySQL', function() {
    before( function( done ) {
        this.timeout( 30e3 );
        const ccm = new AdvancedCCM();

        $as().add(
            ( as ) => {
                DBAutoConfig( as, ccm, null, {
                    DB_TYPE: 'mysql',
                    DB_HOST: '127.0.0.1',
                    DB_PORT: DB_PORT,
                    DB_USER: 'ftntest',
                } );
                as.add( ( as ) => {
                    ccm.db().query( as, 'DROP DATABASE IF EXISTS secvault' );
                    ccm.db().query( as, 'CREATE DATABASE secvault' );
                    ccm.db().query( as, 'SET GLOBAL innodb_flush_log_at_trx_commit=0' );
                    ccm.db().query( as, 'SET GLOBAL sync_binlog=0' );
                } );
                as.add( ( as ) => {
                    let res;

                    res = child_process.spawnSync(
                        'cid',
                        [
                            'tool', 'exec', 'flyway', '--',
                            'migrate',
                            `-url=jdbc:mysql://127.0.0.1:${DB_PORT}/secvault`,
                            '-user=ftntest',
                            `-locations=filesystem:${__dirname}/../sql/mysql`,
                        ]
                    );

                    if ( res.status ) {
                        console.log( res.stderr.toString() );
                        as.error( 'Fail' );
                    }

                    ccm.close();
                } );
            },
            ( as, err ) => {
                console.log( err );
                console.log( as.state.error_info );
                done( as.state.last_exception || 'Fail' );
            }
        ).add( ( as ) => done() )
            .execute();
    } );

    const ccm = new AdvancedCCM();
    const vars = {
        as: null,
        ccm,
        storage: new SQLStorage( ccm ),
    };

    before( 'specific', function( done ) {
        $as()
            .add(
                ( as ) => {
                    DBAutoConfig( as, ccm, {
                        secvault: {},
                    }, {
                        DB_SECVAULT_TYPE: 'mysql',
                        DB_SECVAULT_HOST: '127.0.0.1',
                        DB_SECVAULT_PORT: DB_PORT,
                        DB_SECVAULT_USER: 'ftntest',
                        DB_SECVAULT_DB: 'secvault',
                    } );
                },
                ( as, err ) => {
                    console.log( err );
                    console.log( as.state.error_info );
                    done( as.state.last_exception || 'Fail' );
                }
            )
            .add( ( as ) => done() )
            .execute();
    } );

    after( 'specific', function() {
        ccm.close();
    } );

    integration_suite( describe, it, vars );
} );
