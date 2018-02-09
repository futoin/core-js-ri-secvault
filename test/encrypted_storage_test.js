'use strict';

const expect = require( 'chai' ).expect;
const $as = require( 'futoin-asyncsteps' );

const { VaultPlugin } = require( '../lib/main' );
const EncryptedStorage = require( '../lib/storage/EncryptedStorage' );
const KeyInfo = require( '../lib/storage/KeyInfo' );

describe( 'EncryptedStorage', function() {
    let as;
    let estore;

    before( 'EncryptedStorage', function() {
        estore = new EncryptedStorage();
    } );

    beforeEach( 'EncryptedStorage', function() {
        as = $as();
    } );

    after( 'EncryptedStorage', function() {
        estore = null;
        as = null;
    } );

    it( 'should setup direct KEK', function( done ) {
        as.add(
            ( as ) => {
                estore.setStorageSecret(
                    as,
                    Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' ),
                    { mode: 'CBC' },
                    null
                );
                expect( estore._enc_plugin ).to.be.ok;
                expect( estore._cipher_opts ).to.eql( {
                    type: 'AES',
                    bits: 256,
                    mode: 'CBC',
                    aad: estore._cipher_opts.aad,
                } );
                expect( estore._cipher_opts.aad.toString() ).to.equal( 'SecVault' );
            },
            ( as, err ) => {
                console.log( `${err}: ${as.state.error_info}` );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );

    it( 'should setup password-based KEK', function( done ) {
        as.add(
            ( as ) => {
                estore.setStorageSecret( as, 'password' );
                expect( estore._enc_plugin ).to.be.ok;
                expect( estore._cipher_opts ).to.eql( {
                    type: 'AES',
                    bits: 256,
                    mode: 'GCM',
                    aad: estore._cipher_opts.aad,
                } );
            },
            ( as, err ) => {
                console.log( `${err}: ${as.state.error_info}` );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );

    it( 'should encrypt and decrypt', function( done ) {
        as.add(
            ( as ) => {
                const keys = {
                    '1234567890123456789012': 'abcd',
                    abcdefABCD123456789012: 'abcd',
                    abcdefABCD123456789013: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                };
                let prev = new KeyInfo( { data: Buffer.alloc( 0 ) } );

                estore.setStorageSecret( as, 'password' );

                for ( let id in keys ) {
                    const raw = Buffer.from( keys[ id ] );
                    const ki = new KeyInfo( { raw } );

                    as.add( ( as ) => estore._encrypt( as, id, ki ) );
                    as.add( ( as ) => {
                        expect( ki.data ).to.be.not.equal( prev.data );
                        prev = ki;

                        ki.raw = null;
                        estore._decrypt( as, id, ki );
                    } );
                    as.add( ( as ) => {
                        expect( ki.raw.equals( raw ) ).to.be.true;
                    } );
                }
            },
            ( as, err ) => {
                console.log( `${err}: ${as.state.error_info}` );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );

    it( 'should detect locked storage', function( done ) {
        as.add(
            ( as ) => {
                estore.setStorageSecret( as, 'password' );
                as.add( ( as ) => estore.setStorageSecret( as, null ) );

                const id = 'abcdefABCD123456789012';
                const raw = Buffer.from( id );
                const ki = new KeyInfo( { raw, data: raw } );

                as.add(
                    ( as ) => {
                        estore._encrypt( as, id, ki );
                        as.add( ( as ) => as.error( 'Fail' ) );
                    },
                    ( as, err ) => {
                        if ( err === 'LockedStorage' ) {
                            as.success();
                        }
                    }
                );

                as.add(
                    ( as ) => {
                        estore._decrypt( as, id, ki );
                        as.add( ( as ) => as.error( 'Fail' ) );
                    },
                    ( as, err ) => {
                        if ( err === 'LockedStorage' ) {
                            as.success();
                        }
                    }
                );
            },
            ( as, err ) => {
                console.log( `${err}: ${as.state.error_info}` );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );
} );
