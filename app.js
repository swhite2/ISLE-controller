const WebSocketServer = require('websocket').server;
const WebSocketRouter = require('websocket').router;
const http = require('http');
const MotionController = require('./static/motionControllerSvg');
//const ArtNetController = require('./controllers/artnetController');
const ArtNetController2 = require('./controllers/artnetController2');
const { Subscriber } = require('rxjs');
const { performance } = require('perf_hooks');
const log = require('single-line-log').stdout;

const server = http.createServer((req, res) => {
    console.log((new Date()) + ' Received request for ' + req.url);
    res.writeHead(404);
    res.end();
})

// Set up the server
var wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});



function originIsAllowed(origin) {
    return true;
}

//TEST PURPOSES
options = {
    senderConfigurations: [
        {
            ip: '192.168.1.81',
            universe: 1,
            base_refresh_interval: 10000
        },
        {
            ip: '192.168.1.82',
            universe: 1,
            base_refresh_interval: 10000
        },
        {
            ip: '192.168.1.83',
            universe: 1,
            base_refresh_interval: 10000
        },
        {
            ip: '192.168.1.84',
            universe: 1,
            base_refresh_interval: 10000
        },
        {
            ip: '192.168.1.85',
            universe: 1,
            base_refresh_interval: 10000
        },
        {
            ip: '192.168.1.86',
            universe: 1,
            base_refresh_interval: 10000
        },
        {
            ip: '192.168.1.87',
            universe: 1,
            base_refresh_interval: 10000
        },
        {
            ip: '192.168.1.88',
            universe: 1,
            base_refresh_interval: 10000
        }
    ]
}
artnetController = new ArtNetController2(options);


motionController = new MotionController();
const subject = motionController.getControllerSubject();
motionController.createGrids(artnetController);
motionController.startMainControllerLoop();


wsServer.on('request', (req) => {
    if (!originIsAllowed(req.origin)) {
        req.reject();
        console.log((new Date()) + ' Connection from origin ' + req.origin + ' rejected');
        return;
    }

    const connection = req.accept(null, req.origin);
    console.log((new Date()) + ' Connection with address ' + connection.socket.remoteAddress + ' accepted');
    console.log(new Date() + ' origin: ' + req.origin);
    //connections.push(connection);

    const subscriber = new Subscriber(value => {
        var t0 = performance.now();

        //console.log('Received data');
        if (typeof value !== 'undefined') {
            // The commented code here is meant for continuing streaming to all clients
            // We want to stream to a client that has opened that stream
            // for (let i = 0; i < connections.length; i++) {
            //     connections[i].send(value); // Value is a JSON object containing {x, y, hand}
            // }
            connection.send(value);
            var t1 = performance.now();
            log('Main network IO performance (ms): [' + (t1-t0) + ']');
        } 
    }, err => {
        console.error('Error: ' + err);
    });

    connection.on('message', (message) => {
        console.log(message);
        const message_obj = JSON.parse(message.utf8Data);
        if(message_obj.type === 'lightbarConfiguration') {
            // configure the lightbars
            motionController.setParameters(
                message_obj.num_grids,
                message_obj.hex_size,
                message_obj.orientation,
                message_obj.grid_offset,
                message_obj.grid_width,
                message_obj.grid_height
            );
            
        } else if(message_obj.type === 'requestForStreaming') {
            console.log(new Date() + ' Request for streaming for ' + req.origin);
            // Should this be in a seperate thread?
            subject.subscribe(subscriber);
        } else if(message_obj.type === 'enableLightbars') {
            console.log(new Date() + ' Lightbars enabled');
            artnetController.testLightbars();
        } else if(message_obj.type === 'disableLightbars') {
            artnetController.disableLightbars();
        }
    });


    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected. Reason: ' + reasonCode + ' ' + description);
        connection.close();
        subscriber.unsubscribe();
    });
})


//app.use("/static", express.static('./static/'));

module.exports = server;
