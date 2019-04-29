# CrowdCurio Image Annotator Library
The CrowdCurio Image Annotation Library implements counting (classification) and transcription tasks for images. 

![An screenshot of the Image Annotator.](https://curio-media.s3.amazonaws.com/github-media/image-annotator.png)

<center>"<b><i>The interface is so mature.</i></b>" - Hemant Surale.</center>

## Features
- Support for counting and (letter-by-letter) transcription tasks.
- Support for alternating between practice tasks and required tasks.
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
// transcription configuration
var config = {
    mode: 'transcription',  # required
    language: 'greek',      # required
    practice: {
        active: false
    }
}

// counting configuration
window.config = {
            mode: 'counting',
            labels: [{
                name: 'Tau',
                examples: [
                    'url1',
                    'url2',
                    'url3'
                ]
            }, {
                name: 'Nu',
                examples: [
                    'url1',
                    'url2',
                    'url3'
                ]
            }],
            practice: {
                active: true,
                feedback: true
            }
        };

// define a new annotator
var annotator = new ImageAnnotator();
annotator.initialize(config);
```

## Contact
Alex Williams, University of Waterloo
