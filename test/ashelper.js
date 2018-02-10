'use strict';

const $as = require( 'futoin-asyncsteps' );

module.exports = function( test_case, error_handler ) {
    return function( done ) {
        const as = $as();
        as.add(
            ( as ) => {
                as.add(
                    ( as ) => test_case.call( this, as ),
                    error_handler
                );
            },
            ( as, err ) => {
                console.log( `${err}: ${as.state.error_info}` );
                done( as.state.last_exception || new Error( 'Generic Fail' ) );
            }
        );
        as.add( as => done() );
        as.execute();
    };
};
