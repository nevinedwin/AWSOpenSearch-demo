const fs = require('fs')
const archiver  = require('archiver');

const createLambdaLayerZip = async ()=>{
    if(fs.existsSync('nodejs.zip')) fs.unlinkSync('nodejs.zip');
    if(!fs.existsSync('lambdaLayerStack')) fs.mkdirSync('lambdaLayerStack');

    const output = fs.createWriteStream('lambdaLayerStack/nodejs.zip');
    const archive = archiver('zip');
    archive.pipe(output);

    archive.directory('lambdaLayerStack/node_modules/', 'nodejs/node_modules');
    await archive.finalize();

    console.log('nodejs.zip is ready');
};

createLambdaLayerZip().catch(console.error);