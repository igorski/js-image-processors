var CanvasHelper = require( "./helpers/CanvasHelper" );

var cvs   = document.getElementById( "canvas" );
var ctx   = cvs.getContext( "2d" );
var tiles = [];

/* DOM elements */

var cvsWidth  = document.getElementById( "canvas-width" );
var cvsHeight = document.getElementById( "canvas-height" );
var clearBox  = document.getElementById( "clear-bg" );
var download  = document.getElementById( "download-btn" );
var input     = document.getElementById('file-input');

/* event handlers */

clearBox.onchange = draw;

cvsWidth.onchange = cvsHeight.onchange = function( e )
{
    var width  = parseInt( cvsWidth.value,  10 );
    var height = parseInt( cvsHeight.value, 10 );

    cvs.width  = width;
    cvs.height = height;

    render();
};

input.onchange = function( e )
{
    var img = new Image();
    img.onload = function()
    {
        if ( canvasHelper ) {
            canvasHelper.destroy();
        }
        canvasHelper = new CanvasHelper( img );
        w            = img.naturalWidth;
        h            = img.naturalHeight;
        outputSize   = cvs.width / w;

        cvs.height = h / w * cvs.width;

        document.getElementById( "preview" ).src = img.src;
        render();
    };
    img.src = URL.createObjectURL(e.target.files[0]);
};

download.onclick = function(e)
{
    var pom = document.createElement( "a" );
    pom.setAttribute( "href", cvs.toDataURL( "image/jpeg" ));
    pom.setAttribute( "download", "image.jpg" );
    pom.click();
};

function draw()
{
   // requestAnimationFrame( draw );

    ctx.fillStyle = "#FFFFFF";

    if ( clearBox.checked )
        ctx.fillRect( 0, 0, cvs.width, cvs.height );

    for ( var i = 0; i < cvs.width; i += 20 )
    {
        ctx.fillStyle = "#FF00AE";
        ctx.fillRect( i, 0, 1, cvs.height );
    }
}

var canvasHelper, w, h, outputSize, horizontalTileAmount, verticalTileAmount;

function render()
{
    draw();
}
