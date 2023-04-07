// npm install @aws-sdk/client-dynamodb
// call with arguments for tape file and target table, e.g. :
//   node play tape1 table1

import { DynamoDBClient, PutItemCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";


const settings = {
    countMax: 1000,
    secondsMax: 20,
    region: 'us-west-1',
    localhost: false,
    csv: false,
    secondSummary: true,
    debug: false,
    dynamodb: {
        maxAttempts: 5
    }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

settings.endpointURL = settings.localhost ? 'http://localhost:8000' :  'https://dynamodb.' + settings.region + '.amazonaws.com';

let tapeFile = 'tape1.js';
let targetTable = 'DemoTable01';

if (process.argv.length > 2) {
    tapeFile = process.argv[2];
}

if (process.argv.length > 3) {
    targetTable = process.argv[3];
}

if(tapeFile.slice(-3).toLowerCase() !== '.js') {
    tapeFile = tapeFile + '.js'
}

const tape = await import('./' + tapeFile);

let startTime = Date.now();
let startTimeEpoch = Math.floor(startTime / 1000);
let startTimeMs = (startTime/1000) % 1;

let writeStartTime;
let writeEndTime;
let thisSecond;
let lastSecond;
let durationIndex = 0;
let cuThisSecond = 0;
let itemsThisSecond = 0;
let retryAttempts = 0;
let retryAttemptsTotal = 0;

let stopStatus = 'go';
let ccu = 0;
let errorCount = 0;
let delimiter = settings.csv ? ',' : '  ';

const fontColors = getFontColors();

console.log(fontColors.Dim + '\nPlaying tape  : ' + fontColors.Reset + fontColors.FgYellow + tapeFile + fontColors.Reset);
console.log(fontColors.Dim + 'Target table  : ' + fontColors.Reset + fontColors.FgMagenta + targetTable + fontColors.Reset);

const client = new DynamoDBClient({
    region: settings.region,
    endpoint: settings.endpointURL,
    maxAttempts : settings.dynamodb.maxAttempts
});

const metadata = await getTableMetaData(targetTable);
// console.log(metadata);

const KeySchema = metadata?.Table?.KeySchema;
const AttributeDefinitions = metadata?.Table?.AttributeDefinitions;

const PKname = KeySchema.filter(ix => ix.KeyType === 'HASH')[0].AttributeName;
const PKtype = AttributeDefinitions.filter(ix => ix.AttributeName === PKname)[0].AttributeType;

const SKname = KeySchema.length === 2 ? KeySchema.filter(ix => ix.KeyType === 'RANGE')[0].AttributeName : null;
const SKtype = KeySchema.length === 2 ? AttributeDefinitions.filter(ix => ix.AttributeName === SKname)[0].AttributeType : null;

console.log(fontColors.Dim +  'Partition key : ' + fontColors.Reset + fontColors.FgCyan + PKname + fontColors.Reset);
if(SKname) {
    console.log( '     Sort key : ' + fontColors.FgGreen + SKname + fontColors.Reset);
}

// const mode = metadata['Table']['BillingModeSummary']['BillingMode']
const mode = metadata.Table?.BillingModeSummary?.BillingMode ||  'Provisioned, ' + metadata.Table?.ProvisionedThroughput?.WriteCapacityUnits + ' WCU/sec';
console.log(fontColors.Dim + 'Capacity Mode : ' + fontColors.Reset + mode );
console.log();

let columnNames = [];
columnNames.push('HTTP');
columnNames.push('Attempts');
columnNames.push('TotalRetryDelay');
columnNames.push('CapacityUnits');
columnNames.push('ConsumedCapacityUnits');
columnNames.push('ThisSecond');
columnNames.push('NewSecond');
columnNames.push('durationIndex');
columnNames.push('cuThisSecond');
columnNames.push('itemsThisSecond');


// console.log(startTime/1000);
// console.log(startTimeMs);

// console.log(columnNames.join(delimiter));

// setTimeout(myFunction, 3000);
// await sleep(5000);

let countWritten = 0;

console.log(fontColors.Dim + 'start time    : ' + fontColors.Reset + startTimeEpoch);
console.log();

for (let i = 1; i <= settings.countMax && stopStatus === 'go'; i++) {

    let newItem = tape.rowMaker(i);

    if (newItem && errorCount === 0) {

        const PKval = newItem[PKname][Object.keys(newItem[PKname])[0]];
        const SKval = SKname ? newItem[SKname][Object.keys(newItem[SKname])[0]] : null;

        const input = {
            "Item": newItem,
            "ReturnConsumedCapacity": "TOTAL",
            "TableName": targetTable
        };

        const itemPrimaryKey = input['Item'][PKname][PKtype] + (SKname ? ':' + input['Item'][SKname][SKtype] : '');
        if(settings.debug) {
            console.log( i + ' ' + itemPrimaryKey);
        }

        const command = new PutItemCommand(input);

        let response;

            writeStartTime = Date.now();

            const newSecond = Math.floor(writeStartTime/1000) !== thisSecond;
            const gap = Math.floor(writeStartTime/1000) - thisSecond;

            if(newSecond && thisSecond) {
                durationIndex += 1;
                const jobSecond = (thisSecond - startTimeEpoch);
                const jobSecondLabel = jobSecond < 10 ? ' ' + jobSecond : jobSecond;


                let secondSummary = jobSecondLabel+ ' summary for ' + thisSecond + ': ';
                secondSummary += itemsThisSecond + ' items, ' + cuThisSecond + ' WCU/sec';
                secondSummary += retryAttempts > 0 ? ', ' + retryAttempts + ' retries' : '';
                if(settings.secondSummary) {

                    console.log(secondSummary);
                    if(gap && gap > 1) {
                        for(let g=1; g<gap; g++) {
                            console.log((jobSecond + g < 10 ? ' ' + (jobSecond + g) : jobSecond + g) + ' --');
                        }
                    }
                }


                cuThisSecond = 0;
                itemsThisSecond = 1;

            } else {
                itemsThisSecond += 1;
            }

        try {
            /// *** the actual DynamoDB write
            retryAttempts = 0;

            thisSecond = Math.floor(writeStartTime/1000);

            // the actual DynamoDB write operation
            try {
                response = await client.send(command);

            } catch (ee) {

                // console.log('^^^^^ ee ');
                let errorName = ee['name'];
                let httpStatus = ee['$metadata']['httpStatusCode'];
                console.error('\nError: HTTP-' + httpStatus + ' ' + errorName + ' on ' + targetTable);
                errorCount += 1;

            }


            writeEndTime = Date.now();

            let latency = writeEndTime - writeStartTime;


            if(response) {
                if(response['$metadata']?.httpStatusCode === 200) {
                    countWritten += 1;
                    retryAttempts = response['$metadata']['attempts'] - 1;
                    retryAttemptsTotal += retryAttempts;

                }

                let ccuThis = parseFloat(response?.ConsumedCapacity?.CapacityUnits);

                ccu += ccuThis;

                cuThisSecond += ccuThis;

                let logline = response['$metadata']?.httpStatusCode;
                logline += delimiter + response['$metadata']?.attempts;
                logline += delimiter + response['$metadata']?.totalRetryDelay;
                logline += delimiter + response?.ConsumedCapacity?.CapacityUnits;
                logline += delimiter + ccu;
                logline += delimiter + latency;
                logline += delimiter + thisSecond;
                logline += delimiter + newSecond;
                logline += delimiter + durationIndex;
                logline += delimiter + cuThisSecond;
                logline += delimiter + itemsThisSecond;

                // console.log(logline);
            }


        } catch (e) {
            console.log('**** e');
            console.log(e);

            // let name = e['name'];
            // let status = e['$metadata']['httpStatusCode'];
            // console.error('\nError: HTTP-' + status + ' ' + name + ' on ' + settings.table);
            // errorCount += 1;
        }


    } else {
        stopStatus = undefined;
    }

}

let endTime = Date.now();
let endTimeEpoch = Math.floor(endTime / 1000);

const durationSeconds = endTimeEpoch - startTimeEpoch;
const itemsPerSecond = Math.floor(countWritten * 10 / durationSeconds)/10;

console.log();
console.log(fontColors.Dim + 'end time      : ' + fontColors.Reset + endTimeEpoch );
console.log(fontColors.Dim + 'duration      : ' + fontColors.Reset + durationSeconds);

console.log(fontColors.Dim + 'Items written : ' + fontColors.Reset +  countWritten);
console.log(fontColors.Dim + 'Items/second  : ' + fontColors.Reset +  itemsPerSecond);
console.log(fontColors.Dim + 'WCU Consumed  : ' + fontColors.Reset + ccu );
console.log();

async function getTableMetaData(tn) {
    let params = {
        TableName: tn
    };
    let metadata = await client.send(new DescribeTableCommand(params));
    return metadata;

}


function getFontColors() {
    return {
        Reset : "\x1b[0m",
        Bright : "\x1b[1m",
        Dim : "\x1b[2m",
        Underscore : "\x1b[4m",
        Blink : "\x1b[5m",
        Reverse : "\x1b[7m",
        Hidden : "\x1b[8m",

        FgBlack : "\x1b[30m",
        FgRed : "\x1b[31m",
        FgGreen : "\x1b[32m",
        FgYellow : "\x1b[33m",
        FgBlue : "\x1b[34m",
        FgMagenta : "\x1b[35m",
        FgCyan : "\x1b[36m",
        FgWhite : "\x1b[37m",

        BgBlack : "\x1b[40m",
        BgRed : "\x1b[41m",
        BgGreen : "\x1b[42m",
        BgYellow : "\x1b[43m",
        BgBlue : "\x1b[44m",
        BgMagenta : "\x1b[45m",
        BgCyan : "\x1b[46m",
        BgWhite : "\x1b[47m"
    };
}

