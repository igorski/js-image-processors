var CanvasHelper = require( "./helpers/CanvasHelper" );

/* application properties */

var cvs = document.getElementById( "canvas" );
var ctx = cvs.getContext( "2d" );
var canvasHelper, w, h, outputSize, image;
var renderPending = false;

// the effect we're currently running (import from ./programs folder)

var effect = require( "./programs/Shuffler" );

/* DOM elements */

var cvsWidth  = document.getElementById( "canvas-width" );
var cvsHeight = document.getElementById( "canvas-height" );
var clearBox  = document.getElementById( "clear-bg" );
var download  = document.getElementById( "download-btn" );
var fileInput = document.getElementById( "file-input" );

var sampleSize = document.getElementById( "sample-size" );
var smearSize  = document.getElementById( "smear-size" );
var skipSize   = document.getElementById( "skip-size" );

/* event handlers */

clearBox.onchange   =
sampleSize.onchange =
smearSize.onchange  =
skipSize.onchange   = render;

cvsWidth.onchange = cvsHeight.onchange = updateCanvasDimensions();

function updateCanvasDimensions( aEvent )
{
    var width  = parseInt( cvsWidth.value,  10 );
    var height = parseInt( cvsHeight.value, 10 );

    cvs.width  = width;
    cvs.height = height;

    render();
}

fileInput.onchange = function( aEvent )
{
    image = new Image();
    image.onload = function()
    {
        image.onload = null;
        canvasHelper = new CanvasHelper( image );
        w            = image.naturalWidth;
        h            = image.naturalHeight;
        outputSize   = cvs.width / w;

        cvs.height = h / w * cvs.width;

        cvsHeight.setAttribute( "value", cvs.height );

        document.getElementById( "preview" ).src = image.src;

        // allows us to pre-cache properties for the image

        requestAnimationFrame( function()
        {
            effect.prepare( ctx, cvs.width, cvs.height, canvasHelper,
                            sampleSize.value, smearSize.value, skipSize.value );

            render();
        });
    };
    image.src = URL.createObjectURL( aEvent.target.files[ 0 ]);
};

download.onclick = function( aEvent )
{
    var pom = document.createElement( "a" );
    pom.setAttribute( "href", cvs.toDataURL( "image/png" ));
    pom.setAttribute( "download", "image.png" );
    pom.click();
};

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

updateCanvasDimensions(); // force match to input field values on launch
