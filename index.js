'use strict';
var record_1 = require('./record');
function handler(event, context) {
    var authcode = 'xyz';
    if (event.authcode === authcode) {
        var record = new record_1.Record(event, context);
        record.getRecordIP();
    }
    else {
        context.succeed({ update: false, piip: event.sourceIP, reason: 'not authenticated' });
    }
}
exports.handler = handler;
;
