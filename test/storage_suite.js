'use strict';

const expect = require( 'chai' ).expect;
const $as = require( 'futoin-asyncsteps' );
const UUIDTool = require( 'futoin-uuid' );
const crypto = require( 'crypto' );

const KeyInfo = require( '../lib/storage/KeyInfo' );

module.exports = function( describe, it, vars, storage ) {
    let as;

    beforeEach( 'storage', function() {
        as = vars.as;
    } );

    const uuidb64 = UUIDTool.genB64();
    const ext_id = `ext_${uuidb64}`;
    const key_info = Object.freeze( {
        uuidb64,
        raw : crypto.randomBytes( 16 ),
        ext_id,
        u_sign: true,
        type: 'AES',
        params: { bits: 128 },
    } );

    it ( 'should not find key by ID', function( done ) {
        as.add(
            ( as ) => {
                storage.load( as, uuidb64 );
                as.add( ( as ) => as.error( 'Fail' ) );
            },
            ( as, err ) => {
                if ( err === 'UnknownKeyID' ) {
                    done();
                } else {
                    console.log( as.state.error_info );
                    done( as.state.last_exception || 'Fail' );
                }
            }
        );
        as.execute();
    } );

    it ( 'should not find key by ext ID', function( done ) {
        as.add(
            ( as ) => {
                storage.loadExt( as, ext_id );
                as.add( ( as ) => as.error( 'Fail' ) );
            },
            ( as, err ) => {
                if ( err === 'UnknownKeyID' ) {
                    done();
                } else {
                    console.log( as.state.error_info );
                    done( as.state.last_exception || 'Fail' );
                }
            }
        );
        as.execute();
    } );

    it ( 'should save new key', function( done ) {
        as.add(
            ( as ) => {
                storage.save( as, new KeyInfo( key_info ) );
            },
            ( as, err ) => {
                console.log( as.state.error_info );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );

    it ( 'should detect duplicate on save', function( done ) {
        as.add(
            ( as ) => {
                storage.save( as, new KeyInfo( key_info ) );
                as.add( ( as ) => as.error( 'Fail' ) );
            },
            ( as, err ) => {
                if ( err === 'Duplicate' ) {
                    done();
                } else {
                    console.log( as.state.error_info );
                    done( as.state.last_exception || 'Fail' );
                }
            }
        );
        as.execute();
    } );

    it ( 'should save another key', function( done ) {
        as.add(
            ( as ) => {
                const other_id = UUIDTool.genB64();
                storage.save( as, new KeyInfo( Object.assign(
                    {},
                    key_info,
                    {
                        uuidb64: other_id,
                        ext_id: `ext_${other_id}`,
                    }
                ) ) );
            },
            ( as, err ) => {
                console.log( as.state.error_info );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );

    it ( 'should load the key by ID', function( done ) {
        as.add(
            ( as ) => {
                storage.load( as, uuidb64 );
                as.add( ( as, ki ) => {
                    expect( ki ).to.eql( Object.assign(
                        {},
                        key_info,
                        {
                            data: ki.data,
                            created: ki.created,
                            u_encrypt: false,
                            u_sign: true,
                            u_derive: false,
                            u_shared: false,
                            u_temp: false,
                            stat_times: 0,
                            stat_bytes: 0,
                            stat_failures: 0,
                        }
                    ) );
                } );
            },
            ( as, err ) => {
                console.log( as.state.error_info );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );

    it ( 'should load the key by ext ID', function( done ) {
        as.add(
            ( as ) => {
                storage.loadExt( as, ext_id );
                as.add( ( as, ki ) => {
                    expect( ki ).to.eql( Object.assign(
                        {},
                        key_info,
                        {
                            data: ki.data,
                            created: ki.created,
                            u_encrypt: false,
                            u_sign: true,
                            u_derive: false,
                            u_shared: false,
                            u_temp: false,
                            stat_times: 0,
                            stat_bytes: 0,
                            stat_failures: 0,
                        }
                    ) );
                } );
            },
            ( as, err ) => {
                console.log( as.state.error_info );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );

    it ( 'should update stats', function( done ) {
        as.add(
            ( as ) => {
                storage.updateUsage( as, uuidb64, {
                    times : 123,
                    bytes : 234,
                    failures : 345,
                } );
                storage.load( as, uuidb64 );
                as.add( ( as, ki ) => {
                    expect( ki.stat_times ).to.equal( 123 );
                    expect( ki.stat_bytes ).to.equal( 234 );
                    expect( ki.stat_failures ).to.equal( 345 );
                } );

                storage.updateUsage( as, uuidb64, {} );
                storage.updateUsage( as, uuidb64, {
                    bytes: 1000000000000,
                } );

                storage.load( as, uuidb64 );
                as.add( ( as, ki ) => {
                    expect( ki.stat_times ).to.equal( 123 );
                    expect( ki.stat_bytes ).to.equal( 1000000000234 );
                    expect( ki.stat_failures ).to.equal( 345 );
                } );
            },
            ( as, err ) => {
                console.log( as.state.error_info );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );

    it ( 'should detect invalid stats', function( done ) {
        as.add(
            ( as ) => {
                storage.updateUsage( as, uuidb64, {
                    times : 123,
                    bytes : 234,
                    failures : 345,
                    unknown: 2,
                } );
                as.add( ( as ) => as.error( 'Fail' ) );
            },
            ( as, err ) => {
                if ( err === 'InvalidArgument' ) {
                    as.success();
                } else {
                    console.log( as.state.error_info );
                    done( as.state.last_exception || 'Fail' );
                }
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );

    it ( 'should list the key ID', function( done ) {
        as.add(
            ( as ) => {
                storage.list( as );
                as.add( ( as, list ) => {
                    expect( list ).to.include( uuidb64 );
                } );
            },
            ( as, err ) => {
                console.log( as.state.error_info );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );

    it ( 'should remove the key', function( done ) {
        as.add(
            ( as ) => {
                storage.remove( as, uuidb64 );
                storage.list( as );
                as.add( ( as, list ) => {
                    expect( list ).not.to.include( uuidb64 );
                } );
            },
            ( as, err ) => {
                console.log( as.state.error_info );
                done( as.state.last_exception || 'Fail' );
            }
        );
        as.add( ( as ) => done() );
        as.execute();
    } );
};
