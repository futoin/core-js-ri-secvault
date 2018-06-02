'use strict';

/**
 * @file
 *
 * Copyright 2018 FutoIn Project (https://futoin.org)
 * Copyright 2018 Andrey Galkin <andrey@futoin.org>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const $as = require( 'futoin-asyncsteps' );
const $asyncevent = require( 'futoin-asyncevent' );

const ReliableEventReceiver = require( 'futoin-eventstream/ReliableEventReceiver' );

const Storage = require( './Storage' );
const lruCache = require( 'lru-cache' );

const TARGET = Symbol( 'TARGET' );
const KEY_CACHE = Symbol( 'KEY_CACHE' );
const EXT2KEY = Symbol( `EXT2KEY` );
const WORKER_AS = Symbol( 'WORKER_AS' );
const UPD_QUEUE = Symbol( 'UPD_QUEUE' );
const EVT_RECEIVER = Symbol( 'EVT_RECEIVER' );

const DEF_CACHE_SIZE = 10240;
const DEF_TTL_MS = 600e3;
const DEF_SYNC_DELAY_MS = 10e3;
const DEF_SYNC_THREADS = 3;

/**
 * Storage wapper with advanced caching & invalidation
 */
class CachedStorageWrapper extends Storage {
    /**
     * C-tor
     * @param {AdvancedCCM} ccm - CCM instance
     * @param {Storage} target - target slow storage
     * @param {object} options - extra options for fine tune
     * @param {object} options.evtpushExecutor - executor instace with PushService
     * @param {integer} [options.cacheSize] - max cache entries
     * @param {integer} [options.ttlMs] - Cache Time-To-Live in ms
     * @param {integer} [options.syncDelayMs] - Cache Sync delay in ms
     * @param {integer} [options.syncThreads] - Cache Sync parallelism
     */
    constructor( ccm, target, options = {} ) {
        super();

        $asyncevent( this, [
            'workerError',
        ] );

        this._ccm = ccm;
        this._options = options;

        this[TARGET] = target;

        const {
            cacheSize = DEF_CACHE_SIZE,
            ttlMs = DEF_TTL_MS,
        } = options;

        const ext2key = new Map();
        this[EXT2KEY] = ext2key;

        this[KEY_CACHE] = new lruCache( {
            max: cacheSize,
            dispose: ( _, ki ) => {
                ext2key.delete( ki.ext_id );
            },
            maxAge: ttlMs,
        } );

        this[UPD_QUEUE] = new Map();

        this[WORKER_AS] = null;
        this[EVT_RECEIVER] = null;

        ccm.on( 'close', () => this._stopCache() );
        this._startCache();
    }

    load( as, uuidb64, decrypt=true ) {
        const ki = this[KEY_CACHE].get( uuidb64 );

        if ( ki !== undefined ) {
            as.successStep( ki );
        } else {
            this[TARGET].load( as, uuidb64, decrypt );

            if ( decrypt ) {
                this._cacheLoad( as );
            }
        }
    }

    loadExt( as, ext_id, decrypt=true ) {
        const ki = this[EXT2KEY].get( ext_id );

        if ( ki !== undefined ) {
            this[KEY_CACHE].get( ki.uuidb64 ); // touch
            as.successStep( ki );
        } else {
            this[TARGET].loadExt( as, ext_id, decrypt );

            if ( decrypt ) {
                this._cacheLoad( as );
            }
        }
    }

    _cacheLoad( as ) {
        as.add( ( as, res ) => {
            res._cache = {
                times: 0,
                bytes: 0,
                failures: 0,
            };
            this[KEY_CACHE].set( res.uuidb64, res );
            this[EXT2KEY].set( res.ext_id, res );
            as.success( res );
        } );
    }

    save( as, info ) {
        this[TARGET].save( as, info );
    }

    remove( as, uuidb64 ) {
        this[TARGET].remove( as, uuidb64 );

        as.add( ( as ) => {
            this[KEY_CACHE].del( uuidb64 );
        } );
    }

    list( as, prefix=null ) {
        this[TARGET].list( as, prefix );
    }

    _update( as, uuidb64, stats ) {
        const ki = this[KEY_CACHE].get( uuidb64 );

        if ( ki ) {
            as.add( ( as ) => {
                // NOTE: it has to be wrapped in step for consistent behavior.

                // Cache of locally generated update to subtract from incoming event
                // statistics. Such logic is done for immediate local updates.
                //---
                const cache = ki._cache;

                for ( let k in stats ) {
                    const v = stats[k];
                    cache[k] += v;
                    ki[`stat_${k}`] += v;
                }

                // NOTE: queued updates are enabled only for locally cached keys
                //       to simplify control of queue size. It's still possible that
                //       there are many more pending updates than currently cached
                //       keys.
                const us = this[UPD_QUEUE].get( uuidb64 );

                if ( us ) {
                    for ( let k in stats ) {
                        const v = stats[k];
                        us[k] += v;
                    }
                } else {
                    this[UPD_QUEUE].set( uuidb64, Object.assign( {
                        times: 0,
                        bytes: 0,
                        failures: 0,
                    }, stats ) );
                }
            } );
        } else {
            this[TARGET]._update( as, uuidb64, stats );
        }
    }

