'use strict';

const password_gen = require( '../lib/password_gen' );

describe( 'password_gen', function() {
    let expect;
    before( async () => {
        ( { expect } = ( await import( 'chai' ) ) );
    } );

    it( 'should generate random passwords', function() {
        [ 8, 21, 33, 255 ].forEach( ( i ) => {
            const a = password_gen( i );
            const b = password_gen( i );
            expect( a.length ).to.equal( i );
            expect( a ).not.eql( b );
            expect( a ).to.match( /^[a-zA-Z0-9_-]+$/ );
            expect( b ).to.match( /^[a-zA-Z0-9_-]+$/ );
        } );
    } );
} );
