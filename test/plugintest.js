'use strict';

const expect = require( 'chai' ).expect;
const $as = require( 'futoin-asyncsteps' );

const { VaultPlugin } = require( '../lib/main' );

describe( 'Plugins', function() {
    let as;

    beforeEach( 'Plugins', function() {
        as = $as();
    } );

    describe( 'PBKDF2', function() {
        // NOTE: test vectors from https://www.rfc-editor.org/rfc/rfc6070.txt

        it( 'test vector 1', function( done ) {
            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'PBKDF2' );
                    p.derive(
                        as,
                        'password',
                        20 * 8,
                        'SHA-1',
                        {
                            salt: 'salt',
                            rounds: 1,
                        }
                    );
                    as.add( ( as, key ) => {
                        expect( key.toString( 'hex' ) ).equal(
                            '0c60c80f961f0e71f3a9b524af6012062fe037a6' );
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

        it( 'test vector 5', function( done ) {
            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'PBKDF2' );
                    p.derive(
                        as,
                        'passwordPASSWORDpassword',
                        25 * 8,
                        'SHA-1',
                        {
                            salt: 'saltSALTsaltSALTsaltSALTsaltSALTsalt',
                            rounds: 4096,
                        }
                    );
                    as.add( ( as, key ) => {
                        expect( key.toString( 'hex' ) ).equal(
                            '3d2eec4fe41c849b80c8d83662c0e44a8b291a964cf2f07038' );
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
    } );

    describe( 'AES', function() {
        it( 'CBC with NIST test vector', function( done ) {
            as.add(
                ( as ) => {
                    // NOTE: test vectors from csrc.nist.gov/groups/STM/cavp/documents/aes/KAT_AES.zip

                    const p = VaultPlugin.getPlugin( 'AES' );
                    const key = Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' );
                    p.encrypt(
                        as,
                        key,
                        Buffer.from( '00000000000000000000000000000000', 'hex' ),
                        {
                            iv: Buffer.from( '00000000000000000000000000000000', 'hex' ),
                        }
                    );
                    as.add( ( as, edata ) => {
                        expect( edata.toString( 'hex' ) ).equal(
                            '6d251e6944b051e04eaa6fb4dbf78465881572c3a96a612c111055707bd7614e00000000000000000000000000000000' );
                        p.decrypt( as, key, edata );
                    } );
                    as.add( ( as, data ) => {
                        expect( data.toString( 'hex' ) ).equal(
                            '00000000000000000000000000000000' );
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

        it( 'CBC with random IV', function( done ) {
            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'AES' );
                    const key = Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' );
                    p.encrypt(
                        as,
                        key,
                        Buffer.from( '00000000000000000000000000000000', 'hex' )
                    );
                    as.add( ( as, edata ) => {
                        expect( edata.toString( 'hex' ) ).not.equal(
                            '6d251e6944b051e04eaa6fb4dbf78465881572c3a96a612c111055707bd7614e00000000000000000000000000000000' );
                        p.decrypt( as, key, edata );
                    } );
                    as.add( ( as, data ) => {
                        expect( data.toString( 'hex' ) ).equal(
                            '00000000000000000000000000000000' );
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

        it( 'GCM with forced IV', function( done ) {
            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'AES' );
                    const key = Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' );
                    p.encrypt(
                        as,
                        key,
                        Buffer.from( '00000000000000000000000000000000', 'hex' ),
                        {
                            mode: 'GCM',
                            iv: Buffer.from( '000000000000000000000000', 'hex' ),
                        }
                    );
                    as.add( ( as, edata ) => {
                        expect( edata.toString( 'hex' ) ).equal(
                            'e5cb25c8cc8eb8ba76a1d3c0b502c34700000000000000000000000077b36483499450ace7ac26a7ca897b2c' );
                        p.decrypt( as, key, edata, { mode: 'GCM' } );
                    } );
                    as.add( ( as, data ) => {
                        expect( data.toString( 'hex' ) ).equal(
                            '00000000000000000000000000000000' );
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

        it( 'GCM with random IV', function( done ) {
            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'AES' );
                    const key = Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' );
                    p.encrypt(
                        as,
                        key,
                        Buffer.from( '00000000000000000000000000000000', 'hex' ),
                        {
                            mode: 'GCM',
                        }
                    );
                    as.add( ( as, edata ) => {
                        expect( edata.toString( 'hex' ) ).not.equal(
                            'e5cb25c8cc8eb8ba76a1d3c0b502c34700000000000000000000000077b36483499450ace7ac26a7ca897b2c' );
                        p.decrypt( as, key, edata, { mode: 'GCM' } );
                    } );
                    as.add( ( as, data ) => {
                        expect( data.toString( 'hex' ) ).equal(
                            '00000000000000000000000000000000' );
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


        it( 'GCM with AAD', function( done ) {
            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'AES' );
                    const key = Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' );
                    const aad = Buffer.from( 'abcdef' );
                    p.encrypt(
                        as,
                        key,
                        Buffer.from( '00000000000000000000000000000000', 'hex' ),
                        {
                            mode: 'GCM',
                            aad,
                        }
                    );
                    as.add( ( as, edata ) => {
                        p.decrypt( as, key, edata, { mode: 'GCM', aad } );
                    } );
                    as.add( ( as, data ) => {
                        expect( data.toString( 'hex' ) ).equal(
                            '00000000000000000000000000000000' );
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
    } );
} );
