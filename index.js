'use strict';
var AWS = require('aws-sdk');
var Record = (function () {
    function Record(event, context) {
        this.event = event;
        this.context = context;
        this.HostedZoneId = 'xyz';
        this.fqdn = 'xyz';
        this.requestIP = event.sourceIP;
        this.route53 = new AWS.Route53();
    }
    Record.prototype.getRecordIP = function () {
        var _this = this;
        var params = {
            HostedZoneId: this.HostedZoneId,
            StartRecordName: this.fqdn,
            StartRecordType: 'A',
            MaxItems: '1'
        };
        this.route53.listResourceRecordSets(params, function (err, data) {
            if (err) {
                _this.context.succeed({ update: false, piip: _this.event.sourceIP, reason: 'Route 53 failure' + err });
            }
            else {
                var recordIP = data.ResourceRecordSets[0].ResourceRecords[0].Value;
                if (_this.requestIP != data.ResourceRecordSets[0].ResourceRecords[0].Value) {
                    _this.updateRecord();
                }
                else {
                    _this.context.succeed({ update: false, piip: _this.event.sourceIP, reason: 'Request and record are the same' });
                }
            }
        });
    };
    ;
    Record.prototype.updateRecord = function () {
        var _this = this;
        var params = {
            ChangeBatch: {
                Changes: [
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: this.fqdn,
                            Type: 'A',
                            ResourceRecords: [
                                {
                                    Value: this.event.sourceIP
                                },
                            ],
                            TTL: 0
                        }
                    },
                ]
            },
            HostedZoneId: this.HostedZoneId
        };
        this.route53.changeResourceRecordSets(params, function (err, data) {
            if (err) {
                _this.context.succeed({ update: false, piip: _this.event.sourceIP, reason: 'Route 53 failure' + err });
            }
            else {
                _this.context.succeed({ update: true, piip: _this.event.sourceIP, reason: 'authenticated and needed update' });
            }
        });
    };
    return Record;
}());
function handler(event, context) {
    var authcode = 'xyz';
    if (event.authcode === authcode) {
        var record = new Record(event, context);
        record.getRecordIP();
    }
    else {
        context.succeed({ update: false, piip: event.sourceIP, reason: 'not authenticated' });
    }
}
exports.handler = handler;
;
