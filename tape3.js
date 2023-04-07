let settings = {
    iterations: 5,
    itemsPerCollection : 2,
    pkPrefix: 'cust-',
    skPrefix: 'event-',
};

import { md5, randomString } from './util.js';

const rowMaker = (tick) => {

    if(tick > settings.iterations) {
        return undefined;
    }
    // const PK = Math.floor(tick/settings.itemsPerCollection) + 1;
    const rando = Math.floor(Math.random() * 1000000000).toString(16);
    const PK = settings.pkPrefix + rando.slice(6);

    const SK = settings.skPrefix + ((tick % settings.itemsPerCollection) + 1).toString();

    const newItem = {
            "PK": {"S": PK},
            "SK": {"S": SK},
            "event": {"S": "ORDER"},
            "tick": {"N": (tick + 1).toString()},
            "payload": {"S": payloadData(3)}
    };

    return newItem ;

}


function payloadData(kb) {

    let oneKb = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec lacus magna, consectetur vitae faucibus cursus, volutpat sit amet neque. Etiam eu dolor tempor, porttitor risus at, tristique justo. Mauris sollicitudin gravidae diam vitae auctor. Donec velit nunc, semper at varius vel, ornare ac leo. Mauris ac porta arcu. Nam ullamcorper ac ligula ut lobortis. Quisque in molestie velit, ac rutrum arcu. Mauris em lacus, malesuada id mattis a, hendrerit et nunc. Ut pretium congue nisl molestie ornare. Etiam eget leo finibus, eleifend velit sit amet, condimentum ipsum. Aliquam qui nisi quis orci maximus laoreet id vel mi. Phasellus suscipit, leo sed ullamcorper cursus, est nisi fermentum magna, vitae placerat dui ni eu ipsum. Phasellus faucibus a ex et tempus. Nulla consequat ornare dui sagittis dictum. Curabitur scelerisque malesuada turpis ac auctor. Suspendisse sit amet sapien ac eros viverra tempor.  Draco Dormiens Nunquam Titillandus! Nulam convallis velit ornare ante viverra eget in. Etiam eget leo finibus.  "

    return oneKb.repeat(kb);
}

export { rowMaker }

