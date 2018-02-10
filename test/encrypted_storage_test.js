'use strict';

const expect = require( 'chai' ).expect;
const $as = require( 'futoin-asyncsteps' );

const { VaultPlugin } = require( '../lib/main' );
const Storage = require( '../lib/storage/Storage' );
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

                for ( let uuidb64 in keys ) {
                    const raw = Buffer.from( keys[ uuidb64 ] );
                    const ki = new KeyInfo( { uuidb64, raw } );

                    as.add( ( as ) => estore._encrypt( as, ki ) );
                    as.add( ( as ) => {
                        expect( ki.data ).to.be.not.equal( prev.data );
                        prev = ki;

                        ki.raw = null;
                        estore._decrypt( as, ki );
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

                const uuidb64 = 'abcdefABCD123456789012';
                const raw = Buffer.from( uuidb64 );
                const ki = new KeyInfo( { uuidb64, raw, data: raw } );

                as.add(
                    ( as ) => {
                        estore._encrypt( as, ki );
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
                        estore._decrypt( as, ki );
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

    it ( 'should increase coverage', function() {
        expect( KeyInfo.PROP_NAMES ).to.be.instanceof( Array );

        const storage = new Storage();
        const as = { error: ( err ) => {
            throw new Error( err );
        } };

        expect( () => storage.remove( as ) ).to.throw( 'NotImplemented' );
        expect( () => storage.list( as ) ).to.throw( 'NotImplemented' );
        expect( () => storage._load( as ) ).to.throw( 'NotImplemented' );
        expect( () => storage._loadExt( as ) ).to.throw( 'NotImplemented' );
        expect( () => storage._save( as ) ).to.throw( 'NotImplemented' );
        expect( () => storage._update( as ) ).to.throw( 'NotImplemented' );

        storage._encrypt();
        storage._decrypt();
    } );
} );
