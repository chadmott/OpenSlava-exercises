'use strict';

import * as AWS from 'aws-sdk';
import {Record} from './record';

export function handler(event: any, context: any) {
    const authcode: string = 'xyz'; // rudamentary authentication -- you pass t`his as a get param 

    if (event.authcode === authcode) {
        let record = new Record(event, context);
        record.getRecordIP();
    }
    else {
        context.succeed({ update: false, piip: event.sourceIP, reason: 'not authenticated' });
    }
};

