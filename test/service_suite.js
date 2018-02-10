'use strict';

const $as = require( 'futoin-asyncsteps' );
const $as_test = require( './ashelper' );
const Executor = require( 'futoin-executor/Executor' );

const KeyService = require( '../KeyService' );
const DataService = require( '../DataService' );
const KeyFace = require( '../KeyFace' );
const DataFace = require( '../DataFace' );

module.exports = function( describe, it, vars, storage ) {
    const ccm = vars.ccm;

    before( 'service', function( done ) {
        const executor = vars.executor = new Executor( ccm );

        executor.on( 'notExpected', function() {
            console.dir( arguments );

            if ( arguments[3] ) {
                for ( var f of arguments[3] ) {
                    console.log( '================================' );
                    console.log( f.toString() );
                }
            }
        } );

        $as_test( ( as ) => {
            KeyService.register( as, executor, storage );
            DataService.register( as, executor, storage );

            KeyFace.register( as, ccm, 'secvault.keys', executor );
            DataFace.register( as, ccm, 'secvault.data', executor );
        } )( done );
    } );

    after( 'service', function() {
        ccm.unRegister( 'secvault.keys' );
        ccm.unRegister( 'secvault.data' );
    } );

    describe( 'KeyService', function() {
        let key_face;

        before( function() {
            key_face = ccm.iface( 'secvault.keys' );
        } );

        const secret_key = Buffer.from( vars.STORAGE_PASSWORD, 'hex' );

        it ( 'should unlock', $as_test( ( as ) => {
            key_face.unlock( as, secret_key );
        } ) );

        it ( 'should lock', $as_test( ( as ) => {
            key_face.lock( as );

            key_face.unlock( as, secret_key );
        } ) );
    } );

    describe( 'DataService', function() {
        let data_face;

        before( function() {
            data_face = ccm.iface( 'secvault.data' );
        } );
    } );
};
