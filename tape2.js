let settings = {
    iterations: 12,
    itemsPerCollection : 4,
    pkPrefix: 'c',
    skPrefix: 'v',
    payloadSize: 30
};

import { md5, randomString, payloadData } from './util.js';

const rowMaker = (tick) => {

    if(tick > settings.iterations) {
        return undefined;
    }

    const collectionNum = Math.floor((tick-1)/settings.itemsPerCollection) + 1;
    const collectionIndex = (((tick-1) % settings.itemsPerCollection)+1).toString();
    const ContractID = settings.pkPrefix + md5(collectionNum.toString()).slice(-6);

    console.log('tick: ' + tick + ',  collectionNum: ' + collectionNum);

    const SK = (tick % settings.itemsPerCollection) + 1;

    const newItem = {
        "ContractID": {"S": ContractID},
        "Version": {"S": settings.skPrefix + collectionIndex},
        "event": {"S": "DELIVERY"}
    };

    return newItem ;

}

export { rowMaker }

