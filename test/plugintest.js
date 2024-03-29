'use strict';

const expect = require( 'chai' ).expect;
const $as = require( 'futoin-asyncsteps' );
const $as_test = require( 'futoin-asyncsteps/testcase' );

const { VaultPlugin } = require( '../lib/main' );

describe( 'Plugins', function() {
    let as;

    beforeEach( 'Plugins', function() {
        as = $as();
    } );

    describe( 'VaultPlugin', function() {
        it ( 'should raise not implemented errors', function() {
            expect( () => VaultPlugin.getPlugin( 'INVALID' ) )
                .to.throw( 'UnsupportedType' );

            const p = new VaultPlugin();

            expect( () => p.defaultBits() )
                .to.throw( 'NotApplicable' );

            expect( p.isAsymetric() ).to.be.false;

            const as = { error: ( err ) => {
                throw new Error( err );
            } };

            expect( () => p.generate( as ) )
                .to.throw( 'NotApplicable' );

            expect( () => p.validateKey( as ) )
                .to.throw( 'NotApplicable' );

            expect( () => p.derive( as ) )
                .to.throw( 'NotApplicable' );

            expect( () => p.pubkey( as ) )
                .to.throw( 'NotApplicable' );

            expect( () => p.encrypt( as ) )
                .to.throw( 'NotApplicable' );

            expect( () => p.decrypt( as ) )
                .to.throw( 'NotApplicable' );

            expect( () => p.sign( as ) )
                .to.throw( 'NotApplicable' );

            expect( () => p.verify( as ) )
                .to.throw( 'NotApplicable' );
        } );
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
        it( 'generate()', function( done ) {
            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'AES' );
                    //--

                    p.generate( as );
                    as.add( ( as, key ) => {
                        expect( Buffer.isBuffer( key ) ).to.be.true;
                        expect( key.length ).to.equal( 16 );
                    } );


                    p.generate( as, { bits: 192 } );
                    as.add( ( as, key ) => {
                        expect( key.length ).to.equal( 24 );
                    } );

                    p.generate( as, { bits: 256 } );
                    as.add( ( as, key ) => {
                        expect( key.length ).to.equal( 32 );
                    } );

                    expect( () => p.generate( as, { bits: 64 } ) )
                        .to.throw( 'NotSupported' );
                },
                ( as, err ) => {
                    console.log( `${err}: ${as.state.error_info}` );
                    done( as.state.last_exception || 'Fail' );
                }
            );
            as.add( ( as ) => done() );
            as.execute();
        } );

        it( 'detect invalid IV length', function( done ) {
            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'AES' );
                    //--

                    const key = Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' );
                    p.encrypt(
                        as,
                        key,
                        Buffer.from( '00000000000000000000000000000000', 'hex' ),
                        {
                            iv: Buffer.from( '000000000000000000000000000000', 'hex' ),
                        }
                    );

                    as.add( ( as ) => as.error( 'Fail' ) );
                },
                ( as, err ) => {
                    if ( err === 'InvalidIV' ) {
                        as.success();
                    } else {
                        console.log( `${err}: ${as.state.error_info}` );
                        done( as.state.last_exception || 'Fail' );
                    }
                }
            );
            as.add( ( as ) => done() );
            as.execute();
        } );

        it( 'detect invalid mode', function( done ) {
            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'AES' );
                    //--

                    const key = Buffer.from( '10a58869d74be5a374cf867cfb473859', 'hex' );
                    p.encrypt(
                        as,
                        key,
                        Buffer.from( '00000000000000000000000000000000', 'hex' ),
                        {
                            mode: 'INV',
                        }
                    );

                    as.add( ( as ) => as.error( 'Fail' ) );
                },
                ( as, err ) => {
                    if ( err === 'NotSupported' ) {
                        as.success();
                    } else {
                        console.log( `${err}: ${as.state.error_info}` );
                        done( as.state.last_exception || 'Fail' );
                    }
                }
            );
            as.add( ( as ) => done() );
            as.execute();
        } );

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

    describe( 'RSA', function( done ) {
        it( 'generate()', function( done ) {
            this.timeout( 60e3 );

            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'RSA' );
                    //--

                    expect( p.isAsymetric() ).to.be.true;

                    p.generate( as, { bits: 1024 } );
                    as.add( ( as, key ) => {
                        expect( Buffer.isBuffer( key ) ).to.be.true;
                        expect( key.length ).above( 880 ).below( 1000 );
                    } );


                    expect( p.defaultBits() ).to.equal( 2048 );
                    p.generate( as );
                    as.add( ( as, key ) => {
                        expect( key.length ).above( 1670 ).below( 1700 );
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

        const rsa_key = Buffer.from( `
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAv9ybIh1jVKWiOwKIkzgzLIT7IQYtcYOTf4Ni27hHns/c9PBc
Xtlvtf0Z2ok+0qn19h3sTZYfZE/iWHJKRBFL+OlK09hKwx556Xqdaj6EgTz1UZB7
arK9INWAtEA4D+pHacHABkrArsrc8haEfMwepXMRfLTS2cKVvtS+YkUB+YxXjRKV
ZVqgXhA9UEEwh82tPt2lLxW5fJOQPYYeXu8f60u+fq38jXtQe15O5BdNWGM6Rq8/
X4kqzF8n/2+ij3D1+S7e1gJahrbPNEyLgtL9JuXxKYrXI/ZdJYQsO4y9tU+I15FD
KYZ+ueeUeN3IBk8MuvVvR5AIj5aZkSIPemX3dQIDAQABAoIBAETjRcRC/wZGjnBX
oYgSlrU2biDWYfyu/Ie9OgKgMP8BrVk48EGSGr0iSmUgADGNmuWqqszUySKwWBnf
t3CnMTsHMLnNoFJcn/NH9jtOhS8OHxsRIG8YDDY80oBlyntUaB291l+r+XEJH7nA
ggN5GsvW/AFlv4s2haPGKTGJi4L404qsbSOb9CdZ54/qEjwwVf4W2HFscNxPxJgy
PvoxnQKNSDGNpKAjv27B1BQHjmDl4If2QGROR/fbzamdU/fdHA74naTy1Z0qyd+v
WoHqW5Sz4yA7wDWfWzki3/ZANr4vTxLNVJzsRJnO2e8CZfKtEgpNow/uOL7I44Xt
KNXgziECgYEA+6w/QgPqDQDJtPnIUVvZO39tfC9PZL1TR9MIv6dCHySrDZtwgYvJ
+Xns7zvqCY2D8/dc0NznoJc7Zh4fDCDPGhCai8rPKlYw326PjTIatXNVl8tE7S8y
4wc4Ivo5PDnnnRXQ4InRNItfpouZekfkeRFN1ObZ7J6YvV/3UYdTJokCgYEAwykY
x+4ID6VRP+UMhgYvzLRohyrIH37qSIZwtywIs7+3WCh9C80WYViouqnd+OfRsVHv
dYsIirIUY+D0tLUCZwgcbZ2bn4GUiUB/Vqmz7EhEd9Qx3pVNgQKsahymeJxyGeI7
i36XzR+vzgIx5XysNum0VrPbxtUy+CdeQgX8To0CgYEA3+GutE8/GiolRXUemiGW
8bK99scvXXJ+b1pwYe2siH/aGtS4FMYB+ohYGcm2vKDDTXgzfSnGc7mVAZayD9vv
4EP893aHLCZYe6qi0PxNfjUHY21T95sRLZzyd0sZN1ZbkAYkNlrjXFbP1BxDf+AM
gxa9ojNqkW/UeEKyhDhZ4+ECgYEAqe3Wzf7MthLUNDZUOT6Z0Dwl58uwhPwVMyEc
c+G7kgeUtQZMG0JwAkMYZ7AQvvHa+/LD9i0hOuLkLjNp3w7dEKlXV3qsTq6djwTB
28vYBhzGwS/aXFzUJ0kUpzBbIxnVoAQEpOmNc+XrRg1TNObhbM8BX50r+G0a/EgL
IqHjluECgYEAmZYon6q59QY78KP9pAdH5DhASLwjZMScvKajws2hOCjkSezE458/
Qnn96bl3lAdHyvoBez4C4gWbQPbNz7Z1rZwykFIAc4qA6aRKD7Atomi1aDPPUCCh
XgNNSqFjpHXl/Uph50SNyZRd20BYtIJWT/K5sJ3aJwL3Qyio4RWDBoY=
-----END RSA PRIVATE KEY-----
`.trim() );
        const rsa_pubkey = Buffer.from( `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv9ybIh1jVKWiOwKIkzgz
LIT7IQYtcYOTf4Ni27hHns/c9PBcXtlvtf0Z2ok+0qn19h3sTZYfZE/iWHJKRBFL
+OlK09hKwx556Xqdaj6EgTz1UZB7arK9INWAtEA4D+pHacHABkrArsrc8haEfMwe
pXMRfLTS2cKVvtS+YkUB+YxXjRKVZVqgXhA9UEEwh82tPt2lLxW5fJOQPYYeXu8f
60u+fq38jXtQe15O5BdNWGM6Rq8/X4kqzF8n/2+ij3D1+S7e1gJahrbPNEyLgtL9
JuXxKYrXI/ZdJYQsO4y9tU+I15FDKYZ+ueeUeN3IBk8MuvVvR5AIj5aZkSIPemX3
dQIDAQAB
-----END PUBLIC KEY-----
`.trim() );

        it( 'pubkey()', function( done ) {
            this.timeout( 60e3 );

            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'RSA' );
                    //--

                    p.pubkey( as, rsa_key );
                    as.add( ( as, pubkey ) => {
                        expect( Buffer.isBuffer( pubkey ) ).to.be.true;
                        expect( pubkey.toString() ).equal( rsa_pubkey.toString() );
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

        it( 'encrypt()/decrypt()', function( done ) {
            this.timeout( 60e3 );

            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'RSA' );
                    //--

                    p.random( as, 128 );
                    as.add( ( as, buf ) => {
                        p.encrypt( as, rsa_pubkey, buf );
                        as.add( ( as, edata ) => p.decrypt( as, rsa_key, edata ) );
                        as.add( ( as, data ) => expect( data.equals( buf ) ).to.be.true );
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

        it( 'sign()/verify()', function( done ) {
            this.timeout( 60e3 );

            as.add(
                ( as ) => {
                    const p = VaultPlugin.getPlugin( 'RSA' );
                    //--

                    p.random( as, 128 );
                    as.add( ( as, buf ) => {
                        p.sign( as, rsa_key, buf );
                        as.add( ( as, sig ) => {
                            p.verify( as, rsa_pubkey, buf, sig );

                            as.add(
                                ( as ) => p.verify( as, rsa_pubkey, buf, Buffer.from( 'INVALID' ) ),
                                ( as, err ) => {
                                    expect( err ).to.equal( 'InvalidSignature' );
                                    as.success();
                                }
                            );
                        } );
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

    describe( 'Password', function() {
        it( 'generate()', $as_test( ( as ) => {
            const p = VaultPlugin.getPlugin( 'Password' );
            //--

            p.generate( as );
            as.add( ( as, key ) => {
                expect( Buffer.isBuffer( key ) ).to.be.true;
                expect( key.length ).to.equal( 16 );
                expect( key.toString() ).to.match( /^[a-zA-Z0-9_-]+$/ );
            } );


            p.generate( as, { bits: 192 } );
            as.add( ( as, key ) => {
                expect( key.length ).to.equal( 24 );
                expect( key.toString() ).to.match( /^[a-zA-Z0-9_-]+$/ );
            } );

            p.generate( as, { bits: 2040 } );
            as.add( ( as, key ) => {
                expect( key.toString().length ).to.equal( 255 );
                expect( key.toString() ).to.match( /^[a-zA-Z0-9_-]+$/ );
            } );

            as.forEach( [ 33, 24, 2048 ], ( as, _k, v ) => {
                as.add(
                    ( as ) => {
                        p.generate( as, { bits: v } );
                        as.add( ( as ) => as.error( 'Fail' ) );
                    },
                    ( as, err ) => {
                        if ( err === 'NotSupported' ) {
                            as.success();
                        }
                    }
                );
            } );
        } ) );

        it( 'verify()', $as_test( ( as ) => {
            const p = VaultPlugin.getPlugin( 'Password' );
            //--

            p.generate( as );
            as.add( ( as, key ) => {
                p.verify( as, key, undefined, key );
                p.verify( as, key, undefined, Buffer.from( key ) );
            } );

            p.verify( as, Buffer.from( '123' ), undefined, Buffer.from( '123' ) );

            as.forEach( {
                123: '124',
                234: '2345',
                1234: '123',
            }, ( as, k, v ) => {
                as.add(
                    ( as ) => {
                        p.verify( as, Buffer.from( k ), undefined, Buffer.from( v ) );
                        as.add( ( as ) => as.error( 'Fail' ) );
                    },
                    ( as, err ) => {
                        if ( err === 'InvalidSignature' ) {
                            as.success();
                        }
                    }
                );
            } );
        } ) );
    } );

    describe( 'HMAC', function() {
        it( 'generate()', $as_test( ( as ) => {
            const p = VaultPlugin.getPlugin( 'HMAC' );
            //--

            p.generate( as );
            as.add( ( as, key ) => {
                expect( Buffer.isBuffer( key ) ).to.be.true;
                expect( key.length ).to.equal( 32 );
            } );


            p.generate( as, { bits: 384 } );
            as.add( ( as, key ) => {
                expect( key.length ).to.equal( 48 );
            } );

            p.generate( as, { bits: 512 } );
            as.add( ( as, key ) => {
                expect( key.length ).to.equal( 64 );
            } );

            as.forEach( [ 255, 257, 520 ], ( as, _k, v ) => {
                as.add(
                    ( as ) => {
                        p.generate( as, { bits: v } );
                        as.add( ( as ) => as.error( 'Fail' ) );
                    },
                    ( as, err ) => {
                        if ( err === 'NotSupported' ) {
                            as.success();
                        }
                    }
                );
            } );
        } ) );

        it( 'sign()/verify()', $as_test( ( as ) => {
            const p = VaultPlugin.getPlugin( 'HMAC' );
            //--

            p.random( as, 128 );
            as.add( ( as, buf ) => {
                p.generate( as );
                as.add( ( as, key ) => {
                    as.forEach( [
                        'MD5',
                        'SHA-224',
                        'SHA256',
                        'sha384',
                        'ShA-512',
                    ], ( as, _k, hash ) => {
                        p.sign( as, key, buf, { hash } );
                        as.add( ( as, sig ) => {
                            p.verify( as, key, buf, sig, { hash } );

                            as.add(
                                ( as ) => {
                                    sig[0] = ~sig[0];
                                    p.verify( as, key, buf, sig, { hash } );
                                    as.add( ( as ) => as.error( 'Fail ' + hash ) );
                                },
                                ( as, err ) => {
                                    if ( err === 'InvalidSignature' ) {
                                        as.success();
                                    }
                                }
                            );
                        } );
                    } );

                    as.forEach( [
                        'NOTSUPPORTED',
                        'md_gost12_256',
                        'md_gost12_512',
                    ], ( as, _k, hash ) => {
                        as.add(
                            ( as ) => {
                                p.sign( as, key, buf, { hash } );
                                as.add( ( as ) => as.error( 'Fail ' + hash ) );
                            },
                            ( as, err ) => {
                                if ( err === 'NotSupported' ) {
                                    as.success();
                                }
                            }
                        );
                    } );

                    as.add(
                        ( as ) => {
                            p.verify( as, key, buf, Buffer.from( 'INVALID' ), { hash: 'sha256' } );
                            as.add( ( as ) => as.error( 'Fail' ) );
                        },
                        ( as, err ) => {
                            if ( err === 'InvalidSignature' ) {
                                as.success();
                            }
                        }
                    );
                } );
            } );
        } ) );
    } );
} );
