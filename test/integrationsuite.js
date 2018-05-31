'use strict';

const expect = require( 'chai' ).expect;

const $as = require( 'futoin-asyncsteps' );
const CachedStorageWrapper = require( '../lib/storage/CachedStorageWrapper' );

module.exports = function( describe, it, vars ) {
    require( '../lib/main' );
    vars.STORAGE_PASSWORD = 'e3b694af320229f9b464a358eae063a8';

    beforeEach( 'common', function() {
        vars.as = $as();
    } );

    describe( 'Storage', function() {
        before( function() {
            vars.storage = vars.createStorage();
            vars.storageTwin = vars.createStorage();
        } );
        describe( 'Low Level', function() {
            require( './storage_suite' )( describe, it, vars, 'storage' );
        } );
        require( './service_suite' )( describe, it, vars, 'storage' );
    } );

    describe( 'CachedStorageWrapper', function() {
        before( function() {
            vars.cachedStorage = new CachedStorageWrapper(
                vars.ccm,
                vars.storage,
                {
                    syncDelayMs: 100,
                    evtpushExecutor: vars.evtApp.executor(),
                }
            );
            vars.cachedStorage.on( 'workerError', ( ...args ) => {
                console.log( ...args );
            } );

            vars.cachedStorageTwin = new CachedStorageWrapper(
                vars.ccm,
                vars.storage,
                {
                    syncDelayMs: 100,
                    evtpushExecutor: vars.evtApp.executor(),
                }
            );
            vars.cachedStorageTwin.on( 'workerError', ( ...args ) => {
                console.log( ...args );
            } );
        } );
        describe( 'Low Level', function() {
            require( './storage_suite' )( describe, it, vars, 'cachedStorage' );
        } );
        require( './service_suite' )( describe, it, vars, 'cachedStorage' );
    } );
};
