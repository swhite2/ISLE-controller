const workerpool = require('workerpool');
const pool = workerpool.pool(__dirname + '/worker.js');
const UNIVERSE = 1;

module.exports = class ArtNetController2 {
    configuration = [];

    constructor(options) {
        this.num_grids = options.senderConfigurations.length;

        for(let i = 0; i < this.num_grids; i++) {
            this.configuration.push({host: options.senderConfigurations[i].ip, sendAll: true});
        }
        this.server = this.createArtNetObjects();
        //console.log(this.server);
    }

    createArtNetObjects() {
        let artnetObjects = {};
        for(let i = 0; i < this.num_grids; i++) {
            artnetObjects[i] = require('artnet')(this.configuration[i]);
        }
        console.log(new Date() + ' ArtNet senders created');
        return artnetObjects;
    }

    testLightbars() {
        let chValueArr = [];
        for (let i = 0; i < 505; i++) {
            chValueArr.push(255);
        }
        for (let i = 0; i < this.num_grids; i++) {
            this.server[i].set(1, 0, chValueArr);
        }
    }

    disableLightbars() {
        let chValueArr = [];
        for (let i = 0; i < 505; i++) {
            chValueArr.push(0);
        }
        for (let i = 0; i < this.num_grids; i++) {
            this.server[i].set(1, 0, chValueArr);
        }
    }

    highlightHex(hex, grid_number) {

        pool.exec('calculateDmxPosition', [hex, grid_number, 255])
        .then((result) => {
            let chValue = 0;

            let fadeInTimer = setInterval(() => {
                if (chValue >= 255) {
                    clearInterval(fadeInTimer);
                    let fadeOutTimer = setInterval(() => {
                        if (chValue <= 0) {
                            clearInterval(fadeOutTimer);
                        } else {
                            chValue -= 0.8;
                            this.server[grid_number].set(1, result.beginChannel, [chValue, chValue, chValue]);
                        }
                    });
                } else {
                    chValue += 5;
                    this.server[grid_number].set(1, result.beginChannel, [chValue, chValue, chValue]);
                }
            });
            // setTimeout(() => {
            //     this.server[grid_number].set(1, result.beginChannel, [0, 0, 0]);
            // }, 500);
        })
        .catch((err) => {
            console.error('error: ' + err);
        })
    }
}