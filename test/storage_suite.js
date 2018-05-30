'use strict';

const expect = require( 'chai' ).expect;
const $as = require( 'futoin-asyncsteps' );
const $as_test = require( 'futoin-asyncsteps/testcase' );
const UUIDTool = require( 'futoin-uuid' );
const crypto = require( 'crypto' );

const KeyInfo = require( '../lib/storage/KeyInfo' );

module.exports = function( describe, it, vars ) {
    let as;
    let storage;

    beforeEach( 'storage', function() {
        as = vars.as;
    } );

    before( 'storage', $as_test( as => {
        storage = vars.storage;
        storage.setStorageSecret( as, Buffer.from( vars.STORAGE_PASSWORD, 'hex' ) );
    } ) );

    after( 'storage', $as_test( as => {
        storage.setStorageSecret( as, null );
    } ) );

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

    it ( 'should not find key by ID', $as_test(
        ( as ) => {
            storage.load( as, uuidb64 );
        },
        ( as, err ) => {
            if ( err === 'UnknownKeyID' ) {
                as.success();
            }
        }
    ) );

    it ( 'should not find key by ext ID', $as_test(
        ( as ) => {
            storage.loadExt( as, ext_id );
        },
        ( as, err ) => {
            if ( err === 'UnknownKeyID' ) {
                as.success();
            }
        }
    ) );

    it ( 'should save new key', $as_test(
        ( as ) => {
            storage.save( as, new KeyInfo( key_info ) );
        }
    ) );

    it ( 'should detect duplicate on save', $as_test(
        ( as ) => {
            storage.save( as, new KeyInfo( key_info ) );
        },
        ( as, err ) => {
            if ( err === 'Duplicate' ) {
                as.success();
            }
        }
    ) );

    it ( 'should save another key', $as_test(
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
        }
    ) );

    it ( 'should load the key by ID', $as_test(
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
        }
    ) );

    it ( 'should load the key by ext ID', $as_test(
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
        }
    ) );

    it ( 'should update stats', $as_test(
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
        }
    ) );

    it ( 'should detect invalid stats key', $as_test(
        ( as ) => {
            storage.updateUsage( as, uuidb64, {
                times : 123,
                bytes : 234,
                failures : 345,
                unknown: 2,
            } );
        },
        ( as, err ) => {
            expect( err ).equal( 'InvalidArgument' );
            expect( as.state.error_info ).equal( 'Invalid stats name: "unknown"' );
            as.success();
        }
    ) );

    it ( 'should detect invalid stats value', $as_test(
        ( as ) => {
            storage.updateUsage( as, uuidb64, {
                times : 123,
                bytes : 234.1,
                failures : 345,
            } );
        },
        ( as, err ) => {
            expect( err ).equal( 'InvalidArgument' );
            expect( as.state.error_info ).equal( 'Invalid stats value "bytes": "234.1"' );
            as.success();
        }
    ) );
    it ( 'should list the key ID', $as_test(
        ( as ) => {
            storage.list( as );
            as.add( ( as, list ) => {
                expect( list ).to.include( uuidb64 );
            } );
        }
    ) );

    it ( 'should remove the key', $as_test(
        ( as ) => {
            storage.remove( as, uuidb64 );
            storage.list( as );
            as.add( ( as, list ) => {
                expect( list ).not.to.include( uuidb64 );
            } );
        }
    ) );
};
