

let settings = {
    iterations: 100,
    pkPrefix: 'c',
    cities: ['Boston', 'New York', 'New York', 'Philadelphia', 'Chicago']
};

import { md5, randomString, payloadData } from './util.js';

const rowMaker = (tick) => {

    if(tick > settings.iterations) {
        return undefined;
    }

    const ContractID = settings.pkPrefix + md5(tick.toString()).slice(-6);

    const city = settings.cities[Math.floor(Math.random()*settings.cities.length)];

    const itemText = payloadData(0.8, 'text');

    const newItem = {
            "ContractID": {"S": ContractID},
            "tick": {"N" : tick.toString()},
            "city": {"S": city},
            "body": {"S": itemText},
    };

    return newItem ;

}

export { rowMaker }

