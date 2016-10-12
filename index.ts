'use strict';

import * as AWS from 'aws-sdk';

export function handler(event: any, context: any) {

    // config variables
    const HostedZoneId: string = 'xyz'; // hosted zone ID from Route53
    const fqdn: string = 'xyz'; // domain name for API
    const authcode: string = 'xyz'; // rudamentary authentication -- you pass t`his as a git param 
    const requestIP: string = event.sourceIP;

    let route53 = new AWS.Route53();

    // get the IP address that is currently listed 
    function getRecordIP() {
        let params = {
            HostedZoneId: HostedZoneId, /* required */
            StartRecordName: fqdn,
            StartRecordType: 'A',
            MaxItems: '1'
        };
        route53.listResourceRecordSets(params, function (err: any, data: any) {
            if (err) {
                context.succeed({ update: false, piip: event.sourceIP, reason: 'Route 53 failure' + err });
            }
            else {
                let recordIP = data.ResourceRecordSets[0].ResourceRecords[0].Value;
                if (requestIP !== data.ResourceRecordSets[0].ResourceRecords[0].Value) {
                    updateRecord();
                } else {
                    context.succeed({ update: false, piip: event.sourceIP, reason: 'Request and record are the same' });
                }
            }
        });
    }
    // update the DNS record
    function updateRecord() {
        let params = {
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
        route53.changeResourceRecordSets(params, function (err: any, data: any) {
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
};

