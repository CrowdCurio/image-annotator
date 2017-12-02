//  file:   main.js
//  author: alex w.
//  desc:   root file for bundling the image annotator
global.jQuery = require("jquery")
global.$ = require("jquery")
var ImageAnnotator = require('./image-annotator');

// set global UI vars
global.DEV = false;
global.task = window.task || -1;
global.user = window.user || -1;
var config = window.config || {
        'mode': 'transcription',
    };

function start(configuration){
    /* create and init the annotator ui */
    ms = new ImageAnnotator();
    ms.initialize(config);
}

/* create the interface */
start(config);