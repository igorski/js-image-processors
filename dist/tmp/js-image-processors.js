(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./helpers/CanvasHelper":2,"./programs/glitcher/Glitcher":3}],2:[function(require,module,exports){
module.exports = CanvasHelper;

/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 24-02-14
 * Time: 21:24
 * To change this template use File | Settings | File Templates.
 */
function CanvasHelper( image )
{
    this.image = image;

    // prepare for crunching
    var canvas  = document.createElement( "canvas" );
    var context = canvas.getContext && canvas.getContext( "2d" );

    this.height = canvas.height = image.naturalHeight || image.offsetHeight || image.height;
    this.width  = canvas.width  = image.naturalWidth  || image.offsetWidth  || image.width;

    context.drawImage( image, 0, 0 );

    try {
        this.data = context.getImageData( 0, 0, this.width, this.height ).data;
    }
    catch( e )
    {
        /* security error, img on diff domain */alert('x');
    }
}

/* class properties */

/** @public @type {Element} */   CanvasHelper.prototype.image;
/** @public @type {ImageData} */ CanvasHelper.prototype.data;
/** @public @type {number} */    CanvasHelper.prototype.width;
/** @public @type {number} */    CanvasHelper.prototype.height;

/* public methods */

CanvasHelper.prototype.destroy = function()
{
    this.data = null;
};

/**
 * retrieve the color currently present on the Canvas under
 * given point with coordinates x and y or under given rect
 * at coordinates x and y for a rectangle size of given blockSize
 *
 * @public
 *
 * @param {number} x
 * @param {number} y
 * @param {number} blockSize
 * @param {number=} smear optional "smearing" in the width, defaults to 1 (no effect)
 * @return {{r: number, g: number, b: number}}
 */
CanvasHelper.prototype.getColor = function( x, y, blockSize, smear )
{
    var len = 4;    // amount of blocks per pixel (R,G,B,A)
    var rgb = {r:0,g:0,b:0}; // no alpha ( would be fourth index )
    smear   = smear || 1;

    if ( x < 0 )
        x = 0;
    if ( x >= this.width )
        x = this.width - 1;

    if ( y < 0 )
        y = 0;
    if ( y >= this.height )
        y = this.height - 1;

    var maxLength   = this.data.length;
    var startOffset = ( x * len ) + ( y * len * this.width );
    var endOffset   = startOffset + (( blockSize * blockSize ) * len ) * smear;

    if ( endOffset > maxLength )
        endOffset = maxLength;

    var count = 0;
    var i     = startOffset - len;

    //console.log( "max > " + maxLength + " vs " + this.width + " x " + this.height + " start > " + startOffset + " end > " + endOffset);
    //return;
    while (( i += blockSize * len ) < endOffset )
    {
        ++count;
        rgb.r += this.data[ i ];
        rgb.g += this.data[ i + 1 ];
        rgb.b += this.data[ i + 2 ];
    }

    // ~~ used to floor values
    rgb.r = ~~( rgb.r / count );
    rgb.g = ~~( rgb.g / count );
    rgb.b = ~~( rgb.b / count );

    return rgb;
};

},{}],3:[function(require,module,exports){
var Glitcher = module.exports =
{
    /* public methods */

    /**
     * @public
     *
     * @param {CanvasRenderingContext2D} aContext
     * @param {number} aWidth total width of the canvas
     * @param {number} aHeight total height of the canvas
     * @param {CanvasHelper} aCanvasHelper reference to the CanvasHelper
     *        contains the Image to draw in property .image
     */
    render : function( aContext, aWidth, aHeight, aCanvasHelper, sampleSize, smearSize, skipSize )
    {
        var image       = aCanvasHelper.image;
        var imageWidth  = image.width;
        var imageHeight = image.height;

        // create samples from the image

        var sampleWidth = /*20*/smearSize, sampleHeight = imageHeight;

        var samples      = [];
        var tmpCanvas    = document.createElement( "canvas" );
        var tmpCtx       = tmpCanvas.getContext( "2d" );
        tmpCanvas.height = imageHeight;
        tmpCanvas.width  = sampleWidth;

        for ( var i = 0; i < imageWidth; i += tmpCanvas.width )
        {
            tmpCtx.drawImage( image, i, 0, sampleWidth, sampleHeight,
                              0, 0, sampleWidth, sampleHeight );

            var img = new Image();
            img.src = tmpCanvas.toDataURL( "image/jpeg" );

            samples.push( img );
        }

        // QQQ : drawing samples

        var targetWidth = aWidth / samples.length;

        for ( i = 0; i < samples.length; ++i )
        {

            var doen = i % sampleSize == 0;

            if ( doen ) {
                aContext.save();
                aContext.translate( aWidth / 2, aHeight / 2 );
                aContext.rotate( Math.PI / 4 );
                aContext.translate( -aWidth / 2, -aHeight / 2 );
            }
            aContext.drawImage( samples[ i ], 0, 0, sampleWidth, sampleHeight,
            i * /*targetWidth*/Math.max(1,skipSize), 0, targetWidth, aHeight );

            if ( doen ) {
                aContext.restore();
            }
       }

//        aContext.drawImage( image, 0, 0, image.width, image.height,
//                            0, 0, aWidth, aHeight );
    }
};

},{}],4:[function(require,module,exports){
module.exports = Tile;

function Tile( i, r, g, b, x, y, size )
{
    this.index = i;
    this.color = "rgba(" + r + "," + g + "," + b + ",255)";
    this.x     = x || 0;
    this.y     = y || 0;
    this.size  = size || 15;
    this.upper = Math.random() > .5;
}

/* class properties */

/** @public @type {number} */  Tile.prototype.index;
/** @public @type {number} */  Tile.prototype.x;
/** @public @type {number} */  Tile.prototype.y;
/** @public @type {number} */  Tile.prototype.size;
/** @public @type {number} */  Tile.prototype.upper;
/** @public @type {number} */  Tile.prototype.color;
/** @public @type {boolean} */ Tile.prototype.hasPairing = false;
/** @public @type {number} */  Tile.prototype.pairDirection = 0;

Tile.prototype.draw = function( ctx )
{
    ctx.fillStyle = this.color;
    ctx.beginPath();

    if ( this.upper )
    {
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( this.x + this.size, this.y );
        ctx.lineTo( this.x, this.y + this.size );
    }
    else {
        ctx.moveTo( this.x, this.y + this.size );
        ctx.lineTo( this.x + this.size, this.y + this.size );
        ctx.lineTo( this.x, this.y );
    }
    ctx.fill();
    ctx.closePath();
};

},{}],5:[function(require,module,exports){
//var CanvasHelper = require( "../../helpers/CanvasHelper" );
//var Tile         = require( "./Tile" );
//
//var cvs   = document.getElementById( "canvas" );
//var ctx   = cvs.getContext( "2d" );
//
//var tiles = [];
//
//function draw()
//{
//   // requestAnimationFrame( draw );
//
//    ctx.fillStyle = "#FFFFFF";
//
//    if ( clearBox.checked )
//        ctx.fillRect( 0, 0, cvs.width, cvs.height );
//
//    for ( var i = 0, l = tiles.length; i < l; ++i )
//    {
//        tiles[ i ].draw( ctx );
//    }
//}
//
//var canvasHelper, w, h, outputSize, horizontalTileAmount, verticalTileAmount;
//
//function render()
//{
//    tiles = []; // clear previous tiles
//
//    var theOutputSize = outputSize * incr;
//
//    for ( var iy = 0; iy < h; iy += incr )
//    {
//        for ( var ix = 0; ix < w; ix += incr )
//        {
//            var rgb = canvasHelper.getColor( ix, iy, size, smear );
//
//            var tile = new Tile( tiles.length, rgb.r, rgb.g, rgb.b, ix * outputSize, iy * outputSize, theOutputSize );
//            tile.xindex = ix;
//            tile.yindex = iy;
//            tiles.push( tile );
//        }
//    }
//    horizontalTileAmount = ix / incr;
//    verticalTileAmount   = iy / incr;
//
//    console.log( "amount of tiles generated > " + tiles.length );
//    draw();
//}
//
//var size     = 1; // preferred sample block size in pixels
//var incr     = 1;
//var smear    = 1;
//var ssSlider = document.getElementById( "sample-size" );
//var smSlider = document.getElementById( "smear-size" );
//var skSlider = document.getElementById( "skip-size" );
//var clearBox = document.getElementById( "clear-bg" );
//
//clearBox.onchange = draw;
//
//ssSlider.onchange = function( e ) {
//    size = e.target.value;
//    reqRender();
//};
//
//smSlider.onchange = function( e ) {
//    smear = e.target.value;
//    reqRender();
//};
//
//skSlider.onchange = function( e ) {
//    incr = parseInt( e.target.value ) + 1;
//    reqRender();
//};
//
//var rival;
//var reqRender = function()
//{
//    clearTimeout( rival );
//    rival = setTimeout( function()
//    {
//        clearTimeout( rival );
//        render();
//    }, 100 );
//};
//
//var input = document.getElementById('file-input');
//input.addEventListener('change', handleFiles);
//
//function handleFiles( e )
//{
//    var img = new Image();
//    img.onload = function()
//    {
//        if ( canvasHelper ) {
//            canvasHelper.destroy();
//        }
//        canvasHelper = new CanvasHelper( img );
//        w            = img.naturalWidth;
//        h            = img.naturalHeight;
//        outputSize   = cvs.width / w;
//
//        cvs.height = h / w * cvs.width;
//
//        document.getElementById( "preview").src = img.src;
//        render();
//    };
//    img.src = URL.createObjectURL(e.target.files[0]);
//}
//
///**
// *
// * @param {Tile} tile
// * @param {number} position of the tile to be paired with, can be
// *                 0 = upper left, 1 = top, 2 = upper right,
// *                 3 = left, 4 = right, 5 = lower left, 6 = bottom, 7 = lower right
// */
//function getPairing( tile, position )
//{
//    var targetIndex = tile.index;
//
//    switch ( position )
//    {
//        // upper left
//        case 0:
//            targetIndex = move( targetIndex, 1 ); // move left
//            targetIndex = move( targetIndex, 4 ); // move up
//            break;
//
//        // top
//        case 1:
//            targetIndex = move( targetIndex, 4 );
//            break;
//
//        // upper right
//        case 2:
//            targetIndex = move( targetIndex, 2 ); // move right
//            targetIndex = move( targetIndex, 4 ); // move up
//            break;
//
//        // left
//        case 3:
//            targetIndex = move( targetIndex, 1 ); // move left
//            break;
//
//        // right
//        case 4:
//            targetIndex = move( targetIndex, 2 ); // move right
//            break;
//
//        // lower left
//        case 5:
//            targetIndex = move( targetIndex, 1 ); // move left
//            targetIndex = move( targetIndex, 3 ); // move down
//            break;
//
//        // bottom
//        case 6:
//            targetIndex = move( targetIndex, 3 ); // move down
//            break;
//
//        // lower right
//        case 7:
//            targetIndex = move( targetIndex, 2 ); // move right
//            targetIndex = move( targetIndex, 3 ); // move down
//            break;
//    }
//
//    // make sure we're still in bounds
//    if ( targetIndex == tile.index || targetIndex === - 1 ) {
//        console.log( "erroneous request, aborting" );
//        return;
//    }
//    // get the "other" tile
//    var otherTile = tiles[ targetIndex ];
//
//    tile.hasPairing = true;
//    tile.pairDirection = position;
//
//    otherTile.upper = tile.upper;
//    otherTile.color = tile.color;
//    otherTile.hasPairing = true;
//    otherTile.pairDirection = position;
//    otherTile.draw( ctx );
//}
//
//var getPairedTiles = function()
//{
//    var out = [];
//
//    var i = tiles.length;
//
//    while ( i-- )
//    {
//        var tile = tiles[ i ];
//
//        if ( tile.hasPairing ) {
//            out.push( tile );
//        }
//    }
//    return out.reverse();
//};
//
///**
// * @public
// *
// * @param {number} targetIndex
// * @param {number} direction 1 for left, 2 for right, 3 for down, 4 for up
// * @return {number} the resulting index or -1 to indicate an invalid operation
// */
//function move( targetIndex, direction )
//{
//    var outIndex = targetIndex;
//
//    switch ( direction )
//    {
//        // left
//        case 1:
//
//            // move left (unless we're on the first tile of a new row, to prevent jumping
//            // to the outermost right tile of the previous row)
//            if ( outIndex % horizontalTileAmount != 0 )
//            {
//                --outIndex;
//            }
//            break;
//
//        // right
//        case 2:
//
//            // move right (unless we're on the last tile of a row, to prevent jumping
//            // to the outermost left tile of the next row)
//            if ( outIndex % horizontalTileAmount != ( horizontalTileAmount - 1 ))
//            {
//                ++outIndex;
//            }
//            break;
//
//        // down
//        case 3:
//
//            outIndex += horizontalTileAmount; // move down
//
//            // do we exceed the boundaries of the tiles ? then we
//            // were on the last row, halt movement
//            // TODO : this is wrong, will only work on last tile!
//            if ( outIndex >= tiles.length ) {
//                outIndex = -1;
//            }
//
//            break;
//
//        // up
//        case 4:
//
//            outIndex -= horizontalTileAmount; // move up
//
//            // are we below the boundaries of the tiles ? then we
//            // were on the first row, halt movement
//            // TODO : this is wrong, will only work on first row!
//            if ( outIndex < 0 ) {
//                outIndex = -1;
//            }
//            break;
//    }
//    return outIndex;
//}
},{}]},{},[1,2,3,4,5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQm9vdHN0cmFwLmpzIiwic3JjL2hlbHBlcnMvQ2FudmFzSGVscGVyLmpzIiwic3JjL3Byb2dyYW1zL2dsaXRjaGVyL0dsaXRjaGVyLmpzIiwic3JjL3Byb2dyYW1zL3RpbGVzL1RpbGUuanMiLCJzcmMvcHJvZ3JhbXMvdGlsZXMvVGlsZUFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIENhbnZhc0hlbHBlciA9IHJlcXVpcmUoIFwiLi9oZWxwZXJzL0NhbnZhc0hlbHBlclwiICk7XG5cbi8qIGFwcGxpY2F0aW9uIHByb3BlcnRpZXMgKi9cblxudmFyIGN2cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBcImNhbnZhc1wiICk7XG52YXIgY3R4ID0gY3ZzLmdldENvbnRleHQoIFwiMmRcIiApO1xudmFyIGNhbnZhc0hlbHBlciwgdywgaCwgb3V0cHV0U2l6ZSwgaW1hZ2U7XG5cbi8vIHRoZSBlZmZlY3Qgd2UncmUgY3VycmVudGx5IHJ1bm5pbmcgKGltcG9ydCBmcm9tIC4vcHJvZ3JhbXMgZm9sZGVyKVxuXG52YXIgZWZmZWN0ID0gcmVxdWlyZSggXCIuL3Byb2dyYW1zL2dsaXRjaGVyL0dsaXRjaGVyXCIgKTtcblxuLyogRE9NIGVsZW1lbnRzICovXG5cbnZhciBjdnNXaWR0aCAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJjYW52YXMtd2lkdGhcIiApO1xudmFyIGN2c0hlaWdodCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBcImNhbnZhcy1oZWlnaHRcIiApO1xudmFyIGNsZWFyQm94ICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBcImNsZWFyLWJnXCIgKTtcbnZhciBkb3dubG9hZCAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJkb3dubG9hZC1idG5cIiApO1xudmFyIGlucHV0ICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBcImZpbGUtaW5wdXRcIiApO1xuXG52YXIgc2FtcGxlU2l6ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBcInNhbXBsZS1zaXplXCIgKTtcbnZhciBzbWVhclNpemUgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwic21lYXItc2l6ZVwiICk7XG52YXIgc2tpcFNpemUgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBcInNraXAtc2l6ZVwiICk7XG5cbi8qIGV2ZW50IGhhbmRsZXJzICovXG5cbmNsZWFyQm94Lm9uY2hhbmdlICAgPVxuc2FtcGxlU2l6ZS5vbmNoYW5nZSA9XG5zbWVhclNpemUub25jaGFuZ2UgID0gcmVuZGVyO1xuXG5jdnNXaWR0aC5vbmNoYW5nZSA9IGN2c0hlaWdodC5vbmNoYW5nZSA9IHVwZGF0ZUNhbnZhc0RpbWVuc2lvbnMoKTtcblxuZnVuY3Rpb24gdXBkYXRlQ2FudmFzRGltZW5zaW9ucyggYUV2ZW50IClcbntcbiAgICB2YXIgd2lkdGggID0gcGFyc2VJbnQoIGN2c1dpZHRoLnZhbHVlLCAgMTAgKTtcbiAgICB2YXIgaGVpZ2h0ID0gcGFyc2VJbnQoIGN2c0hlaWdodC52YWx1ZSwgMTAgKTtcblxuICAgIGN2cy53aWR0aCAgPSB3aWR0aDtcbiAgICBjdnMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgcmVuZGVyKCk7XG59XG5cbmlucHV0Lm9uY2hhbmdlID0gZnVuY3Rpb24oIGFFdmVudCApXG57XG4gICAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpXG4gICAge1xuICAgICAgICBjYW52YXNIZWxwZXIgPSBuZXcgQ2FudmFzSGVscGVyKCBpbWFnZSApO1xuICAgICAgICB3ICAgICAgICAgICAgPSBpbWFnZS5uYXR1cmFsV2lkdGg7XG4gICAgICAgIGggICAgICAgICAgICA9IGltYWdlLm5hdHVyYWxIZWlnaHQ7XG4gICAgICAgIG91dHB1dFNpemUgICA9IGN2cy53aWR0aCAvIHc7XG5cbiAgICAgICAgY3ZzLmhlaWdodCA9IGggLyB3ICogY3ZzLndpZHRoO1xuXG4gICAgICAgIGN2c0hlaWdodC5zZXRBdHRyaWJ1dGUoIFwidmFsdWVcIiwgY3ZzLmhlaWdodCApO1xuXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBcInByZXZpZXdcIiApLnNyYyA9IGltYWdlLnNyYztcbiAgICAgICAgcmVuZGVyKCk7XG4gICAgfTtcbiAgICBpbWFnZS5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKCBhRXZlbnQudGFyZ2V0LmZpbGVzWyAwIF0pO1xufTtcblxuZG93bmxvYWQub25jbGljayA9IGZ1bmN0aW9uKCBhRXZlbnQgKVxue1xuICAgIHZhciBwb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImFcIiApO1xuICAgIHBvbS5zZXRBdHRyaWJ1dGUoIFwiaHJlZlwiLCBjdnMudG9EYXRhVVJMKCBcImltYWdlL2pwZWdcIiApKTtcbiAgICBwb20uc2V0QXR0cmlidXRlKCBcImRvd25sb2FkXCIsIFwiaW1hZ2UuanBnXCIgKTtcbiAgICBwb20uY2xpY2soKTtcbn07XG5cbmZ1bmN0aW9uIHJlbmRlcigpXG57XG4gICAgaWYgKCAhaW1hZ2UgKVxuICAgICAgICByZXR1cm47XG5cbiAgICAvLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGRyYXcgKTtcblxuICAgIGN0eC5maWxsU3R5bGUgPSBcIiNGRkZGRkZcIjtcblxuICAgIGlmICggY2xlYXJCb3guY2hlY2tlZCApXG4gICAgICAgIGN0eC5maWxsUmVjdCggMCwgMCwgY3ZzLndpZHRoLCBjdnMuaGVpZ2h0ICk7XG5cbiAgICBlZmZlY3QucmVuZGVyKCBjdHgsIGN2cy53aWR0aCwgY3ZzLmhlaWdodCwgY2FudmFzSGVscGVyLCBzYW1wbGVTaXplLnZhbHVlLCBzbWVhclNpemUudmFsdWUsIHNraXBTaXplLnZhbHVlICk7XG59XG5cbnVwZGF0ZUNhbnZhc0RpbWVuc2lvbnMoKTsgLy8gZm9yY2UgbWF0Y2ggdG8gaW5wdXQgZmllbGQgdmFsdWVzIG9uIGxhdW5jaFxuIiwibW9kdWxlLmV4cG9ydHMgPSBDYW52YXNIZWxwZXI7XG5cbi8qKlxuICogQ3JlYXRlZCB3aXRoIEludGVsbGlKIElERUEuXG4gKiBVc2VyOiBpZ29yemlua2VuXG4gKiBEYXRlOiAyNC0wMi0xNFxuICogVGltZTogMjE6MjRcbiAqIFRvIGNoYW5nZSB0aGlzIHRlbXBsYXRlIHVzZSBGaWxlIHwgU2V0dGluZ3MgfCBGaWxlIFRlbXBsYXRlcy5cbiAqL1xuZnVuY3Rpb24gQ2FudmFzSGVscGVyKCBpbWFnZSApXG57XG4gICAgdGhpcy5pbWFnZSA9IGltYWdlO1xuXG4gICAgLy8gcHJlcGFyZSBmb3IgY3J1bmNoaW5nXG4gICAgdmFyIGNhbnZhcyAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImNhbnZhc1wiICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCAmJiBjYW52YXMuZ2V0Q29udGV4dCggXCIyZFwiICk7XG5cbiAgICB0aGlzLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5uYXR1cmFsSGVpZ2h0IHx8IGltYWdlLm9mZnNldEhlaWdodCB8fCBpbWFnZS5oZWlnaHQ7XG4gICAgdGhpcy53aWR0aCAgPSBjYW52YXMud2lkdGggID0gaW1hZ2UubmF0dXJhbFdpZHRoICB8fCBpbWFnZS5vZmZzZXRXaWR0aCAgfHwgaW1hZ2Uud2lkdGg7XG5cbiAgICBjb250ZXh0LmRyYXdJbWFnZSggaW1hZ2UsIDAsIDAgKTtcblxuICAgIHRyeSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKCAwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCApLmRhdGE7XG4gICAgfVxuICAgIGNhdGNoKCBlIClcbiAgICB7XG4gICAgICAgIC8qIHNlY3VyaXR5IGVycm9yLCBpbWcgb24gZGlmZiBkb21haW4gKi9hbGVydCgneCcpO1xuICAgIH1cbn1cblxuLyogY2xhc3MgcHJvcGVydGllcyAqL1xuXG4vKiogQHB1YmxpYyBAdHlwZSB7RWxlbWVudH0gKi8gICBDYW52YXNIZWxwZXIucHJvdG90eXBlLmltYWdlO1xuLyoqIEBwdWJsaWMgQHR5cGUge0ltYWdlRGF0YX0gKi8gQ2FudmFzSGVscGVyLnByb3RvdHlwZS5kYXRhO1xuLyoqIEBwdWJsaWMgQHR5cGUge251bWJlcn0gKi8gICAgQ2FudmFzSGVscGVyLnByb3RvdHlwZS53aWR0aDtcbi8qKiBAcHVibGljIEB0eXBlIHtudW1iZXJ9ICovICAgIENhbnZhc0hlbHBlci5wcm90b3R5cGUuaGVpZ2h0O1xuXG4vKiBwdWJsaWMgbWV0aG9kcyAqL1xuXG5DYW52YXNIZWxwZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpXG57XG4gICAgdGhpcy5kYXRhID0gbnVsbDtcbn07XG5cbi8qKlxuICogcmV0cmlldmUgdGhlIGNvbG9yIGN1cnJlbnRseSBwcmVzZW50IG9uIHRoZSBDYW52YXMgdW5kZXJcbiAqIGdpdmVuIHBvaW50IHdpdGggY29vcmRpbmF0ZXMgeCBhbmQgeSBvciB1bmRlciBnaXZlbiByZWN0XG4gKiBhdCBjb29yZGluYXRlcyB4IGFuZCB5IGZvciBhIHJlY3RhbmdsZSBzaXplIG9mIGdpdmVuIGJsb2NrU2l6ZVxuICpcbiAqIEBwdWJsaWNcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0geFxuICogQHBhcmFtIHtudW1iZXJ9IHlcbiAqIEBwYXJhbSB7bnVtYmVyfSBibG9ja1NpemVcbiAqIEBwYXJhbSB7bnVtYmVyPX0gc21lYXIgb3B0aW9uYWwgXCJzbWVhcmluZ1wiIGluIHRoZSB3aWR0aCwgZGVmYXVsdHMgdG8gMSAobm8gZWZmZWN0KVxuICogQHJldHVybiB7e3I6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXJ9fVxuICovXG5DYW52YXNIZWxwZXIucHJvdG90eXBlLmdldENvbG9yID0gZnVuY3Rpb24oIHgsIHksIGJsb2NrU2l6ZSwgc21lYXIgKVxue1xuICAgIHZhciBsZW4gPSA0OyAgICAvLyBhbW91bnQgb2YgYmxvY2tzIHBlciBwaXhlbCAoUixHLEIsQSlcbiAgICB2YXIgcmdiID0ge3I6MCxnOjAsYjowfTsgLy8gbm8gYWxwaGEgKCB3b3VsZCBiZSBmb3VydGggaW5kZXggKVxuICAgIHNtZWFyICAgPSBzbWVhciB8fCAxO1xuXG4gICAgaWYgKCB4IDwgMCApXG4gICAgICAgIHggPSAwO1xuICAgIGlmICggeCA+PSB0aGlzLndpZHRoIClcbiAgICAgICAgeCA9IHRoaXMud2lkdGggLSAxO1xuXG4gICAgaWYgKCB5IDwgMCApXG4gICAgICAgIHkgPSAwO1xuICAgIGlmICggeSA+PSB0aGlzLmhlaWdodCApXG4gICAgICAgIHkgPSB0aGlzLmhlaWdodCAtIDE7XG5cbiAgICB2YXIgbWF4TGVuZ3RoICAgPSB0aGlzLmRhdGEubGVuZ3RoO1xuICAgIHZhciBzdGFydE9mZnNldCA9ICggeCAqIGxlbiApICsgKCB5ICogbGVuICogdGhpcy53aWR0aCApO1xuICAgIHZhciBlbmRPZmZzZXQgICA9IHN0YXJ0T2Zmc2V0ICsgKCggYmxvY2tTaXplICogYmxvY2tTaXplICkgKiBsZW4gKSAqIHNtZWFyO1xuXG4gICAgaWYgKCBlbmRPZmZzZXQgPiBtYXhMZW5ndGggKVxuICAgICAgICBlbmRPZmZzZXQgPSBtYXhMZW5ndGg7XG5cbiAgICB2YXIgY291bnQgPSAwO1xuICAgIHZhciBpICAgICA9IHN0YXJ0T2Zmc2V0IC0gbGVuO1xuXG4gICAgLy9jb25zb2xlLmxvZyggXCJtYXggPiBcIiArIG1heExlbmd0aCArIFwiIHZzIFwiICsgdGhpcy53aWR0aCArIFwiIHggXCIgKyB0aGlzLmhlaWdodCArIFwiIHN0YXJ0ID4gXCIgKyBzdGFydE9mZnNldCArIFwiIGVuZCA+IFwiICsgZW5kT2Zmc2V0KTtcbiAgICAvL3JldHVybjtcbiAgICB3aGlsZSAoKCBpICs9IGJsb2NrU2l6ZSAqIGxlbiApIDwgZW5kT2Zmc2V0IClcbiAgICB7XG4gICAgICAgICsrY291bnQ7XG4gICAgICAgIHJnYi5yICs9IHRoaXMuZGF0YVsgaSBdO1xuICAgICAgICByZ2IuZyArPSB0aGlzLmRhdGFbIGkgKyAxIF07XG4gICAgICAgIHJnYi5iICs9IHRoaXMuZGF0YVsgaSArIDIgXTtcbiAgICB9XG5cbiAgICAvLyB+fiB1c2VkIHRvIGZsb29yIHZhbHVlc1xuICAgIHJnYi5yID0gfn4oIHJnYi5yIC8gY291bnQgKTtcbiAgICByZ2IuZyA9IH5+KCByZ2IuZyAvIGNvdW50ICk7XG4gICAgcmdiLmIgPSB+figgcmdiLmIgLyBjb3VudCApO1xuXG4gICAgcmV0dXJuIHJnYjtcbn07XG4iLCJ2YXIgR2xpdGNoZXIgPSBtb2R1bGUuZXhwb3J0cyA9XG57XG4gICAgLyogcHVibGljIG1ldGhvZHMgKi9cblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBhQ29udGV4dFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhV2lkdGggdG90YWwgd2lkdGggb2YgdGhlIGNhbnZhc1xuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhSGVpZ2h0IHRvdGFsIGhlaWdodCBvZiB0aGUgY2FudmFzXG4gICAgICogQHBhcmFtIHtDYW52YXNIZWxwZXJ9IGFDYW52YXNIZWxwZXIgcmVmZXJlbmNlIHRvIHRoZSBDYW52YXNIZWxwZXJcbiAgICAgKiAgICAgICAgY29udGFpbnMgdGhlIEltYWdlIHRvIGRyYXcgaW4gcHJvcGVydHkgLmltYWdlXG4gICAgICovXG4gICAgcmVuZGVyIDogZnVuY3Rpb24oIGFDb250ZXh0LCBhV2lkdGgsIGFIZWlnaHQsIGFDYW52YXNIZWxwZXIsIHNhbXBsZVNpemUsIHNtZWFyU2l6ZSwgc2tpcFNpemUgKVxuICAgIHtcbiAgICAgICAgdmFyIGltYWdlICAgICAgID0gYUNhbnZhc0hlbHBlci5pbWFnZTtcbiAgICAgICAgdmFyIGltYWdlV2lkdGggID0gaW1hZ2Uud2lkdGg7XG4gICAgICAgIHZhciBpbWFnZUhlaWdodCA9IGltYWdlLmhlaWdodDtcblxuICAgICAgICAvLyBjcmVhdGUgc2FtcGxlcyBmcm9tIHRoZSBpbWFnZVxuXG4gICAgICAgIHZhciBzYW1wbGVXaWR0aCA9IC8qMjAqL3NtZWFyU2l6ZSwgc2FtcGxlSGVpZ2h0ID0gaW1hZ2VIZWlnaHQ7XG5cbiAgICAgICAgdmFyIHNhbXBsZXMgICAgICA9IFtdO1xuICAgICAgICB2YXIgdG1wQ2FudmFzICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJjYW52YXNcIiApO1xuICAgICAgICB2YXIgdG1wQ3R4ICAgICAgID0gdG1wQ2FudmFzLmdldENvbnRleHQoIFwiMmRcIiApO1xuICAgICAgICB0bXBDYW52YXMuaGVpZ2h0ID0gaW1hZ2VIZWlnaHQ7XG4gICAgICAgIHRtcENhbnZhcy53aWR0aCAgPSBzYW1wbGVXaWR0aDtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBpbWFnZVdpZHRoOyBpICs9IHRtcENhbnZhcy53aWR0aCApXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRtcEN0eC5kcmF3SW1hZ2UoIGltYWdlLCBpLCAwLCBzYW1wbGVXaWR0aCwgc2FtcGxlSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgMCwgc2FtcGxlV2lkdGgsIHNhbXBsZUhlaWdodCApO1xuXG4gICAgICAgICAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWcuc3JjID0gdG1wQ2FudmFzLnRvRGF0YVVSTCggXCJpbWFnZS9qcGVnXCIgKTtcblxuICAgICAgICAgICAgc2FtcGxlcy5wdXNoKCBpbWcgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFFRUSA6IGRyYXdpbmcgc2FtcGxlc1xuXG4gICAgICAgIHZhciB0YXJnZXRXaWR0aCA9IGFXaWR0aCAvIHNhbXBsZXMubGVuZ3RoO1xuXG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgc2FtcGxlcy5sZW5ndGg7ICsraSApXG4gICAgICAgIHtcblxuICAgICAgICAgICAgdmFyIGRvZW4gPSBpICUgc2FtcGxlU2l6ZSA9PSAwO1xuXG4gICAgICAgICAgICBpZiAoIGRvZW4gKSB7XG4gICAgICAgICAgICAgICAgYUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICAgICAgICAgIGFDb250ZXh0LnRyYW5zbGF0ZSggYVdpZHRoIC8gMiwgYUhlaWdodCAvIDIgKTtcbiAgICAgICAgICAgICAgICBhQ29udGV4dC5yb3RhdGUoIE1hdGguUEkgLyA0ICk7XG4gICAgICAgICAgICAgICAgYUNvbnRleHQudHJhbnNsYXRlKCAtYVdpZHRoIC8gMiwgLWFIZWlnaHQgLyAyICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhQ29udGV4dC5kcmF3SW1hZ2UoIHNhbXBsZXNbIGkgXSwgMCwgMCwgc2FtcGxlV2lkdGgsIHNhbXBsZUhlaWdodCxcbiAgICAgICAgICAgIGkgKiAvKnRhcmdldFdpZHRoKi9NYXRoLm1heCgxLHNraXBTaXplKSwgMCwgdGFyZ2V0V2lkdGgsIGFIZWlnaHQgKTtcblxuICAgICAgICAgICAgaWYgKCBkb2VuICkge1xuICAgICAgICAgICAgICAgIGFDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICB9XG5cbi8vICAgICAgICBhQ29udGV4dC5kcmF3SW1hZ2UoIGltYWdlLCAwLCAwLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgMCwgYVdpZHRoLCBhSGVpZ2h0ICk7XG4gICAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gVGlsZTtcblxuZnVuY3Rpb24gVGlsZSggaSwgciwgZywgYiwgeCwgeSwgc2l6ZSApXG57XG4gICAgdGhpcy5pbmRleCA9IGk7XG4gICAgdGhpcy5jb2xvciA9IFwicmdiYShcIiArIHIgKyBcIixcIiArIGcgKyBcIixcIiArIGIgKyBcIiwyNTUpXCI7XG4gICAgdGhpcy54ICAgICA9IHggfHwgMDtcbiAgICB0aGlzLnkgICAgID0geSB8fCAwO1xuICAgIHRoaXMuc2l6ZSAgPSBzaXplIHx8IDE1O1xuICAgIHRoaXMudXBwZXIgPSBNYXRoLnJhbmRvbSgpID4gLjU7XG59XG5cbi8qIGNsYXNzIHByb3BlcnRpZXMgKi9cblxuLyoqIEBwdWJsaWMgQHR5cGUge251bWJlcn0gKi8gIFRpbGUucHJvdG90eXBlLmluZGV4O1xuLyoqIEBwdWJsaWMgQHR5cGUge251bWJlcn0gKi8gIFRpbGUucHJvdG90eXBlLng7XG4vKiogQHB1YmxpYyBAdHlwZSB7bnVtYmVyfSAqLyAgVGlsZS5wcm90b3R5cGUueTtcbi8qKiBAcHVibGljIEB0eXBlIHtudW1iZXJ9ICovICBUaWxlLnByb3RvdHlwZS5zaXplO1xuLyoqIEBwdWJsaWMgQHR5cGUge251bWJlcn0gKi8gIFRpbGUucHJvdG90eXBlLnVwcGVyO1xuLyoqIEBwdWJsaWMgQHR5cGUge251bWJlcn0gKi8gIFRpbGUucHJvdG90eXBlLmNvbG9yO1xuLyoqIEBwdWJsaWMgQHR5cGUge2Jvb2xlYW59ICovIFRpbGUucHJvdG90eXBlLmhhc1BhaXJpbmcgPSBmYWxzZTtcbi8qKiBAcHVibGljIEB0eXBlIHtudW1iZXJ9ICovICBUaWxlLnByb3RvdHlwZS5wYWlyRGlyZWN0aW9uID0gMDtcblxuVGlsZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCBjdHggKVxue1xuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xuICAgIGN0eC5iZWdpblBhdGgoKTtcblxuICAgIGlmICggdGhpcy51cHBlciApXG4gICAge1xuICAgICAgICBjdHgubW92ZVRvKCB0aGlzLngsIHRoaXMueSApO1xuICAgICAgICBjdHgubGluZVRvKCB0aGlzLnggKyB0aGlzLnNpemUsIHRoaXMueSApO1xuICAgICAgICBjdHgubGluZVRvKCB0aGlzLngsIHRoaXMueSArIHRoaXMuc2l6ZSApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY3R4Lm1vdmVUbyggdGhpcy54LCB0aGlzLnkgKyB0aGlzLnNpemUgKTtcbiAgICAgICAgY3R4LmxpbmVUbyggdGhpcy54ICsgdGhpcy5zaXplLCB0aGlzLnkgKyB0aGlzLnNpemUgKTtcbiAgICAgICAgY3R4LmxpbmVUbyggdGhpcy54LCB0aGlzLnkgKTtcbiAgICB9XG4gICAgY3R4LmZpbGwoKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG59O1xuIiwiLy92YXIgQ2FudmFzSGVscGVyID0gcmVxdWlyZSggXCIuLi8uLi9oZWxwZXJzL0NhbnZhc0hlbHBlclwiICk7XG4vL3ZhciBUaWxlICAgICAgICAgPSByZXF1aXJlKCBcIi4vVGlsZVwiICk7XG4vL1xuLy92YXIgY3ZzICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJjYW52YXNcIiApO1xuLy92YXIgY3R4ICAgPSBjdnMuZ2V0Q29udGV4dCggXCIyZFwiICk7XG4vL1xuLy92YXIgdGlsZXMgPSBbXTtcbi8vXG4vL2Z1bmN0aW9uIGRyYXcoKVxuLy97XG4vLyAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSggZHJhdyApO1xuLy9cbi8vICAgIGN0eC5maWxsU3R5bGUgPSBcIiNGRkZGRkZcIjtcbi8vXG4vLyAgICBpZiAoIGNsZWFyQm94LmNoZWNrZWQgKVxuLy8gICAgICAgIGN0eC5maWxsUmVjdCggMCwgMCwgY3ZzLndpZHRoLCBjdnMuaGVpZ2h0ICk7XG4vL1xuLy8gICAgZm9yICggdmFyIGkgPSAwLCBsID0gdGlsZXMubGVuZ3RoOyBpIDwgbDsgKytpIClcbi8vICAgIHtcbi8vICAgICAgICB0aWxlc1sgaSBdLmRyYXcoIGN0eCApO1xuLy8gICAgfVxuLy99XG4vL1xuLy92YXIgY2FudmFzSGVscGVyLCB3LCBoLCBvdXRwdXRTaXplLCBob3Jpem9udGFsVGlsZUFtb3VudCwgdmVydGljYWxUaWxlQW1vdW50O1xuLy9cbi8vZnVuY3Rpb24gcmVuZGVyKClcbi8ve1xuLy8gICAgdGlsZXMgPSBbXTsgLy8gY2xlYXIgcHJldmlvdXMgdGlsZXNcbi8vXG4vLyAgICB2YXIgdGhlT3V0cHV0U2l6ZSA9IG91dHB1dFNpemUgKiBpbmNyO1xuLy9cbi8vICAgIGZvciAoIHZhciBpeSA9IDA7IGl5IDwgaDsgaXkgKz0gaW5jciApXG4vLyAgICB7XG4vLyAgICAgICAgZm9yICggdmFyIGl4ID0gMDsgaXggPCB3OyBpeCArPSBpbmNyIClcbi8vICAgICAgICB7XG4vLyAgICAgICAgICAgIHZhciByZ2IgPSBjYW52YXNIZWxwZXIuZ2V0Q29sb3IoIGl4LCBpeSwgc2l6ZSwgc21lYXIgKTtcbi8vXG4vLyAgICAgICAgICAgIHZhciB0aWxlID0gbmV3IFRpbGUoIHRpbGVzLmxlbmd0aCwgcmdiLnIsIHJnYi5nLCByZ2IuYiwgaXggKiBvdXRwdXRTaXplLCBpeSAqIG91dHB1dFNpemUsIHRoZU91dHB1dFNpemUgKTtcbi8vICAgICAgICAgICAgdGlsZS54aW5kZXggPSBpeDtcbi8vICAgICAgICAgICAgdGlsZS55aW5kZXggPSBpeTtcbi8vICAgICAgICAgICAgdGlsZXMucHVzaCggdGlsZSApO1xuLy8gICAgICAgIH1cbi8vICAgIH1cbi8vICAgIGhvcml6b250YWxUaWxlQW1vdW50ID0gaXggLyBpbmNyO1xuLy8gICAgdmVydGljYWxUaWxlQW1vdW50ICAgPSBpeSAvIGluY3I7XG4vL1xuLy8gICAgY29uc29sZS5sb2coIFwiYW1vdW50IG9mIHRpbGVzIGdlbmVyYXRlZCA+IFwiICsgdGlsZXMubGVuZ3RoICk7XG4vLyAgICBkcmF3KCk7XG4vL31cbi8vXG4vL3ZhciBzaXplICAgICA9IDE7IC8vIHByZWZlcnJlZCBzYW1wbGUgYmxvY2sgc2l6ZSBpbiBwaXhlbHNcbi8vdmFyIGluY3IgICAgID0gMTtcbi8vdmFyIHNtZWFyICAgID0gMTtcbi8vdmFyIHNzU2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwic2FtcGxlLXNpemVcIiApO1xuLy92YXIgc21TbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJzbWVhci1zaXplXCIgKTtcbi8vdmFyIHNrU2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwic2tpcC1zaXplXCIgKTtcbi8vdmFyIGNsZWFyQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwiY2xlYXItYmdcIiApO1xuLy9cbi8vY2xlYXJCb3gub25jaGFuZ2UgPSBkcmF3O1xuLy9cbi8vc3NTbGlkZXIub25jaGFuZ2UgPSBmdW5jdGlvbiggZSApIHtcbi8vICAgIHNpemUgPSBlLnRhcmdldC52YWx1ZTtcbi8vICAgIHJlcVJlbmRlcigpO1xuLy99O1xuLy9cbi8vc21TbGlkZXIub25jaGFuZ2UgPSBmdW5jdGlvbiggZSApIHtcbi8vICAgIHNtZWFyID0gZS50YXJnZXQudmFsdWU7XG4vLyAgICByZXFSZW5kZXIoKTtcbi8vfTtcbi8vXG4vL3NrU2xpZGVyLm9uY2hhbmdlID0gZnVuY3Rpb24oIGUgKSB7XG4vLyAgICBpbmNyID0gcGFyc2VJbnQoIGUudGFyZ2V0LnZhbHVlICkgKyAxO1xuLy8gICAgcmVxUmVuZGVyKCk7XG4vL307XG4vL1xuLy92YXIgcml2YWw7XG4vL3ZhciByZXFSZW5kZXIgPSBmdW5jdGlvbigpXG4vL3tcbi8vICAgIGNsZWFyVGltZW91dCggcml2YWwgKTtcbi8vICAgIHJpdmFsID0gc2V0VGltZW91dCggZnVuY3Rpb24oKVxuLy8gICAge1xuLy8gICAgICAgIGNsZWFyVGltZW91dCggcml2YWwgKTtcbi8vICAgICAgICByZW5kZXIoKTtcbi8vICAgIH0sIDEwMCApO1xuLy99O1xuLy9cbi8vdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZpbGUtaW5wdXQnKTtcbi8vaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgaGFuZGxlRmlsZXMpO1xuLy9cbi8vZnVuY3Rpb24gaGFuZGxlRmlsZXMoIGUgKVxuLy97XG4vLyAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XG4vLyAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKVxuLy8gICAge1xuLy8gICAgICAgIGlmICggY2FudmFzSGVscGVyICkge1xuLy8gICAgICAgICAgICBjYW52YXNIZWxwZXIuZGVzdHJveSgpO1xuLy8gICAgICAgIH1cbi8vICAgICAgICBjYW52YXNIZWxwZXIgPSBuZXcgQ2FudmFzSGVscGVyKCBpbWcgKTtcbi8vICAgICAgICB3ICAgICAgICAgICAgPSBpbWcubmF0dXJhbFdpZHRoO1xuLy8gICAgICAgIGggICAgICAgICAgICA9IGltZy5uYXR1cmFsSGVpZ2h0O1xuLy8gICAgICAgIG91dHB1dFNpemUgICA9IGN2cy53aWR0aCAvIHc7XG4vL1xuLy8gICAgICAgIGN2cy5oZWlnaHQgPSBoIC8gdyAqIGN2cy53aWR0aDtcbi8vXG4vLyAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwicHJldmlld1wiKS5zcmMgPSBpbWcuc3JjO1xuLy8gICAgICAgIHJlbmRlcigpO1xuLy8gICAgfTtcbi8vICAgIGltZy5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGUudGFyZ2V0LmZpbGVzWzBdKTtcbi8vfVxuLy9cbi8vLyoqXG4vLyAqXG4vLyAqIEBwYXJhbSB7VGlsZX0gdGlsZVxuLy8gKiBAcGFyYW0ge251bWJlcn0gcG9zaXRpb24gb2YgdGhlIHRpbGUgdG8gYmUgcGFpcmVkIHdpdGgsIGNhbiBiZVxuLy8gKiAgICAgICAgICAgICAgICAgMCA9IHVwcGVyIGxlZnQsIDEgPSB0b3AsIDIgPSB1cHBlciByaWdodCxcbi8vICogICAgICAgICAgICAgICAgIDMgPSBsZWZ0LCA0ID0gcmlnaHQsIDUgPSBsb3dlciBsZWZ0LCA2ID0gYm90dG9tLCA3ID0gbG93ZXIgcmlnaHRcbi8vICovXG4vL2Z1bmN0aW9uIGdldFBhaXJpbmcoIHRpbGUsIHBvc2l0aW9uIClcbi8ve1xuLy8gICAgdmFyIHRhcmdldEluZGV4ID0gdGlsZS5pbmRleDtcbi8vXG4vLyAgICBzd2l0Y2ggKCBwb3NpdGlvbiApXG4vLyAgICB7XG4vLyAgICAgICAgLy8gdXBwZXIgbGVmdFxuLy8gICAgICAgIGNhc2UgMDpcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgMSApOyAvLyBtb3ZlIGxlZnRcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgNCApOyAvLyBtb3ZlIHVwXG4vLyAgICAgICAgICAgIGJyZWFrO1xuLy9cbi8vICAgICAgICAvLyB0b3Bcbi8vICAgICAgICBjYXNlIDE6XG4vLyAgICAgICAgICAgIHRhcmdldEluZGV4ID0gbW92ZSggdGFyZ2V0SW5kZXgsIDQgKTtcbi8vICAgICAgICAgICAgYnJlYWs7XG4vL1xuLy8gICAgICAgIC8vIHVwcGVyIHJpZ2h0XG4vLyAgICAgICAgY2FzZSAyOlxuLy8gICAgICAgICAgICB0YXJnZXRJbmRleCA9IG1vdmUoIHRhcmdldEluZGV4LCAyICk7IC8vIG1vdmUgcmlnaHRcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgNCApOyAvLyBtb3ZlIHVwXG4vLyAgICAgICAgICAgIGJyZWFrO1xuLy9cbi8vICAgICAgICAvLyBsZWZ0XG4vLyAgICAgICAgY2FzZSAzOlxuLy8gICAgICAgICAgICB0YXJnZXRJbmRleCA9IG1vdmUoIHRhcmdldEluZGV4LCAxICk7IC8vIG1vdmUgbGVmdFxuLy8gICAgICAgICAgICBicmVhaztcbi8vXG4vLyAgICAgICAgLy8gcmlnaHRcbi8vICAgICAgICBjYXNlIDQ6XG4vLyAgICAgICAgICAgIHRhcmdldEluZGV4ID0gbW92ZSggdGFyZ2V0SW5kZXgsIDIgKTsgLy8gbW92ZSByaWdodFxuLy8gICAgICAgICAgICBicmVhaztcbi8vXG4vLyAgICAgICAgLy8gbG93ZXIgbGVmdFxuLy8gICAgICAgIGNhc2UgNTpcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgMSApOyAvLyBtb3ZlIGxlZnRcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgMyApOyAvLyBtb3ZlIGRvd25cbi8vICAgICAgICAgICAgYnJlYWs7XG4vL1xuLy8gICAgICAgIC8vIGJvdHRvbVxuLy8gICAgICAgIGNhc2UgNjpcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgMyApOyAvLyBtb3ZlIGRvd25cbi8vICAgICAgICAgICAgYnJlYWs7XG4vL1xuLy8gICAgICAgIC8vIGxvd2VyIHJpZ2h0XG4vLyAgICAgICAgY2FzZSA3OlxuLy8gICAgICAgICAgICB0YXJnZXRJbmRleCA9IG1vdmUoIHRhcmdldEluZGV4LCAyICk7IC8vIG1vdmUgcmlnaHRcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgMyApOyAvLyBtb3ZlIGRvd25cbi8vICAgICAgICAgICAgYnJlYWs7XG4vLyAgICB9XG4vL1xuLy8gICAgLy8gbWFrZSBzdXJlIHdlJ3JlIHN0aWxsIGluIGJvdW5kc1xuLy8gICAgaWYgKCB0YXJnZXRJbmRleCA9PSB0aWxlLmluZGV4IHx8IHRhcmdldEluZGV4ID09PSAtIDEgKSB7XG4vLyAgICAgICAgY29uc29sZS5sb2coIFwiZXJyb25lb3VzIHJlcXVlc3QsIGFib3J0aW5nXCIgKTtcbi8vICAgICAgICByZXR1cm47XG4vLyAgICB9XG4vLyAgICAvLyBnZXQgdGhlIFwib3RoZXJcIiB0aWxlXG4vLyAgICB2YXIgb3RoZXJUaWxlID0gdGlsZXNbIHRhcmdldEluZGV4IF07XG4vL1xuLy8gICAgdGlsZS5oYXNQYWlyaW5nID0gdHJ1ZTtcbi8vICAgIHRpbGUucGFpckRpcmVjdGlvbiA9IHBvc2l0aW9uO1xuLy9cbi8vICAgIG90aGVyVGlsZS51cHBlciA9IHRpbGUudXBwZXI7XG4vLyAgICBvdGhlclRpbGUuY29sb3IgPSB0aWxlLmNvbG9yO1xuLy8gICAgb3RoZXJUaWxlLmhhc1BhaXJpbmcgPSB0cnVlO1xuLy8gICAgb3RoZXJUaWxlLnBhaXJEaXJlY3Rpb24gPSBwb3NpdGlvbjtcbi8vICAgIG90aGVyVGlsZS5kcmF3KCBjdHggKTtcbi8vfVxuLy9cbi8vdmFyIGdldFBhaXJlZFRpbGVzID0gZnVuY3Rpb24oKVxuLy97XG4vLyAgICB2YXIgb3V0ID0gW107XG4vL1xuLy8gICAgdmFyIGkgPSB0aWxlcy5sZW5ndGg7XG4vL1xuLy8gICAgd2hpbGUgKCBpLS0gKVxuLy8gICAge1xuLy8gICAgICAgIHZhciB0aWxlID0gdGlsZXNbIGkgXTtcbi8vXG4vLyAgICAgICAgaWYgKCB0aWxlLmhhc1BhaXJpbmcgKSB7XG4vLyAgICAgICAgICAgIG91dC5wdXNoKCB0aWxlICk7XG4vLyAgICAgICAgfVxuLy8gICAgfVxuLy8gICAgcmV0dXJuIG91dC5yZXZlcnNlKCk7XG4vL307XG4vL1xuLy8vKipcbi8vICogQHB1YmxpY1xuLy8gKlxuLy8gKiBAcGFyYW0ge251bWJlcn0gdGFyZ2V0SW5kZXhcbi8vICogQHBhcmFtIHtudW1iZXJ9IGRpcmVjdGlvbiAxIGZvciBsZWZ0LCAyIGZvciByaWdodCwgMyBmb3IgZG93biwgNCBmb3IgdXBcbi8vICogQHJldHVybiB7bnVtYmVyfSB0aGUgcmVzdWx0aW5nIGluZGV4IG9yIC0xIHRvIGluZGljYXRlIGFuIGludmFsaWQgb3BlcmF0aW9uXG4vLyAqL1xuLy9mdW5jdGlvbiBtb3ZlKCB0YXJnZXRJbmRleCwgZGlyZWN0aW9uIClcbi8ve1xuLy8gICAgdmFyIG91dEluZGV4ID0gdGFyZ2V0SW5kZXg7XG4vL1xuLy8gICAgc3dpdGNoICggZGlyZWN0aW9uIClcbi8vICAgIHtcbi8vICAgICAgICAvLyBsZWZ0XG4vLyAgICAgICAgY2FzZSAxOlxuLy9cbi8vICAgICAgICAgICAgLy8gbW92ZSBsZWZ0ICh1bmxlc3Mgd2UncmUgb24gdGhlIGZpcnN0IHRpbGUgb2YgYSBuZXcgcm93LCB0byBwcmV2ZW50IGp1bXBpbmdcbi8vICAgICAgICAgICAgLy8gdG8gdGhlIG91dGVybW9zdCByaWdodCB0aWxlIG9mIHRoZSBwcmV2aW91cyByb3cpXG4vLyAgICAgICAgICAgIGlmICggb3V0SW5kZXggJSBob3Jpem9udGFsVGlsZUFtb3VudCAhPSAwIClcbi8vICAgICAgICAgICAge1xuLy8gICAgICAgICAgICAgICAgLS1vdXRJbmRleDtcbi8vICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICBicmVhaztcbi8vXG4vLyAgICAgICAgLy8gcmlnaHRcbi8vICAgICAgICBjYXNlIDI6XG4vL1xuLy8gICAgICAgICAgICAvLyBtb3ZlIHJpZ2h0ICh1bmxlc3Mgd2UncmUgb24gdGhlIGxhc3QgdGlsZSBvZiBhIHJvdywgdG8gcHJldmVudCBqdW1waW5nXG4vLyAgICAgICAgICAgIC8vIHRvIHRoZSBvdXRlcm1vc3QgbGVmdCB0aWxlIG9mIHRoZSBuZXh0IHJvdylcbi8vICAgICAgICAgICAgaWYgKCBvdXRJbmRleCAlIGhvcml6b250YWxUaWxlQW1vdW50ICE9ICggaG9yaXpvbnRhbFRpbGVBbW91bnQgLSAxICkpXG4vLyAgICAgICAgICAgIHtcbi8vICAgICAgICAgICAgICAgICsrb3V0SW5kZXg7XG4vLyAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgYnJlYWs7XG4vL1xuLy8gICAgICAgIC8vIGRvd25cbi8vICAgICAgICBjYXNlIDM6XG4vL1xuLy8gICAgICAgICAgICBvdXRJbmRleCArPSBob3Jpem9udGFsVGlsZUFtb3VudDsgLy8gbW92ZSBkb3duXG4vL1xuLy8gICAgICAgICAgICAvLyBkbyB3ZSBleGNlZWQgdGhlIGJvdW5kYXJpZXMgb2YgdGhlIHRpbGVzID8gdGhlbiB3ZVxuLy8gICAgICAgICAgICAvLyB3ZXJlIG9uIHRoZSBsYXN0IHJvdywgaGFsdCBtb3ZlbWVudFxuLy8gICAgICAgICAgICAvLyBUT0RPIDogdGhpcyBpcyB3cm9uZywgd2lsbCBvbmx5IHdvcmsgb24gbGFzdCB0aWxlIVxuLy8gICAgICAgICAgICBpZiAoIG91dEluZGV4ID49IHRpbGVzLmxlbmd0aCApIHtcbi8vICAgICAgICAgICAgICAgIG91dEluZGV4ID0gLTE7XG4vLyAgICAgICAgICAgIH1cbi8vXG4vLyAgICAgICAgICAgIGJyZWFrO1xuLy9cbi8vICAgICAgICAvLyB1cFxuLy8gICAgICAgIGNhc2UgNDpcbi8vXG4vLyAgICAgICAgICAgIG91dEluZGV4IC09IGhvcml6b250YWxUaWxlQW1vdW50OyAvLyBtb3ZlIHVwXG4vL1xuLy8gICAgICAgICAgICAvLyBhcmUgd2UgYmVsb3cgdGhlIGJvdW5kYXJpZXMgb2YgdGhlIHRpbGVzID8gdGhlbiB3ZVxuLy8gICAgICAgICAgICAvLyB3ZXJlIG9uIHRoZSBmaXJzdCByb3csIGhhbHQgbW92ZW1lbnRcbi8vICAgICAgICAgICAgLy8gVE9ETyA6IHRoaXMgaXMgd3JvbmcsIHdpbGwgb25seSB3b3JrIG9uIGZpcnN0IHJvdyFcbi8vICAgICAgICAgICAgaWYgKCBvdXRJbmRleCA8IDAgKSB7XG4vLyAgICAgICAgICAgICAgICBvdXRJbmRleCA9IC0xO1xuLy8gICAgICAgICAgICB9XG4vLyAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgfVxuLy8gICAgcmV0dXJuIG91dEluZGV4O1xuLy99Il19
