# js-image-processors

Experimental photo processing algorithms in JavaScript

This repository does not contain any code that can be distributed and re-used among projects, but
merely contains a set of experiments.

## running the test page

You will not node.js and npm to resolve the dependencies.

You can install Grunt (used to run the build tasks defined in Gruntfile.js) via npm :

    npm install grunt-cli -g

You can use the following task to serve the page with the experiment on localhost:3000

    grunt start

## some notes

Some of these filters require hefty amounts of processing, the tool was made to test and tweak on the
fly, and to generate a high resolution image that can be saved locally and used in other projects.
