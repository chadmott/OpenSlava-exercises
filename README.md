# Open Slava Exercises

IP Sync Application.

The goal of this application is to replace Dynamic DNS using AWS lambda.

## Before starting

Make sure you have:

**Required:**

- Mac, CYGWIN/GitBash on Windows
- [NodeJS 6.7.0](https://nodejs.org/en/)
- Typescript 2.0 (`npm install -g typescript`)

**Optional:**

- An AWS “Free Tier” account
- [Visual Studio Code](https://code.visualstudio.com/)

## Step 1

Excercise Getting Started,

navigate to a new directory and clone the repo.
`git clone https://github.com/chadmott/OpenSlava-exercises`

`git checkout step-1`

this is basically an empty branch.

We need to scaffold a vanilla node project.

`npm init`

To test locally, we will use a tool called node-lambda. Install it like this
`npm install -g node-lambda`

we will also need the AWS-SDK
`npm install aws-sdk --save`
`npm install typescript --save`

create our lambda function

```typescript
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
```

Test this by running
`node-lambda run`

If things are working well, then you should see
`Success:{"update":false,"piip":"8.8.8.8","reason":"not authenticated"}`

This would actually work if we had our local AWS credentials setup, but we arent going to do that just yet. The important part is that we are able to run the lambda.

This will work, but it has the following problems:
- not in typescript (duh)
- not testing
- no linting

We will work on these in the next steps.
If you got stuck, please `git checkout step-1`

##Step 2

_if you need to start here, please run_ `git checkout step-1`
Lets start to convert this to typescript!

first, make sure that you have typescript installed.
`npm install -g typescript`

next, we need to make sure that our editor is using the most recent version of typescript by setting that in our user settings in VS code

`"typescript.tsdk": "/usr/local/lib/node_modules/typescript/lib"`

Now we can convert to TypeScript!
- duplicate .js file and rename it index.ts
- `npm install @types/node --save`
- `npm install @types/aws-sdk`
- `tsc index.ts` then node-lambda run and observe the same result as before

So now we see that this "TypeScript" basically works the same way. Lets keep going.
- convert "var" to "let" in all instances.
- use arrow functions for fun!
- remove the "require" and do an import

Here we have a problem. We have a red squiggle under .Route53
- this is symptom of the fast moving pace of TypeScript. We must edit the type definition file
- this is a bit of a hack, this will be fixed with time .
- edit the node_modules/@types/index.d.ts with the following

```typescript
  //./exercise-1/node_modules/@types/aws-sdk
  export declare class Route53 {
    constructor(options?: any);
    endpoint: Endpoint;
    listResourceRecordSets(params: any, callback: (err: Error, data: any) => void): void;
    changeResourceRecordSets(params: any, callback: (err: Error, data: any) => void): void;
  }
```

##Step 3
_if you need to start here, please run_ `git checkout step-2`
Now lets make our development experience better.

What do we want to do:
- auto compile the TypeScript, and set some other typescript options
- Hide the generated JS files
- have a good NPM build setup
- setup linting
- add unit tests

tsconfig.json

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "module": "commonjs",
        "noImplicitAny": false,
        "removeComments": true,
        "preserveConstEnums": true,
        "sourceMap": true,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "typeRoots": [
            "./node_modules/@types"
        ],
        "watch": true

    },
    "compileOnSave": true,

    "include": [
        "**/*"
    ],
    "exclude": [
        "node_modules",
        "**/*.spec.ts"
    ]
}
```

Hide the Generated JS Files... do this in the settings of VSCode (not applicable to all editors)

```json
"files.exclude": {
    "**/*.js": { "when": "$(basename).ts"}
}
```

Now we need to be able to automate this build. Some use grunt, some use gulp. I like to just use NPM. ([https://medium.com/@dabit3/introduction-to-using-npm-as-a-build-tool-b41076f488b0\#.txkn5132h](https://medium.com/@dabit3/introduction-to-using-npm-as-a-build-tool-b41076f488b0#.txkn5132h))

To do this, we edit the package.json and add a "scripts" section

```json
 "scripts": {
    "build": "tsc"
  }
