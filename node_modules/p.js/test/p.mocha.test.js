/**
 * Copyright (C) 2014 yanni4night.com
 * p.mocha.test.js
 *
 * changelog
 * 2014-12-02[12:07:12]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */
'use strict';
var P = require('../p');
var assert = require('assert');
/* global describe */
/* global it */
describe('Basic', function() {
    describe('#then()', function() {
        it('data from then should be 34', function(done) {
            new P(function(resolve) {
                setTimeout(resolve.bind(null, 34), 500);
            }).then(function(data) {
                assert.deepEqual(data, 34);
                done();
            });
        });
    });

    describe('#catch()', function() {
        it('data from then should be "error"', function(done) {
            new P(function(resolve, reject) {
                setTimeout(reject.bind(null, 'error'), 500);
            }).catch(function(data) {
                assert.deepEqual(data, 'error');
                done();
            });
        });
    });
    describe('#resolve()', function() {
        it('data from then should be 123', function(done) {
            P.resolve(123).then(function(data) {
                assert.deepEqual(data, 123);
                done();
            });
        });
    });
    describe('#reject()', function() {
        it('data from catch should be "error"', function(done) {
            var msg = 'error';
            P.reject(new Error(msg)).then(function() {}, function(err) {
                assert.deepEqual(msg, err && err.message);
                done();
            });
        });
    });

    describe('#all()', function() {
        it('data shoud be [9,8,8] returned by all', function(done) {
            var sp = new P(function(resolve) {
                setTimeout(resolve.bind(null, 7), 500);
            });
            P.all([9, 8, sp]).then(function(data) {
                assert.ok(Array.isArray(data));
                assert.deepEqual(data[2], 7);
                done();
            });
        });
    });

    describe('#race()', function() {
        it('data shoud be 45 returned by race', function(done) {
            var sp1 = new P(function(resolve) {
                setTimeout(resolve.bind(null, 45), 500);
            });
            var sp2 = new P(function(resolve) {
                setTimeout(resolve.bind(null, 56), 1500);
            });
            P.race([sp1, sp2]).then(function(data) {
                assert.deepEqual(45, data);
                done();
            });
        });
    });

});

describe('Extened', function() {
    describe('chain', function() {
        it('modified value by chain should be 67', function(done) {
            new P(function(resolve) {
                setTimeout(resolve.bind(null, 34), 500);
            }).then().then(function(data) {
                assert.deepEqual(data, 34);
                return 67;
            }).then(function(data) {
                assert.deepEqual(data, 67);
                done();
            });
        });

        it('returned by catch should be 67', function(done) {
            new P(function(resolve, reject) {
                setTimeout(reject.bind(null, 34), 500);
            }).catch(function(data) {
                assert.deepEqual(data, 34, 'data from catch should be 34');
                return 67;
            }).then(function(data) {
                assert.deepEqual(data, 67, 'data from then should be 67');
                done();
            });
        });
    });

    describe('state', function() {
        it('state should be "pending" immediately', function(done) {
            assert.deepEqual('pending', P.resolve(67).then(function(data) {
                assert.deepEqual(67, data, 'data from then should be 67');
                done();
            }).state);
        });
    });

    describe('exception', function() {
        it('should throw errors if arguments illegal', function(done) {
            assert.throws(function() {
                new P(1);
            });
            assert.throws(function() {
                P.all(null);
            });
            assert.throws(function() {
                P.race(null);
            });
            assert.throws(function() {
                P.resolve(2).then({});
            });
            assert.throws(function() {
                P.resolve(2).then(null, {});
            });
            done();
        });
    });
});