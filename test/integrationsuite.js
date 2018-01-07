'use strict';

const expect = require( 'chai' ).expect;

const Executor = require( 'futoin-executor/Executor' );

module.exports = function( describe, it, vars ) {
    let as;
    let ccm;
    let executor;

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

    //require( './currency_suite' )( describe, it, vars );
};
