const server = require('./app');

const greetModule = require('./build/Release/greet.node');

console.log('exports: ', greetModule);
console.log();

console.log(greetModule.greetHello());
console.log();

server.listen(3050, () => {
    console.log((new Date()) + ' Server listening on port 3050');
});

