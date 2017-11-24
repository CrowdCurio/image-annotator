# CrowdCurio Image Annotator Library
The CrowdCurio Image Annotation Library implements counting (classification) and transcription tasks for images. 

## Features
- Support for counting and (letter-by-letter) transcription tasks.
- Zoom functionality.
- Fullscreen functionality.
- Integrated support for CrowdCurio.

## Build Process
We use Browserify and Uglify in our build processes. Both tools can be installed with NPM.

>npm install -g browserify

>npm install -g uglify-js

To build the script bundle *without* minification, run:
>browserify lib/main.s -o bundle.js

To build *with* minification, run:
>browserify lib/main.js | uglifyjs bundle.js

## Usage
The UI is controlled by a set of parameters upon instantiation. Here's an example of the configuration and its usage:
```
// define config
var config = {
    'mode': 'transcription',
    'language': 'greek',
    ...
}

// define a new annotator
var annotator = new ImageAnnotator();
annotator.initialize(config);
```

## Contact
Alex Williams, University of Waterloo