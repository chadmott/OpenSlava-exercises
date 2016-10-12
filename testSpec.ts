'use strict';

import * as chai from 'chai';
import {handler} from './index';
let cats = 'dogs';
let expect = chai.expect;
describe('myLambda', function () {
    let authCode = 123;
    it('should fail with invalid authcode' + authCode, function (done) {
        let context = {
            succeed: function (result) {
                expect(result.update).to.be.false;
                expect(result.reason).to.equal('not authenticated');
                done();
            },
            fail: function () {
                done(new Error('never context.fail'));
            }
        };
        handler({ authcode: authCode }, context);
    });
    it('should fail when it cannot connect to route 53', function (done) {
        let context = {
            succeed: function (result) {
                expect(result.update).to.be.false;
                expect(result.reason).to.include('Route 53 failure');
                done();
            },
            fail: function () {
                done(new Error('never context.fail'));
            }
        };
        handler({ authcode: 'xyz' }, context);
    });
});