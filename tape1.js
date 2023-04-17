
let settings = {
    items: 3,
    pkPrefix: 'c',
    cities: ['Boston', 'New York', 'New York', 'Philadelphia', 'Chicago', null, null]
};

import { md5, payloadData, randomChoiceSeeded } from './util.js';

const rowMaker = (tick) => {

    if(tick > settings.items) {
        return undefined;
    }

    const ContractID = settings.pkPrefix + md5(tick.toString()).slice(-6);

    const city = randomChoiceSeeded(settings.cities, tick);

    const itemText = payloadData('text', .2);

    const newItem = {
            "ContractID": {"S": ContractID},
            "body": {"S": itemText}
    };

    if(city) {
        newItem['city'] = {"S": city};
    }

    return newItem ;

}

export { rowMaker }

