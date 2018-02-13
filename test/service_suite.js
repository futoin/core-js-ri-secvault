'use strict';

const $as = require( 'futoin-asyncsteps' );
const $as_test = require( 'futoin-asyncsteps/testcase' );
const Executor = require( 'futoin-executor/Executor' );
const UUIDTool = require( 'futoin-uuid' );
const expect = require( 'chai' ).expect;

const KeyService = require( '../KeyService' );
const DataService = require( '../DataService' );
const KeyFace = require( '../KeyFace' );
const DataFace = require( '../DataFace' );

require( 'futoin-invoker/SpecTools' ).on( 'error', function() {
    console.log( arguments );
} );

module.exports = function( describe, it, vars, storage ) {
    const ccm = vars.ccm;
    const run_id = UUIDTool.genB64();

    before( 'service', function( done ) {
        const executor = vars.executor = new Executor( ccm );

        executor.on( 'notExpected', function() {
            console.dir( arguments );

            /*if ( arguments[3] ) {
                for ( var f of arguments[3] ) {
                    console.log( '================================' );
                    console.log( f.toString() );
                }
            }*/
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

        it ( 'should detect invalid secret on unlock', $as_test(
            ( as ) => {
                key_face.unlock( as, Buffer.from( 'INVALID' ) );
            },
            ( as, err ) => {
                if ( err === 'InvalidSecret' ) {
                    as.success();
                }
            }
        ) );

        it ( 'should unlock', $as_test( ( as ) => {
            key_face.unlock( as, secret_key );
        } ) );

        // generate tests
        //=====================
        it ( 'should generate AES keys', $as_test( ( as ) => {
            key_face.generateKey(
                as,
                `aes128-${run_id}`,
                [ 'encrypt', 'sign' ],
                'AES',
                128
            );

            key_face.generateKey(
                as,
                `aes192-${run_id}`,
                [ 'derive', 'shared' ],
                'AES',
                192
            );

            key_face.generateKey(
                as,
                `aes256-${run_id}`,
                [ 'temp' ],
                'AES',
                { bits: 256 }
            );

            as.add( ( as, id ) => key_face.keyInfo( as, id ) );
            as.add( ( as, info ) => {
                expect( info.ext_id ).equal( `aes256-${run_id}` );
                expect( info.params.bits ).equal( 256 );
                expect( info.type ).equal( 'AES' );
                expect( info.usage ).to.be.eql( [ 'temp' ] );
                expect( info.used_times ).equal( 0 );
                expect( info.used_bytes ).equal( 0 );
                expect( info.sig_failures ).equal( 0 );
            } );
        } ) );

        it ( 'should generate RSA keys', $as_test( ( as ) => {
            key_face.generateKey(
                as,
                `rsa1024-${run_id}`,
                [ 'encrypt', 'sign' ],
                'RSA',
                1024
            );
        } ) );

        it ( 'should ensure key is generated in dup', $as_test( ( as ) => {
            const p = as.parallel();
            p.add( as => {
                key_face.generateKey(
                    as,
                    `aesdup-${run_id}`,
                    [],
                    'AES',
                    128
                );
                as.add( ( as, id ) => as.state.id1 = id );
            } );
            p.add( as => {
                key_face.generateKey(
                    as,
                    `aesdup-${run_id}`,
                    [],
                    'AES',
                    128
                );
                as.add( ( as, id ) => as.state.id2 = id );
            } );
            as.add( ( as, id ) => expect( as.state.id1 ).equal( as.state.id2 ) );
        } ) );

        it ( 'should fail on mismatch', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `rsa1024-${run_id}`,
                    [ 'encrypt', 'sign' ],
                    'RSA',
                    2048
                );
            },
            ( as, err ) => {
                if ( err === 'OrigMismatch' ) {
                    as.success();
                }
            }
        ) );

        it ( 'should fail on unsupported key', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `inv1-${run_id}`,
                    [ 'encrypt', 'sign' ],
                    'INV',
                    1
                );
            },
            ( as, err ) => {
                if ( err === 'UnsupportedType' ) {
                    as.success();
                }
            }
        ) );

        // inject tests
        //=====================
        it ( 'should inject keys', $as_test( ( as ) => {
            key_face.injectKey(
                as,
                `aes128inject-${run_id}`,
                [ 'shared' ],
                'AES',
                128,
                Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' )
            );
        } ) );

        it ( 'should fail inject on mismatch', $as_test(
            ( as ) => {
                key_face.injectKey(
                    as,
                    `aes128inject-${run_id}`,
                    [ 'shared' ],
                    'AES',
                    128,
                    Buffer.from( '10a58869d74be5a374cf867cfb473800', 'hex' )
                );
            },
            ( as, err ) => {
                if ( err === 'OrigMismatch' ) {
                    as.success();
                }
            }
        ) );

        it ( 'should fail inject on invalid key', $as_test(
            ( as ) => {
                key_face.injectKey(
                    as,
                    `aes128inject2-${run_id}`,
                    [ 'shared' ],
                    'AES',
                    128,
                    Buffer.from( '10a58869d74be5a374cf867cfb4738', 'hex' )
                );
            },
            ( as, err ) => {
                if ( err === 'InvalidKey' ) {
                    as.success();
                }
            }
        ) );

        // Inject encrypted
        //=====================
        it ( 'should inject encrypted key', $as_test( ( as ) => {
            key_face.injectKey(
                as,
                `aes128kek-${run_id}`,
                [ 'encrypt' ],
                'AES',
                128,
                Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' )
            );
            as.add( ( as, kek_id ) => {
                key_face.injectEncryptedKey(
                    as,
                    `aes128enckey-${run_id}`,
                    [ 'shared' ],
                    'AES',
                    128,
                    Buffer.from( '6d251e6944b051e04eaa6fb4dbf78465881572c3a96a612c111055707bd7614e00000000000000000000000000000000', 'hex' ),
                    kek_id,
                    'CBC'
                );
            } );
            as.add( ( as, id ) => {
                key_face.exposeKey( as, id );
                as.add( ( as, key ) => expect( key.toString( 'hex' ) ).equal( '00000000000000000000000000000000' ) );
            } );
        } ) );

        it ( 'should fail on invalid inject', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `rsa1024enc-${run_id}`,
                    [ 'encrypt' ],
                    'RSA',
                    1024
                );
                as.add( ( as, kek_id ) => {
                    key_face.injectEncryptedKey(
                        as,
                        `rsa1024enckey-${run_id}`,
                        [ 'shared' ],
                        'AES',
                        128,
                        Buffer.from( '6d251e6944b051e04eaa6fb4dbf78465881572c3a96a612c111055707bd7614e00000000000000000000000000000000', 'hex' ),
                        kek_id,
                        'CBC'
                    );
                } );
            },
            ( as, err ) => {
                if ( err.startsWith( 'InvalidKey' ) ) {
                    as.success();
                }
            }
        ) );

        //=====================
        it ( 'should list & wipe keys', $as_test( ( as ) => {
            key_face.generateKey(
                as,
                `aes128-${run_id}`,
                [ 'encrypt', 'sign' ],
                'AES',
                128
            );

            as.add( ( as, id ) => {
                key_face.listKeys( as );
                as.add( ( as, keys ) => expect( keys ).to.include( id ) );

                key_face.wipeKey( as, id );

                key_face.listKeys( as );
                as.add( ( as, keys ) => expect( keys ).not.to.include( id ) );
            } );
        } ) );

        //=====================
        it ( 'should derive keys', $as_test( ( as ) => {
            key_face.generateKey(
                as,
                `aes128bdk-${run_id}`,
                [ 'derive' ],
                'AES',
                128
            );

            as.add( ( as, id ) => {
                key_face.deriveKey(
                    as,
                    `aes128derived-${run_id}`,
                    [ 'encrypt', 'sign', 'temp' ],
                    'AES',
                    128,
                    id,
                    'HKDF',
                    'SHA-256',
                    Buffer.from( '12345678' ),
                    { info: 'INFO' }
                );
            } );
        } ) );

        it ( 'should check base for mismatch', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `aes128bdk2-${run_id}`,
                    [ 'derive' ],
                    'AES',
                    128
                );

                as.add( ( as, id ) => {
                    key_face.deriveKey(
                        as,
                        `aes128derived-${run_id}`,
                        [ 'encrypt', 'sign', 'temp' ],
                        'AES',
                        128,
                        id,
                        'HKDF',
                        'SHA-256',
                        Buffer.from( '12345678' ),
                        { info: 'INFO' }
                    );
                } );
            },
            ( as, err ) => {
                if ( err === 'OrigMismatch' ) {
                    as.success();
                }
            }
        ) );

        it ( 'should check "derive" bit', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `aes128nonbdk-${run_id}`,
                    [ 'encrypt' ],
                    'AES',
                    128
                );

                as.add( ( as, id ) => {
                    key_face.deriveKey(
                        as,
                        `aes128derivedfail-${run_id}`,
                        [ 'encrypt', 'sign', 'temp' ],
                        'AES',
                        128,
                        id,
                        'HKDF',
                        'SHA-256',
                        Buffer.from( '12345678' ),
                        { info: 'INFO' }
                    );
                } );
            },
            ( as, err ) => {
                if ( err === 'NotApplicable' ) {
                    as.success();
                }
            }
        ) );

        it ( 'should fail on invalid KDF', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `aes128bdk-${run_id}`,
                    [ 'derive' ],
                    'AES',
                    128
                );

                as.add( ( as, id ) => {
                    key_face.deriveKey(
                        as,
                        `aes128invkdf-${run_id}`,
                        [ 'encrypt', 'sign', 'temp' ],
                        'AES',
                        128,
                        id,
                        'HKDFabc',
                        'SHA-256',
                        Buffer.from( '12345678' ),
                        { info: 'INFO' }
                    );
                } );
            },
            ( as, err ) => {
                if ( err === 'UnsupportedDerivation' ) {
                    as.success();
                }
            }
        ) );


        //=====================
        it ( 'should expose encrypted key', $as_test( ( as ) => {
            key_face.extKeyInfo( as, `aes128kek-${run_id}` );

            as.add( ( as, kek_info ) => {
                key_face.generateKey(
                    as,
                    `aes128toexp-${run_id}`,
                    [ 'shared' ],
                    'AES',
                    128
                );

                as.add( ( as, id ) => {
                    key_face.encryptedKey(
                        as,
                        id,
                        kek_info.id,
                        'CBC'
                    );
                } );
            } );
        } ) );

        it ( 'should expose encrypted key (RSA)', $as_test( ( as ) => {
            key_face.generateKey(
                as,
                `rsa1024kek-${run_id}`,
                [ 'encrypt', 'sign' ],
                'RSA',
                1024
            );

            as.add( ( as, id ) => {
                key_face.publicKey(
                    as,
                    id
                );
            } );

            as.add( ( as, kek ) => {
                key_face.generateKey(
                    as,
                    `aes128toexp-${run_id}`,
                    [ 'shared' ],
                    'AES',
                    128
                );

                as.add( ( as, id ) => {
                    key_face.pubEncryptedKey(
                        as,
                        id,
                        kek
                    );
                } );
            } );
        } ) );

        it ( 'should check for "shared" bit', $as_test(
            ( as ) => {
                key_face.extKeyInfo( as, `aes128kek-${run_id}` );

                as.add( ( as, kek_info ) => {
                    key_face.generateKey(
                        as,
                        `aes128nottoexp-${run_id}`,
                        [ 'encrypt' ],
                        'AES',
                        128
                    );

                    as.add( ( as, id ) => {
                        key_face.encryptedKey(
                            as,
                            id,
                            kek_info.id,
                            'CBC'
                        );
                    } );
                } );
            },
            ( as, err ) => {
                if ( err === 'NotApplicable' ) {
                    as.success();
                }
            }
        ) );

        it ( 'should check for "encrypt" bit', $as_test(
            ( as ) => {
                key_face.extKeyInfo( as, `aes128toexp-${run_id}` );

                as.add( ( as, { id } ) => {
                    key_face.encryptedKey(
                        as,
                        id,
                        id,
                        'CBC'
                    );
                } );
            },
            ( as, err ) => {
                if ( err === 'NotApplicable' ) {
                    as.success();
                }
            }
        ) );

        it ( 'should forbid public key for symmetric keys', $as_test(
            ( as ) => {
                key_face.extKeyInfo( as, `aes128kek-${run_id}` );

                as.add( ( as, { id } ) => {
                    key_face.publicKey(
                        as,
                        id
                    );
                } );
            },
            ( as, err ) => {
                if ( err === 'NotApplicable' ) {
                    as.success();
                }
            }
        ) );

        it ( 'should forbid public key encryption for symmetric keys', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `aes128toexp-${run_id}`,
                    [ 'shared' ],
                    'AES',
                    128
                );

                as.add( ( as, id ) => {
                    key_face.pubEncryptedKey(
                        as,
                        id,
                        {
                            type: 'AES',
                            data: Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' ),
                        }
                    );
                } );
            },
            ( as, err ) => {
                if ( err === 'NotApplicable' ) {
                    as.success();
                }
            }
        ) );

        //=====================
        it ( 'should lock', $as_test( ( as ) => {
            as.add( ( as ) => expect( storage.isLocked() ).to.be.false );

            key_face.lock( as );

            as.add( ( as ) => expect( storage.isLocked() ).to.be.true );

            key_face.unlock( as, secret_key );

            as.add( ( as ) => expect( storage.isLocked() ).to.be.false );
        } ) );
    } );

    describe( 'DataService', function() {
        let data_face;
        let key_face;

        before( function() {
            key_face = ccm.iface( 'secvault.keys' );
            data_face = ccm.iface( 'secvault.data' );
        } );

        it ( 'encrypt & decrypt AES', $as_test( ( as ) => {
            key_face.generateKey(
                as,
                `aes192enc-${run_id}`,
                [ 'encrypt' ],
                'AES',
                192
            );

            as.add( ( as, id ) => {
                const data = Buffer.from( 'Some Test Data' );
                const aad = Buffer.from( 'Some Auth' );
                data_face.encrypt( as, id, data, 'GCM', null, aad );

                as.add( ( as, edata ) => {
                    data_face.decrypt( as, id, edata, 'GCM', aad );
                } );

                as.add( ( as, res ) => {
                    expect( res.equals( data ) ).to.be.true;
                } );
            } );
        } ) );

        it ( 'encrypt & decrypt RSA', $as_test( ( as ) => {
            key_face.generateKey(
                as,
                `rsa1024enc-${run_id}`,
                [ 'encrypt' ],
                'RSA',
                1024
            );

            as.add( ( as, id ) => {
                const data = Buffer.from( 'Some Test Data' );
                data_face.encrypt( as, id, data );

                as.add( ( as, edata ) => {
                    data_face.decrypt( as, id, edata );
                } );

                as.add( ( as, res ) => {
                    expect( res.equals( data ) ).to.be.true;
                } );
            } );
        } ) );

        it ( 'sign & verify RSA', $as_test( ( as ) => {
            key_face.generateKey(
                as,
                `rsa1024sign-${run_id}`,
                [ 'sign' ],
                'RSA',
                1024
            );

            as.add( ( as, id ) => {
                const data = Buffer.from( 'Some Test Data' );
                data_face.sign( as, id, data, 'SHA-256' );

                as.add( ( as, sig ) => {
                    data_face.verify( as, id, data, sig, 'SHA-256' );
                } );

                as.add( ( as, res ) => {
                    expect( res ).to.be.true;
                } );
            } );
        } ) );

        it ( 'encrypt & fail decrypt RSA', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `rsa1024enc-${run_id}`,
                    [ 'encrypt' ],
                    'RSA',
                    1024
                );

                as.add( ( as, id ) => {
                    const data = Buffer.from( 'Some Test Data' );
                    data_face.encrypt( as, id, data );

                    as.add( ( as, edata ) => {
                        data_face.decrypt( as, id, edata.slice( 1 ) );
                    } );
                } );
            },
            ( as, err ) => {
                if ( err === 'InvalidData' ) {
                    as.success();
                }
            }
        ) );

        it ( 'sign & verify RSA fail', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `rsa1024sign-${run_id}`,
                    [ 'sign' ],
                    'RSA',
                    1024
                );

                as.add( ( as, id ) => {
                    const data = Buffer.from( 'Some Test Data' );
                    data_face.verify( as, id, data, data, 'SHA-256' );
                } );
            },
            ( as, err ) => {
                if ( err === 'InvalidSignature' ) {
                    as.success();
                }
            }
        ) );

        it ( 'obey "encrypt" bit on encrypt', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `aes192fakeenc-${run_id}`,
                    [ 'sign' ],
                    'AES',
                    192
                );

                as.add( ( as, id ) => {
                    const data = Buffer.from( 'Some Test Data' );
                    data_face.encrypt( as, id, data );
                } );
            },
            ( as, err ) => {
                if ( err === 'NotApplicable' ) {
                    as.success();
                }
            }
        ) );

        it ( 'obey "encrypt" bit on decrypt', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `aes192fakeenc-${run_id}`,
                    [ 'sign' ],
                    'AES',
                    192
                );

                as.add( ( as, id ) => {
                    const data = Buffer.from( 'Some Test Data' );
                    data_face.encrypt( as, id, data );
                } );
            },
            ( as, err ) => {
                if ( err === 'NotApplicable' ) {
                    as.success();
                }
            }
        ) );

        it ( 'obey "sign" on sign', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `aes192fakesign-${run_id}`,
                    [ 'encrypt' ],
                    'AES',
                    192
                );

                as.add( ( as, id ) => {
                    const data = Buffer.from( 'Some Test Data' );
                    data_face.sign( as, id, data, 'SHA-256' );
                } );
            },
            ( as, err ) => {
                if ( err === 'NotApplicable' ) {
                    as.success();
                }
            }
        ) );

        it ( 'obey "sign" on verify', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `aes192fakesign-${run_id}`,
                    [ 'encrypt' ],
                    'AES',
                    192
                );

                as.add( ( as, id ) => {
                    const data = Buffer.from( 'Some Test Data' );
                    data_face.verify( as, id, data, data, 'SHA-256' );
                } );
            },
            ( as, err ) => {
                if ( err === 'NotApplicable' ) {
                    as.success();
                }
            }
        ) );

        it ( 'obey failure limit', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `aes192fakesign-${run_id}`,
                    [ 'encrypt' ],
                    'AES',
                    192
                );

                as.add( ( as, id ) => {
                    const data = Buffer.from( 'Some Test Data' );
                    data_face.verify( as, id, data, data, 'SHA-256' );
                } );
            },
            ( as, err ) => {
                if ( err === 'NotApplicable' ) {
                    as.success();
                }
            }
        ) );

        it ( 'obey failure limit', $as_test(
            ( as ) => {
                key_face.generateKey(
                    as,
                    `rsa1024fail-${run_id}`,
                    [ 'encrypt', 'sign' ],
                    'RSA',
                    1024
                );

                as.add( ( as, id ) => {
                    storage.updateUsage( as, id, { failures: 1e4 + 1 } );

                    const data = Buffer.from( 'Some Test Data' );
                    data_face.verify( as, id, data, data, 'SHA-256' );
                } );
            },
            ( as, err ) => {
                if ( err === 'SecurityError' ) {
                    expect( as.state.error_info ).equal( 'Failure limit has reached' );
                    as.success();
                }
            }
        ) );
    } );
};
