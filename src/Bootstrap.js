/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Igor Zinken
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var CanvasHelper = require( "./helpers/CanvasHelper" );
var ImageUtil    = require( "./helpers/ImageUtil" );

/* application properties */

var cvs = document.getElementById( "canvas" );
var ctx = cvs.getContext( "2d" );
var canvasHelper, w, h, outputSize, sourceImage, image;
var blockResize = false, resizePending = false, renderPending = false;

var MAX_WIDTH = 1920, MAX_HEIGHT = 1080;    // HD video anyone ?

// the effect we're currently running (import from ./programs folder, see "changeProgram")

var effect;

/* DOM elements */

var cvsWidth      = document.getElementById( "canvas-width" );
var cvsHeight     = document.getElementById( "canvas-height" );
var clearBox      = document.getElementById( "clear-bg" );
var download      = document.getElementById( "download-btn" );
var programSelect = document.getElementById( "program-select" );
var fileInput     = document.getElementById( "file-input" );
var sampleSize    = document.getElementById( "sample-size" );
var smearSize     = document.getElementById( "smear-size" );
var skipSize      = document.getElementById( "skip-size" );

/* event handlers */

clearBox.onchange   =
sampleSize.onchange =
smearSize.onchange  =
skipSize.onchange   = render;

cvsWidth.onchange = cvsHeight.onchange = updateCanvasDimensions;
programSelect.onchange = changeProgram;

/**
 * invoked whenever the Canvas dimension inputs have changed
 *
 * @param {Event} aEvent
 */
function updateCanvasDimensions( aEvent )
{
    if ( blockResize )
        return;

    var width  = Math.min( parseInt( cvsWidth.value,  10 ), MAX_WIDTH );
    var height = Math.min( parseInt( cvsHeight.value, 10 ), MAX_HEIGHT );

    // ensure canvas matches Image ratios

    if ( sourceImage )
    {
        var dim = ImageUtil.getImageSize( sourceImage );
        var ratioY = dim.height / dim.width;

        height = width * ratioY;

        while ( width > MAX_WIDTH || height > MAX_HEIGHT )
        {
            --width;
            height = width * ratioY;
        }
        blockResize = true;

        width  = Math.round( width );
        height = Math.round( height );

        cvsWidth.value  = width;
        cvsHeight.value = height;

        blockResize = false;
    }

    cvs.width  = width;
    cvs.height = height;

    // resample source Image and re-render
    if ( sourceImage && !resizePending ) {
        requestAnimationFrame( function() {
            resizeSourceImage( sourceImage );
        });
    }
}

/**
 * invoked whenever the program select box changes value
 *
 * @param {Event} aEvent
 */
function changeProgram( aEvent )
{
    var value = aEvent ? aEvent.target.value : null;
    var newProgram;

    switch ( value )
    {
        default:
        case "voronoi":
            newProgram = require( "./programs/Voronoi" );
            break;

        case "shuffler":
            newProgram = require( "./programs/Shuffler" );
            break;
    }

    if ( effect === newProgram )
        return;
    else
        effect = newProgram;

    // will restart programs
    if ( sourceImage )
        resizeSourceImage( sourceImage );
}

/**
 * invoked whenever a new file has been selected
 *
 * @param {Event} aEvent
 */
fileInput.onchange = function( aEvent )
{
    sourceImage = new Image();
    sourceImage.onload = function()
    {
        sourceImage.onload = null;
        // will resize Canvas to match Image ratios, will in turn trigger resample on Image
        updateCanvasDimensions( null );
    };
    sourceImage.src = URL.createObjectURL( aEvent.target.files[ 0 ]);
};

/**
 * invoked whenever the download button has been clicked
 *
 * @param {Event} aEvent
 */
download.onclick = function( aEvent )
{
    var pom = document.createElement( "a" );
    pom.setAttribute( "href", cvs.toDataURL( "image/jpeg" ));
    pom.setAttribute( "download", "image.jpg" );
    pom.click();
};

/**
 * the source Image can potentially be very big, as such we scale it down
 * to match the dimensions of the current Canvas size to spare CPU cycles
 *
 * @param {Image} aImage
 */
function resizeSourceImage( aImage )
{
    if ( resizePending )
        return;

    resizePending = true;

    ImageUtil.onReady( sourceImage, function()
    {
        image = ImageUtil.resize( sourceImage, cvs.width, cvs.height,
                                  true, 0, ImageUtil.isPNG( sourceImage ));

        canvasHelper = new CanvasHelper( image );
        w            = image.naturalWidth;
        h            = image.naturalHeight;
        outputSize   = cvs.width / w;

        cvs.height = h / w * cvs.width;

        cvsHeight.setAttribute( "value", cvs.height );

        document.getElementById( "preview" ).src = image.src;

        // allows us to pre-cache properties for the image

        ImageUtil.onReady( image, function()
        {
            effect.prepare( ctx, cvs.width, cvs.height, canvasHelper,
                            sampleSize.value, smearSize.value, skipSize.value );

            render();
        });

        resizePending = false;
    });
}

/**
 * renders the source image with the selected
 * effect applied onto the on screen canvas
 */
function render()
{
    if ( renderPending )
        return;

    requestAnimationFrame( function()
    {
        renderPending = false;

        if ( !image )
            return;

        ctx.fillStyle = "#FFFFFF";

        if ( clearBox.checked )
            ctx.fillRect( 0, 0, cvs.width, cvs.height );

        effect.render( ctx, cvs.width, cvs.height, canvasHelper, parseInt( sampleSize.value, 10 ), parseInt( smearSize.value, 10 ), parseInt( skipSize.value, 10 ) );
    });

    renderPending = true;
}

changeProgram( null );          // auto-select default program
updateCanvasDimensions( null ); // force match to input field values on launch
