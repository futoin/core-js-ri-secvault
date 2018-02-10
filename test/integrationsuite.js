'use strict';

const expect = require( 'chai' ).expect;

const $as = require( 'futoin-asyncsteps' );
//const CachedStorage = require( '../lib/storage/CachedStorage' );

module.exports = function( describe, it, vars ) {
    require( '../lib/main' );
    vars.STORAGE_PASSWORD = 'e3b694af320229f9b464a358eae063a8';

    beforeEach( 'common', function() {
        vars.as = $as();
    } );

    describe( 'Storage', function() {
        describe( 'Low Level', function() {
            require( './storage_suite' )( describe, it, vars, vars.storage );
        } );
        require( './service_suite' )( describe, it, vars, vars.storage );
    } );
    /*
    describe( 'CachedStorage', function() {
        require( './storage_suite' )( describe, it, vars );
    } );
    */
};
