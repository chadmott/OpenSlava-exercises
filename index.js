'use strict';
exports.handler = (event, context) => {
    //config variables
    var HostedZoneId = 'xyz'; //hosted zone ID from Route53
    var fqdn = 'xyz'; //domain name for API
    var authcode = 'xyz'; //rudamentary authentication -- you pass this as a git param 
    
    var requestIP = event.sourceIP;
    var AWS = require("aws-sdk");
    var route53 = new AWS.Route53();

    //get the IP address that is currently listed 
    function getRecordIP() {
        var params = {
            HostedZoneId: HostedZoneId, /* required */
            StartRecordName: fqdn,
            StartRecordType: 'A',
            MaxItems: '1'
        };
        route53.listResourceRecordSets(params, function (err, data) {
            if (err) {
                context.succeed({ update: false, piip: event.sourceIP, reason: 'Route 53 failure' });
            }
            else {
                var recordIP = data.ResourceRecordSets[0].ResourceRecords[0].Value;
                if (requestIP != data.ResourceRecordSets[0].ResourceRecords[0].Value) {
                    updateRecord();
                } else {
                    context.succeed({ update: false, piip: event.sourceIP, reason: 'Request and record are the same' });
                }
            }
        });
    }
         //update the DNS record
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
                            TTL: 0,
                        }
                    },
                ],
            },
            HostedZoneId: HostedZoneId
        };
        route53.changeResourceRecordSets(params, function (err, data) {
            if (err) {
                context.succeed({ update: 'fail', piip: event.sourceIP, reason: 'Route 53 failure' });
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
};