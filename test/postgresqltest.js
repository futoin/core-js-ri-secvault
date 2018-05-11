'use strict';

const child_process = require( 'child_process' );
const $as = require( 'futoin-asyncsteps' );
const DBAutoConfig = require( 'futoin-database/AutoConfig' );
const integration_suite = require( './integrationsuite' );

const AdvancedCCM = require( 'futoin-invoker/AdvancedCCM' );
const SQLStorage = require( '../lib/storage/SQLStorage' );

const DB_PORT = process.env.POSTGRESQL_PORT || '5435';

describe( 'PostgreSQL', function() {
    before( function( done ) {
        this.timeout( 30e3 );
        const ccm = new AdvancedCCM();

        $as().add(
            ( as ) => {
                DBAutoConfig( as, ccm, null, {
                    DB_TYPE: 'postgresql',
                    DB_HOST: '127.0.0.1',
                    DB_PORT: DB_PORT,
                    DB_USER: 'ftntest',
                    DB_PASS: 'test',
                    DB_DB: 'postgres',
                } );
                as.add( ( as ) => {
                    ccm.db().query( as, 'DROP DATABASE IF EXISTS secvault' );
                    ccm.db().query( as, 'CREATE DATABASE secvault' );
                } );
                as.add( ( as ) => {
                    const flyway_locations = [
                        `filesystem:${__dirname}/../sql/postgresql`,
                        `filesystem:${__dirname}/../node_modules/futoin-eventstream/sql/active/postgresql`,
                    ].join( ',' );

                    let res;

                    res = child_process.spawnSync(
                        'cid',
                        [
                            'tool', 'exec', 'flyway', '--',
                            'migrate',
                            `-url=jdbc:postgresql://127.0.0.1:${DB_PORT}/secvault`,
                            '-user=ftntest',
                            '-password=test',
                            `-locations=filesystem:${__dirname}/../sql/postgresql`,
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
                        DB_SECVAULT_TYPE: 'postgresql',
                        DB_SECVAULT_HOST: '127.0.0.1',
                        DB_SECVAULT_PORT: DB_PORT,
                        DB_SECVAULT_USER: 'ftntest',
                        DB_SECVAULT_DB: 'secvault',
                        DB_SECVAULT_PASS: 'test',
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
