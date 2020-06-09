const dmxlib = require('dmxnet');
const { Worker } = require('worker_threads');
const logUpdate = require('log-update');
const workerpool = require('workerpool');
const pool = workerpool.pool(__dirname + '/worker.js');
const { BehaviorSubject } = require('rxjs');

options = {
    verbose: 0,
    oem: 0
}
dmxnet = new dmxlib.dmxnet(options);

const threads = 2;

module.exports = class ArtNetController {

    configuration = [];

    /**
     * @param {Object} [options] - General options object
     * @param {Object[]} [options.senderConfigurations]
     * @param {string} [options.senderConfigurations[].ip] - IP to transmit to. default 255.255.255.255
     * @param {number} [options.senderConfigurations[].subnet] - Destination subnet, default 0
     * @param {number} [options.senderConfigurations[].universe] - Destination universe, default 0
     * @param {number} [options.senderConfigurations[].net] - Destination net, default 0
     * @param {number} [options.senderConfigurations[].port] - Destination UDP port, default 6454
     * @param {number} [option.senderConfigurations[].base_refresh_interval] - Default interval for sending unhange ArtDmx 
     */
    constructor(options) { 
        this.num_grids = options.senderConfigurations.length;
        // this.configuration = {};
        // this.configuration.receiverSettings = {}[this.num_grids];
        for (let i = 0; i < this.num_grids; i++) {
            this.configuration.push(options.senderConfigurations[i]);
        }

        this.senders = this.createSenderObjects();
        // this.port = new Worker(require.resolve('./fadeWorker.js'), {
        //     //workerData: { chValue }
        // });

        this.subject = new BehaviorSubject();
        
    }
    /**
     * Optional parameters for run-time assignment
     */
    setParameters(options) {

    }
    

    createSenderObjects() {
        let sender_objects = {};
        console.log(this.configuration);
        for (let i = 0; i < this.num_grids; i++) {
            sender_objects[i] = dmxnet.newSender(this.configuration[i]);
        }
        //console.log(sender_objects);
        return sender_objects;
    }

    testLightbars() {
        for (let i = 0; i < this.num_grids; i++) {
            this.senders[i].fillChannels(0, 504, 127);
        }
    }

    disableLightbars() {
        for (let i = 0; i < this.num_grids; i++) {
            this.senders[i].reset();
        }
    }

    // sendDmx(grid_number, beginChannel, endChannel, value) {
    //     this.senders[grid_number].fillChannels(beginChannel, endChannel, value);
    //     setTimeout(() => {
    //         this.senders[grid_number].fillChannels(beginChannel, endChannel, 0);
    //     }, 500);
    // }



    highlightHex(hex, grid_number) {
        //Execute this function in a seperate worker 
        
        let chValue = 255;
        let beginChannel;
        let endChannel;

        

        pool.exec('calculateDmxPosition', [hex, grid_number, 255])
        .then((result) => {
            //console.log(result);
            this.senders[grid_number].fillChannels(result.beginChannel, result.endChannel, 255);
            // beginChannel = result.beginChannel;
            // endChannel = result.endChannel;
            //this.port.postMessage(255);
        })
        .catch((err) => {
            console.error(err);
        })

        // this.port.on('message', (dmxValue) => {
        //     // if(dmxValue === 0 ) {
        //     //     return ;
        //     // }
        //     this.senders[grid_number].fillChannels(beginChannel, endChannel, dmxValue);
        // })
        // this.port.on('error', (e) => console.error(e));
        // this.port.on('exit', (code) => console.log(`Exit code for worker thread: ${code}`));



        // for (let i = 0; i < this.num_grids; i++) {
        //     if (i === grid_number) {
                // hex: {x, y}
                

                // Send the endchannel and beginchannel data to a seperate worker
                // As well as the current grid, 

                // pool.exec(this.sendDmx, [grid_number, beginChannel, endChannel]).then((result) => {
                //     console.log('result: ', result);
                // })
                // .catch((err) => {
                //     console.error(err);
                // })

                //this.senders[grid_number].fillChannels(beginChannel, endChannel, 255);//.ççççç,./ Luuk did this

                // this.senders[grid_number].fillChannels(beginChannel, endChannel, function colorFade(chValue = 255) {
                //     if (chValue <= 0) {
                //         return 0;
                //     } else {
                //         return colorFade(chValue - 10);
                //     }
                // });

                // let chValue = 255;
                // let fadeTimer = setInterval(() => {
                //     if (chValue <= 0) {
                //         clearInterval(fadeTimer);
                //     } else {
                //         chValue -= 5;
                //         this.senders[grid_number].fillChannels(beginChannel, endChannel, chValue);
                //     }
                // });

                // setTimeout(() => {
                //     this.senders[grid_number].fillChannels(beginChannel, endChannel, 0);
                // }, 500);
            // } else {
            //     //this.senders[i].reset();
            // }
        
    }


}