```

now if we run "nam run build" then it will execute "tsc". However, I want it to watch on compile, so I add a tsconfig.json file

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "module": "commonjs",
        "noImplicitAny": false,
        "removeComments": true,
        "preserveConstEnums": true,
        "sourceMap": false,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "typeRoots": [
            "./node_modules/@types"
        ],
        "watch": true
    },
    "compileOnSave": true,

    "include": [
        "**/*"
    ],
    "exclude": [
        "node_modules"
    ]
}
```

now when I run npm run-build, it will watch the file.

Now we should add lint.

`npm install tslint --save-dev`

we should configure it too by using tslint.json (this is up to interpretation)

```json
{
    "rules": {
        "class-name": true,
        "comment-format": [
            true,
            "check-space"
        ],
        "indent": [
            true,
            "spaces"
        ],
        "no-duplicate-variable": true,
        "no-eval": true,
        "no-internal-module": true,
        "no-trailing-whitespace": true,
        "no-unsafe-finally": true,
        "no-var-keyword": true,
        "one-line": [
            true,
            "check-open-brace",
            "check-whitespace"
        ],
        "quotemark": [
            true,
            "single"
        ],
        "semicolon": [
            true,
            "always"
        ],
        "triple-equals": [
            true,
            "allow-null-check"
        ],
        "typedef-whitespace": [
            true,
            {
                "call-signature": "nospace",
                "index-signature": "nospace",
                "parameter": "nospace",
                "property-declaration": "nospace",
                "variable-declaration": "nospace"
            }
        ],
        "variable-name": [
            true,
            "ban-keywords"
        ],
        "whitespace": [
            true,
            "check-branch",
            "check-decl",
            "check-operator",
            "check-separator",
            "check-type"
        ]
    }
}

```

We should also update our "scripts" within NPM and setup our editor to use it. And fix the error if there are any

```json
"lint": "tslint -c ./tslint.json '**/*.ts' -e  'node_modules/**'",
```

now we should setup unit tests. For this we will use Mocha and Chai

`npm install -g mocha`

`npm install chai --save`

`npm install @types/chai`

`npm install @types/mocha

Create testSpec.js

```js
'use strict';

import * as chai from 'chai';
import {handler} from './index';

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
```

Now, if your build task is running, this will be auto-compiled.

we can add this to our NPM build tool as well

`"test": "mocha -watch ./**/*Spec.js"`

Now we have an auto building, auto linted, TypeScript project!

##Step 4
_if you need to start here, please run_ `git checkout step-3`
We will now do some refactoring to our typescript project

We will walk through how to refactor index.ts to this

```js
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
```

and now we will have our record class be its own file

```js
 'use strict';

 import * as AWS from 'aws-sdk';

 interface IRecord {
    HostedZoneId: string;
    fqdn: string;
    requestIP: string;
    route53: any;
    event: any;
}
export class Record implements IRecord {
    HostedZoneId;
    fqdn;
    requestIP;
    route53;

    constructor(public event: any, public context: any) {
        this.HostedZoneId = 'xyz'; // hosted zone ID from Route53
        this.fqdn = 'xyz'; // domain name for API
        this.requestIP = event.sourceIP;
        this.route53 = new AWS.Route53();
    }
    getRecordIP() {
        let params = {
            HostedZoneId: this.HostedZoneId, /* required */
            StartRecordName: this.fqdn,
            StartRecordType: 'A',
            MaxItems: '1'
        };

        this.route53.listResourceRecordSets(params, (err: any, data: any) => {
            if (err) {
                this.context.succeed({ update: false, piip: this.event.sourceIP, reason: 'Route 53 failure' + err });
            }
            else {
                let recordIP = data.ResourceRecordSets[0].ResourceRecords[0].Value;
                if (this.requestIP != data.ResourceRecordSets[0].ResourceRecords[0].Value) {
                    this.updateRecord();
                } else {
                    this.context.succeed({ update: false, piip: this.event.sourceIP, reason: 'Request and record are the same' });
                }
            }
        });
    };
    updateRecord() {
        let params = {
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
                            TTL: 0,
                        }
                    },
                ],
            },
            HostedZoneId: this.HostedZoneId
        };
        this.route53.changeResourceRecordSets(params, (err: any, data: any) => {
            if (err) {
                this.context.succeed({ update: false, piip: this.event.sourceIP, reason: 'Route 53 failure' + err });
            }
            else {
                this.context.succeed({ update: true, piip: this.event.sourceIP, reason: 'authenticated and needed update' });
            }
        });
    }
}
```