'use strict';

import * as chai from 'chai';
import { handler } from './index';

const expect = chai.expect;

describe('myLambda', () => {
    const authCode = 123;
    it('should fail with invalid authcode' + authCode, (done) => {
        console.log(handler);
        const context = {
            succeed: (result) => {
                expect(result.update).to.be.false;
                expect(result.reason).to.equal('not authenticated');
                done();
            },
            fail: () => {
                done(new Error('never context.fail'));
            }
        };
        handler({ authcode: authCode }, context);
    });

    it('should fail when it cannot connect to route 53', (done) => {
        const context = {
            succeed: (result) => {
                expect(result.update).to.be.false;
                expect(result.reason).to.include('Route 53 failure');
                done();
            },
            fail: () => {
                done(new Error('never context.fail'));
            }
        };
        handler({ authcode: 'xyz' }, context);
    });
});