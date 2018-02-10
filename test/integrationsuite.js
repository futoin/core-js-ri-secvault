'use strict';

const expect = require( 'chai' ).expect;

const $as = require( 'futoin-asyncsteps' );
const Executor = require( 'futoin-executor/Executor' );
//const CachedStorage = require( '../lib/storage/CachedStorage' );

const STORAGE_PASSWORD = 'e3b694af320229f9b464a358eae063a8';

module.exports = function( describe, it, vars ) {
    beforeEach( 'common', function() {
        vars.as = $as();
    } );


    before( 'storage open', function( done ) {
        require( '../lib/main' );
        const as = $as();
        vars.storage.setStorageSecret( as, Buffer.from( STORAGE_PASSWORD, 'hex' ) );
        as.add( ( as ) => done() );
        as.execute();
    } );
    /*
    beforeEach( 'common', function() {
        ccm = vars.ccm;
        as = vars.as;
        executor = vars.executor = new Executor( ccm );

        executor.on( 'notExpected', function() {
            console.dir( arguments );

            if ( arguments[3] ) {
                for ( var f of arguments[3] ) {
                    console.log( '================================' );
                    console.log( f.toString() );
                }
            }
        } );

        as.add(
            ( as ) => {
                ccm.registerEventServices( as, executor );
            },
            ( as, err ) => {
                console.log( err );
                console.log( as.state.error_info );
                console.log( as.state.last_exception );
            }
        );
    } );
    */

    describe( 'Storage', function() {
        require( './storage_suite' )( describe, it, vars, vars.storage );
    } );
    /*
    describe( 'CachedStorage', function() {
        require( './storage_suite' )( describe, it, vars );
    } );
    */
};
