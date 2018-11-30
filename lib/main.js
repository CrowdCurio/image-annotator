//  file:   main.js
//  author: alex w.
//  desc:   root file for bundling the image annotator
global.jQuery = require('jquery');
global.$ = require('jquery');
const ImageAnnotator = require('./components/image-annotator');

// set global UI vars
global.DEV = false;
global.task = window.task || -1;
global.user = window.user || -1;
global.experiment = window.experiment || -1;
global.condition = window.condition || -1;
const config = window.config || {
  mode: 'transcription',
};

// set whether dejavu is implemented and whether the duplicated images can be side by side
// Note: if there are only 1 image in the queue, that image will be duplicated and sideBySideAllowed always behaves as it is true.
global.dejavu = true;
global.sideBySideAllowed = false

//store the indexes of the duplicate images in the queue. dupIndex1 < dupIndex2
global.dupIndex1 = 0;
global.dupIndex2 = 0;

var budCoor = [];//Jarvis
var flowerCoor = [];
var fruitCoor = [];

function start(configuration) {
  /* create and init the annotator ui */
  ms = new ImageAnnotator();
  ms.initialize(config);
}

/* create the interface */
start(config);
