let settings = {
    collections: 4,
    itemsPerCollection : 3,
    pkPrefix: 'c',
    skPrefix: 'v',
    payloadSize: 30
};

import { md5, randomString, payloadData } from './util.js';

const rowMaker = (tick) => {

    if(tick > (settings.collections * settings.itemsPerCollection)) {
        return undefined;
    }

    const collectionNum = Math.floor((tick-1)/settings.itemsPerCollection) + 1;
    const collectionIndex = (((tick-1) % settings.itemsPerCollection)+1).toString();
    const ContractID = settings.pkPrefix + md5(collectionNum.toString()).slice(-6);

    const SK = (tick % settings.itemsPerCollection) + 1;

    const itemText = payloadData('text', .2);

    const newItem = {
        "ContractID": {"S": ContractID},
        "Version": {"S": settings.skPrefix + collectionIndex},
        "event": {"S": itemText}
    };

    return newItem ;

}

export { rowMaker }

