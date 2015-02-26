var CanvasHelper = require( "./helpers/CanvasHelper" );

/* application properties */

var cvs = document.getElementById( "canvas" );
var ctx = cvs.getContext( "2d" );
var canvasHelper, w, h, outputSize, image;

// the effect we're currently running (import from ./programs folder)

var effect = require( "./programs/glitcher/Glitcher" );

/* DOM elements */

var cvsWidth  = document.getElementById( "canvas-width" );
var cvsHeight = document.getElementById( "canvas-height" );
var clearBox  = document.getElementById( "clear-bg" );
var download  = document.getElementById( "download-btn" );
var input     = document.getElementById( "file-input" );

var sampleSize = document.getElementById( "sample-size" );
var smearSize  = document.getElementById( "smear-size" );
var skipSize   = document.getElementById( "skip-size" );

/* event handlers */

clearBox.onchange   =
sampleSize.onchange =
smearSize.onchange  = render;

cvsWidth.onchange = cvsHeight.onchange = updateCanvasDimensions();

function updateCanvasDimensions( aEvent )
{
    var width  = parseInt( cvsWidth.value,  10 );
    var height = parseInt( cvsHeight.value, 10 );

    cvs.width  = width;
    cvs.height = height;

    render();
}

input.onchange = function( aEvent )
{
    image = new Image();
    image.onload = function()
    {
        canvasHelper = new CanvasHelper( image );
        w            = image.naturalWidth;
        h            = image.naturalHeight;
        outputSize   = cvs.width / w;

        cvs.height = h / w * cvs.width;

        cvsHeight.setAttribute( "value", cvs.height );

        document.getElementById( "preview" ).src = image.src;
        render();
    };
    image.src = URL.createObjectURL( aEvent.target.files[ 0 ]);
};

download.onclick = function( aEvent )
{
    var pom = document.createElement( "a" );
    pom.setAttribute( "href", cvs.toDataURL( "image/jpeg" ));
    pom.setAttribute( "download", "image.jpg" );
    pom.click();
};

function render()
{
    if ( !image )
        return;

    // requestAnimationFrame( draw );

    ctx.fillStyle = "#FFFFFF";

    if ( clearBox.checked )
        ctx.fillRect( 0, 0, cvs.width, cvs.height );

    effect.render( ctx, cvs.width, cvs.height, canvasHelper, sampleSize.value, smearSize.value, skipSize.value );
}

updateCanvasDimensions(); // force match to input field values on launch
