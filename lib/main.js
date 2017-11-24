//  file:   main.js
//  author: alex w.
//  desc:   root file for bundling the image annotator
global.jQuery = require("jquery")
global.$ = require("jquery")
var ImageAnnotator = require('./image-annotator');

// specify some configuration
global.DEV = true;
var config = {
    'mode': 'transcription'
};

function start(configuration){
    /* create and init the annotator ui */
    ms = new ImageAnnotator();
    ms.initialize(config);
    ms.mode = 'transcribe';
}

/* create the interface */
start(config);