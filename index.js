'use strict';
var cats = 'dogs';
var AWS = require('aws-sdk');
function handler(event, context) {
    var HostedZoneId = 'xyz';
    var fqdn = 'xyz';
    var authcode = 'xyz';
    var requestIP = event.sourceIP;
    var route53 = new AWS.Route53();
    function getRecordIP() {
        var params = {
            HostedZoneId: HostedZoneId,
            StartRecordName: fqdn,
            StartRecordType: 'A',
            MaxItems: '1'
        };
        route53.listResourceRecordSets(params, function (err, data) {
            if (err) {
                context.succeed({ update: false, piip: event.sourceIP, reason: 'Route 53 failure' + err });
            }
            else {
                var recordIP = data.ResourceRecordSets[0].ResourceRecords[0].Value;
                if (requestIP !== data.ResourceRecordSets[0].ResourceRecords[0].Value) {
                    updateRecord();
                }
                else {
                    context.succeed({ update: false, piip: event.sourceIP, reason: 'Request and record are the same' });
                }
            }
        });
    }
    function updateRecord() {
        var params = {
            ChangeBatch: {
                Changes: [
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: fqdn,
                            Type: 'A',
                            ResourceRecords: [
                                {
                                    Value: event.sourceIP
                                },
                            ],
                            TTL: 0
                        }
                    },
                ]
            },
            HostedZoneId: HostedZoneId
        };
        route53.changeResourceRecordSets(params, function (err, data) {
            if (err) {
                context.succeed({ update: false, piip: event.sourceIP, reason: 'Route 53 failure' + err });
            }
            else {
                context.succeed({ update: true, piip: event.sourceIP, reason: 'authenticated and needed update' });
            }
        });
    }
    if (event.authcode === authcode) {
        getRecordIP();
    }
    else {
        context.succeed({ update: false, piip: event.sourceIP, reason: 'not authenticated' });
    }
}
exports.handler = handler;
;
