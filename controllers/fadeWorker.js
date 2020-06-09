const { parentPort, workerData } = require('worker_threads');

parentPort.on('message', (data) => {
    let dmxValue = data;
    console.log('TEST' + data);
    let fadeTimer = setInterval(() => {
        if (dmxValue <= 0) {
            clearInterval(fadeTimer);
            //parentPort.postMessage(dmxValue);
        } else {
            dmxValue -= 5;
            parentPort.postMessage(dmxValue);
            //this.senders[grid_number].fillChannels(beginChannel, endChannel, chValue);
        }
    });
})