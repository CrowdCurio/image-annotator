//  file:   main.js
//  author: alex w.
//  desc:   root file for bundling the image annotator
const Timer = require('./utils/timer');
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

global.seenURLs = [];

global.latestImage = "";

global.ad = [ { "url": "https://bisque.cyverse.org/image_service/00-5Wva5GTJUW9NSEfqjhuza7", "abc": { "a": 1, "b": 3, "c": 5, }, "coordinates": [ {"x": 489.6, "y": 312.8, "label": 'flower' }, {"x": 448.8, "y": 407.2, "label": 'flower' }, {"x": 684.8, "y": 435.2, "label": 'flower' }, {"x": 764, "y": 616, "label": 'flower' }, {"x": 596.8, "y": 444, "label": 'flower' }, {"x": 749.6, "y": 720.8, "label": 'flower' }, {"x": 1368, "y": 600, "label": 'flower' }, {"x": 1936, "y": 680, "label": 'flower' }, {"x": 1816, "y": 695.2, "label": 'flower' }, {"x": 1832, "y": 672, "label": 'bud' }, {"x": 1832, "y": 695.2, "label": 'bud' }, {"x": 2272, "y": 880, "label": 'flower' }, {"x": 2648, "y": 1128, "label": 'fruit' }, {"x": 2648, "y": 1088, "label": 'bud' }, ] }, { "url": "http://sweetgum.nybg.org/images3/2490/537/01269422.jpg", "abc": { "a": 1, "b": 3, "c": 5, }, "coordinates": [ {"x": 707, "y": 754, "label": 'fruit'}, {"x": 936, "y": 761, "label": 'fruit'}, {"x": 970, "y": 923, "label": 'fruit'}, {"x": 867, "y": 839, "label": 'flower'}, {"x": 733, "y": 855, "label": 'flower'}, {"x": 837, "y": 838, "label": 'flower'}, {"x": 2100, "y": 709, "label": 'flower'}, {"x": 2400, "y": 689, "label": 'bud'}, {"x": 2700, "y": 692, "label": 'fruit'}, {"x": 2700, "y": 848, "label": 'fruit'}, {"x": 2600, "y": 968, "label": 'fruit'}, {"x": 2540, "y": 1020, "label": 'fruit'}, {"x": 2400, "y": 1110, "label": 'fruit'}, {"x": 2430, "y": 1070, "label": 'flower'}, {"x": 1720, "y": 1160, "label": 'fruit'}, {"x": 1650, "y": 1540, "label": 'fruit'}, {"x": 2680, "y": 1560, "label": 'bud'}, {"x": 2730, "y": 1670, "label": 'flower'}, {"x": 2970, "y": 1630, "label": 'flower'}, {"x": 1870, "y": 2030, "label": 'flower'}, {"x": 1710, "y": 2130, "label": 'fruit'}, {"x": 1170, "y": 2460, "label": 'flower'}, {"x": 1130, "y": 2500, "label": 'fruit'}, {"x": 1130, "y": 2550, "label": 'fruit'}, {"x": 1170, "y": 2810, "label": 'fruit'}, {"x": 1090, "y": 2900, "label": 'flower'}, {"x": 1140, "y": 2940, "label": 'flower'}, {"x": 661, "y": 3150, "label": 'flower'}, {"x": 701, "y": 3200, "label": 'fruit'}, {"x": 452, "y": 3390, "label": 'fruit'}, {"x": 488, "y": 3410, "label": 'fruit'}, {"x": 723, "y": 4000, "label": 'flower'}, {"x": 810, "y": 4190, "label": 'flower'}, {"x": 825, "y": 4300, "label": 'fruit'}, {"x": 860, "y": 4220, "label": 'fruit'}, {"x": 788, "y": 3940, "label": 'bud'}, ] } ]




function start(configuration) {
  /* create and init the annotator ui */
  ms = new ImageAnnotator();
  ms.initialize(config);
}

/* create the interface */
start(config);

delete global.assessmentData


