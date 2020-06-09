const workerpool = require('workerpool');
//const senders = require('../app').artnetcontroller.senders;

function calculateSequentialChannel(ypos, channelOffset) {
    let temp = ypos + 1;
    temp = channelOffset + (temp*3);
    return temp //-1;
}

function calculateReversedChannel(ypos, channelOffset) {
    let temp = ypos //+ 1;
    temp = channelOffset - (temp*3);
    return temp //-1;
}


function calculateDmxPosition(hex, currentGrid, dmxValue) {
    // console.log('TEST ' + senders);

    // senders[currentGrid].fillChannels(beginChannel, endChannel, dmxValue);
    // setTimeout(() => {
    //     senders[currentGrid].fillChannels(beginChannel, endChannel, 0);
    // }, 500);
    //hex = JSON.parse(hex);
    let beginChannel;
    let endChannel;
                //console.log(hex.x);
    switch (hex.x) {
        case 0:
                        // 1 -> hex.y + 1 (which means start at 1)
                        // 2 -> multiply hex.y (i.e. 1) by 3 = 3. (for 9 this is 9*3=27)
                        // 3 -> subtract 1 from hex.y, this is the end channel
                        // begin channel is hex.y - 3
        endChannel = calculateSequentialChannel(hex.y, 0);
        beginChannel = endChannel - 2;                      

                        // channel value should be between 0 and 83 ((28*3)-1)
                        // endChannel = (((hex.y + 1) * 3) - 1) === 0 ? 0 : ((hex.y + 1) * 3) - 1; // 012 345 678
                        // beginChannel = endChannel - 3;
            break;
        case 1:
                        // channel value should be between 84 and 167 REVERSED
            endChannel = calculateReversedChannel(hex.y, 168);
            beginChannel = endChannel - 2;

            break;
        case 2:
                        // channel value should be between 168 and 251
            endChannel = calculateSequentialChannel(hex.y, 168);
            beginChannel = endChannel - 2; 
            break;
        case 3:
                        // channel value should be between 252 and 335 REVERSED
            endChannel = calculateReversedChannel(hex.y, 336);
            beginChannel = endChannel - 2; 
            break;
        case 4:
            endChannel = calculateSequentialChannel(hex.y, 336);
            beginChannel = endChannel - 2;
                        // channel value should be between 336 and 419
            break;
        case 5:
                        // channel value should be between 420 and 503 REVERSED
            endChannel = calculateReversedChannel(hex.y, 504);
            beginChannel = endChannel - 2;
            break;  
                                          
    }
    return { endChannel, beginChannel }
}

workerpool.worker({
    calculateDmxPosition: calculateDmxPosition
});