    setStorageSecret( as, secret, cipher_opts = {}, kdf_opts = {} ) {
        this[TARGET].setStorageSecret( as, secret, cipher_opts, kdf_opts );

        if ( secret === null ) {
            this[KEY_CACHE].reset();
            this[EXT2KEY].clear();
        }
    }

    isLocked() {
        return this[TARGET].isLocked();
    }

    _stopCache() {
        this[KEY_CACHE].reset();
        this[EXT2KEY].clear();

        if ( this[WORKER_AS] ) {
            this[WORKER_AS].cancel();
            this[WORKER_AS] = null;
        }

        if ( this[EVT_RECEIVER] ) {
            this[EVT_RECEIVER].stop();
            this[EVT_RECEIVER] = null;
        }
    }

    _startCache() {
        const ccm = this._ccm;
        const {
            syncDelayMs = DEF_SYNC_DELAY_MS,
            syncThreads = DEF_SYNC_THREADS,
            evtpushExecutor = null,
        } = this._options;

        if ( !evtpushExecutor ) {
            throw new Error( 'Missing evtpushExecutor option' );
        }

        //---
        this[WORKER_AS] = $as().loop( ( as ) => {
            as.add(
                ( as ) => this._workerTask( as, syncDelayMs, syncThreads ),
                ( as, err ) => {
                    this.emit( 'workerError', err, as.state.error_info, as.state.last_exception );
                    as.success();
                }
            );
        } ).execute();

        //---
        const key_cache = this[KEY_CACHE];

        const receiver = new class extends ReliableEventReceiver {
            constructor() {
                super( ccm );
            }

            _onEvents( as, events ) {
                for ( let e of events ) {
                    switch ( e.type ) {
                    case 'SV_DEL':
                        key_cache.del( e.data.id );
                        break;
                    case 'SV_UPD': {
                        const { id, times = 0, bytes = 0, failures = 0 } = e.data;
                        const ki = key_cache.peek( id );

                        if ( ki ) {
                            const cache = ki._cache;

                            // unrolled loop

                            //---
                            let d_times = times - cache.times;

                            if ( d_times > 0 ) {
                                cache.times = 0;
                                ki.stat_times += d_times;
                            } else {
                                cache.times += d_times; // decrease
                            }

                            //---
                            let d_bytes = bytes - cache.bytes;

                            if ( d_bytes > 0 ) {
                                cache.bytes = 0;
                                ki.stat_bytes += d_bytes;
                            } else {
                                cache.bytes += d_bytes; // decrease
                            }

                            //---
                            let d_failures = failures - cache.failures;

                            if ( d_failures > 0 ) {
                                cache.failures = 0;
                                ki.stat_failures += d_failures;
                            } else {
                                cache.failures += d_failures; // decrease
                            }
                        }

                        break;
                    }
                    }
                }
            }
        };

        receiver.on( 'workerError', ( ...args ) => this.emit( 'workerError', ...args ) );
        receiver.on( 'receiverError', ( ...args ) => this.emit( 'workerError', ...args ) );

        receiver.start( evtpushExecutor, null, { want: [ 'SV_DEL', 'SV_UPD' ] } );
        this[EVT_RECEIVER] = receiver;
    }

    _workerTask( as, sync_delay_ms, thread_count ) {
        const start_time = process.hrtime();
        const target = this[TARGET];
        const queue = this[UPD_QUEUE];
        const queue_size = queue.size;

        if ( queue_size > 0 ) {
            const iter = queue.entries();
            const p = as.parallel();

            for ( let i = Math.min( thread_count, queue_size ); i > 0; --i ) {
                p.add( ( as ) => as.loop( ( as ) => {
                    const n = iter.next();

                    if ( n.done ) {
                        as.break();
                    }

                    const [ id, stats ] = n.value;

                    if ( !stats.times && !stats.bytes && !stats.failures ) {
                        // stale item - no updates since the last run
                        queue.delete( id );
                        return;
                    }

                    as.add(
                        ( as ) => {
                            const fixed = Object.assign( {}, stats );
                            target._update( as, id, fixed );

                            as.add( ( as ) => {
                                stats.times -= fixed.times;
                                stats.bytes -= fixed.bytes;
                                stats.failures -= fixed.failures;
                            } );
                        },
                        ( as, err ) => {
                            if ( err === 'UnknownKeyID' ) {
                                this[KEY_CACHE].del( id );
                                queue.delete( id );
                            } else {
                                this.emit( 'workerError', err,
                                    as.state.error_info,
                                    as.state.last_exception );
                            }

                            // ignore errors
                            as.success();
                        }
                    );
                } ) );
            }
        }

        as.add( ( as ) => {
            const diff_time = process.hrtime( start_time );
            sync_delay_ms -= ( diff_time[0] * 1e3 ) + ( diff_time[1] / 1e6 );

            if ( sync_delay_ms <= 0 ) {
                return;
            }

            let to_handle = setTimeout( () => {
                to_handle = null;

                if ( as.state ) {
                    as.success();
                }
            }, sync_delay_ms );

            as.setCancel( () => {
                if ( to_handle ) {
                    clearTimeout( to_handle );
                }

                to_handle = null;
            } );
        } );
    }
}

module.exports = CachedStorageWrapper;
