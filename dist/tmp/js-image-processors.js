(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./helpers/CanvasHelper":2}],2:[function(require,module,exports){
module.exports = CanvasHelper;

/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 24-02-14
 * Time: 21:24
 * To change this template use File | Settings | File Templates.
 */
function CanvasHelper( imgEl )
{
    this.imageElement = imgEl;

    // prepare for crunching
    var canvas  = document.createElement( "canvas" );
    var context = canvas.getContext && canvas.getContext( "2d" );

    this.height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    this.width  = canvas.width  = imgEl.naturalWidth  || imgEl.offsetWidth  || imgEl.width;

    context.drawImage( imgEl, 0, 0 );

    try {
        this.data = context.getImageData( 0, 0, this.width, this.height ).data;
    }
    catch( e )
    {
        /* security error, img on diff domain */alert('x');
    }
}

CanvasHelper.prototype.data;
CanvasHelper.prototype.width;
CanvasHelper.prototype.height;

CanvasHelper.prototype.destroy = function()
{
    this.data = null;
};

/**
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

},{}],4:[function(require,module,exports){
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
},{}]},{},[1,2,3,4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQm9vdHN0cmFwLmpzIiwic3JjL2hlbHBlcnMvQ2FudmFzSGVscGVyLmpzIiwic3JjL3Byb2dyYW1zL3RpbGVzL1RpbGUuanMiLCJzcmMvcHJvZ3JhbXMvdGlsZXMvVGlsZUFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBDYW52YXNIZWxwZXIgPSByZXF1aXJlKCBcIi4vaGVscGVycy9DYW52YXNIZWxwZXJcIiApO1xuXG52YXIgY3ZzICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJjYW52YXNcIiApO1xudmFyIGN0eCAgID0gY3ZzLmdldENvbnRleHQoIFwiMmRcIiApO1xudmFyIHRpbGVzID0gW107XG5cbi8qIERPTSBlbGVtZW50cyAqL1xuXG52YXIgY3ZzV2lkdGggID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwiY2FudmFzLXdpZHRoXCIgKTtcbnZhciBjdnNIZWlnaHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJjYW52YXMtaGVpZ2h0XCIgKTtcbnZhciBjbGVhckJveCAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJjbGVhci1iZ1wiICk7XG52YXIgZG93bmxvYWQgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwiZG93bmxvYWQtYnRuXCIgKTtcbnZhciBpbnB1dCAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmlsZS1pbnB1dCcpO1xuXG4vKiBldmVudCBoYW5kbGVycyAqL1xuXG5jbGVhckJveC5vbmNoYW5nZSA9IGRyYXc7XG5cbmN2c1dpZHRoLm9uY2hhbmdlID0gY3ZzSGVpZ2h0Lm9uY2hhbmdlID0gZnVuY3Rpb24oIGUgKVxue1xuICAgIHZhciB3aWR0aCAgPSBwYXJzZUludCggY3ZzV2lkdGgudmFsdWUsICAxMCApO1xuICAgIHZhciBoZWlnaHQgPSBwYXJzZUludCggY3ZzSGVpZ2h0LnZhbHVlLCAxMCApO1xuXG4gICAgY3ZzLndpZHRoICA9IHdpZHRoO1xuICAgIGN2cy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICByZW5kZXIoKTtcbn07XG5cbmlucHV0Lm9uY2hhbmdlID0gZnVuY3Rpb24oIGUgKVxue1xuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgaWYgKCBjYW52YXNIZWxwZXIgKSB7XG4gICAgICAgICAgICBjYW52YXNIZWxwZXIuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIGNhbnZhc0hlbHBlciA9IG5ldyBDYW52YXNIZWxwZXIoIGltZyApO1xuICAgICAgICB3ICAgICAgICAgICAgPSBpbWcubmF0dXJhbFdpZHRoO1xuICAgICAgICBoICAgICAgICAgICAgPSBpbWcubmF0dXJhbEhlaWdodDtcbiAgICAgICAgb3V0cHV0U2l6ZSAgID0gY3ZzLndpZHRoIC8gdztcblxuICAgICAgICBjdnMuaGVpZ2h0ID0gaCAvIHcgKiBjdnMud2lkdGg7XG5cbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwicHJldmlld1wiICkuc3JjID0gaW1nLnNyYztcbiAgICAgICAgcmVuZGVyKCk7XG4gICAgfTtcbiAgICBpbWcuc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChlLnRhcmdldC5maWxlc1swXSk7XG59O1xuXG5kb3dubG9hZC5vbmNsaWNrID0gZnVuY3Rpb24oZSlcbntcbiAgICB2YXIgcG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJhXCIgKTtcbiAgICBwb20uc2V0QXR0cmlidXRlKCBcImhyZWZcIiwgY3ZzLnRvRGF0YVVSTCggXCJpbWFnZS9qcGVnXCIgKSk7XG4gICAgcG9tLnNldEF0dHJpYnV0ZSggXCJkb3dubG9hZFwiLCBcImltYWdlLmpwZ1wiICk7XG4gICAgcG9tLmNsaWNrKCk7XG59O1xuXG5mdW5jdGlvbiBkcmF3KClcbntcbiAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSggZHJhdyApO1xuXG4gICAgY3R4LmZpbGxTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuXG4gICAgaWYgKCBjbGVhckJveC5jaGVja2VkIClcbiAgICAgICAgY3R4LmZpbGxSZWN0KCAwLCAwLCBjdnMud2lkdGgsIGN2cy5oZWlnaHQgKTtcblxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGN2cy53aWR0aDsgaSArPSAyMCApXG4gICAge1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gXCIjRkYwMEFFXCI7XG4gICAgICAgIGN0eC5maWxsUmVjdCggaSwgMCwgMSwgY3ZzLmhlaWdodCApO1xuICAgIH1cbn1cblxudmFyIGNhbnZhc0hlbHBlciwgdywgaCwgb3V0cHV0U2l6ZSwgaG9yaXpvbnRhbFRpbGVBbW91bnQsIHZlcnRpY2FsVGlsZUFtb3VudDtcblxuZnVuY3Rpb24gcmVuZGVyKClcbntcbiAgICBkcmF3KCk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IENhbnZhc0hlbHBlcjtcblxuLyoqXG4gKiBDcmVhdGVkIHdpdGggSW50ZWxsaUogSURFQS5cbiAqIFVzZXI6IGlnb3J6aW5rZW5cbiAqIERhdGU6IDI0LTAyLTE0XG4gKiBUaW1lOiAyMToyNFxuICogVG8gY2hhbmdlIHRoaXMgdGVtcGxhdGUgdXNlIEZpbGUgfCBTZXR0aW5ncyB8IEZpbGUgVGVtcGxhdGVzLlxuICovXG5mdW5jdGlvbiBDYW52YXNIZWxwZXIoIGltZ0VsIClcbntcbiAgICB0aGlzLmltYWdlRWxlbWVudCA9IGltZ0VsO1xuXG4gICAgLy8gcHJlcGFyZSBmb3IgY3J1bmNoaW5nXG4gICAgdmFyIGNhbnZhcyAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImNhbnZhc1wiICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCAmJiBjYW52YXMuZ2V0Q29udGV4dCggXCIyZFwiICk7XG5cbiAgICB0aGlzLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQgPSBpbWdFbC5uYXR1cmFsSGVpZ2h0IHx8IGltZ0VsLm9mZnNldEhlaWdodCB8fCBpbWdFbC5oZWlnaHQ7XG4gICAgdGhpcy53aWR0aCAgPSBjYW52YXMud2lkdGggID0gaW1nRWwubmF0dXJhbFdpZHRoICB8fCBpbWdFbC5vZmZzZXRXaWR0aCAgfHwgaW1nRWwud2lkdGg7XG5cbiAgICBjb250ZXh0LmRyYXdJbWFnZSggaW1nRWwsIDAsIDAgKTtcblxuICAgIHRyeSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKCAwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCApLmRhdGE7XG4gICAgfVxuICAgIGNhdGNoKCBlIClcbiAgICB7XG4gICAgICAgIC8qIHNlY3VyaXR5IGVycm9yLCBpbWcgb24gZGlmZiBkb21haW4gKi9hbGVydCgneCcpO1xuICAgIH1cbn1cblxuQ2FudmFzSGVscGVyLnByb3RvdHlwZS5kYXRhO1xuQ2FudmFzSGVscGVyLnByb3RvdHlwZS53aWR0aDtcbkNhbnZhc0hlbHBlci5wcm90b3R5cGUuaGVpZ2h0O1xuXG5DYW52YXNIZWxwZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpXG57XG4gICAgdGhpcy5kYXRhID0gbnVsbDtcbn07XG5cbi8qKlxuICogQHB1YmxpY1xuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gKiBAcGFyYW0ge251bWJlcn0geVxuICogQHBhcmFtIHtudW1iZXJ9IGJsb2NrU2l6ZVxuICogQHBhcmFtIHtudW1iZXI9fSBzbWVhciBvcHRpb25hbCBcInNtZWFyaW5nXCIgaW4gdGhlIHdpZHRoLCBkZWZhdWx0cyB0byAxIChubyBlZmZlY3QpXG4gKiBAcmV0dXJuIHt7cjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlcn19XG4gKi9cbkNhbnZhc0hlbHBlci5wcm90b3R5cGUuZ2V0Q29sb3IgPSBmdW5jdGlvbiggeCwgeSwgYmxvY2tTaXplLCBzbWVhciApXG57XG4gICAgdmFyIGxlbiA9IDQ7ICAgIC8vIGFtb3VudCBvZiBibG9ja3MgcGVyIHBpeGVsIChSLEcsQixBKVxuICAgIHZhciByZ2IgPSB7cjowLGc6MCxiOjB9OyAvLyBubyBhbHBoYSAoIHdvdWxkIGJlIGZvdXJ0aCBpbmRleCApXG4gICAgc21lYXIgICA9IHNtZWFyIHx8IDE7XG5cbiAgICBpZiAoIHggPCAwIClcbiAgICAgICAgeCA9IDA7XG4gICAgaWYgKCB4ID49IHRoaXMud2lkdGggKVxuICAgICAgICB4ID0gdGhpcy53aWR0aCAtIDE7XG5cbiAgICBpZiAoIHkgPCAwIClcbiAgICAgICAgeSA9IDA7XG4gICAgaWYgKCB5ID49IHRoaXMuaGVpZ2h0IClcbiAgICAgICAgeSA9IHRoaXMuaGVpZ2h0IC0gMTtcblxuICAgIHZhciBtYXhMZW5ndGggICA9IHRoaXMuZGF0YS5sZW5ndGg7XG4gICAgdmFyIHN0YXJ0T2Zmc2V0ID0gKCB4ICogbGVuICkgKyAoIHkgKiBsZW4gKiB0aGlzLndpZHRoICk7XG4gICAgdmFyIGVuZE9mZnNldCAgID0gc3RhcnRPZmZzZXQgKyAoKCBibG9ja1NpemUgKiBibG9ja1NpemUgKSAqIGxlbiApICogc21lYXI7XG5cbiAgICBpZiAoIGVuZE9mZnNldCA+IG1heExlbmd0aCApXG4gICAgICAgIGVuZE9mZnNldCA9IG1heExlbmd0aDtcblxuICAgIHZhciBjb3VudCA9IDA7XG4gICAgdmFyIGkgICAgID0gc3RhcnRPZmZzZXQgLSBsZW47XG5cbiAgICAvL2NvbnNvbGUubG9nKCBcIm1heCA+IFwiICsgbWF4TGVuZ3RoICsgXCIgdnMgXCIgKyB0aGlzLndpZHRoICsgXCIgeCBcIiArIHRoaXMuaGVpZ2h0ICsgXCIgc3RhcnQgPiBcIiArIHN0YXJ0T2Zmc2V0ICsgXCIgZW5kID4gXCIgKyBlbmRPZmZzZXQpO1xuICAgIC8vcmV0dXJuO1xuICAgIHdoaWxlICgoIGkgKz0gYmxvY2tTaXplICogbGVuICkgPCBlbmRPZmZzZXQgKVxuICAgIHtcbiAgICAgICAgKytjb3VudDtcbiAgICAgICAgcmdiLnIgKz0gdGhpcy5kYXRhWyBpIF07XG4gICAgICAgIHJnYi5nICs9IHRoaXMuZGF0YVsgaSArIDEgXTtcbiAgICAgICAgcmdiLmIgKz0gdGhpcy5kYXRhWyBpICsgMiBdO1xuICAgIH1cblxuICAgIC8vIH5+IHVzZWQgdG8gZmxvb3IgdmFsdWVzXG4gICAgcmdiLnIgPSB+figgcmdiLnIgLyBjb3VudCApO1xuICAgIHJnYi5nID0gfn4oIHJnYi5nIC8gY291bnQgKTtcbiAgICByZ2IuYiA9IH5+KCByZ2IuYiAvIGNvdW50ICk7XG5cbiAgICByZXR1cm4gcmdiO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gVGlsZTtcblxuZnVuY3Rpb24gVGlsZSggaSwgciwgZywgYiwgeCwgeSwgc2l6ZSApXG57XG4gICAgdGhpcy5pbmRleCA9IGk7XG4gICAgdGhpcy5jb2xvciA9IFwicmdiYShcIiArIHIgKyBcIixcIiArIGcgKyBcIixcIiArIGIgKyBcIiwyNTUpXCI7XG4gICAgdGhpcy54ICAgICA9IHggfHwgMDtcbiAgICB0aGlzLnkgICAgID0geSB8fCAwO1xuICAgIHRoaXMuc2l6ZSAgPSBzaXplIHx8IDE1O1xuICAgIHRoaXMudXBwZXIgPSBNYXRoLnJhbmRvbSgpID4gLjU7XG59XG5cbi8qIGNsYXNzIHByb3BlcnRpZXMgKi9cblxuLyoqIEBwdWJsaWMgQHR5cGUge251bWJlcn0gKi8gIFRpbGUucHJvdG90eXBlLmluZGV4O1xuLyoqIEBwdWJsaWMgQHR5cGUge251bWJlcn0gKi8gIFRpbGUucHJvdG90eXBlLng7XG4vKiogQHB1YmxpYyBAdHlwZSB7bnVtYmVyfSAqLyAgVGlsZS5wcm90b3R5cGUueTtcbi8qKiBAcHVibGljIEB0eXBlIHtudW1iZXJ9ICovICBUaWxlLnByb3RvdHlwZS5zaXplO1xuLyoqIEBwdWJsaWMgQHR5cGUge251bWJlcn0gKi8gIFRpbGUucHJvdG90eXBlLnVwcGVyO1xuLyoqIEBwdWJsaWMgQHR5cGUge251bWJlcn0gKi8gIFRpbGUucHJvdG90eXBlLmNvbG9yO1xuLyoqIEBwdWJsaWMgQHR5cGUge2Jvb2xlYW59ICovIFRpbGUucHJvdG90eXBlLmhhc1BhaXJpbmcgPSBmYWxzZTtcbi8qKiBAcHVibGljIEB0eXBlIHtudW1iZXJ9ICovICBUaWxlLnByb3RvdHlwZS5wYWlyRGlyZWN0aW9uID0gMDtcblxuVGlsZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCBjdHggKVxue1xuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xuICAgIGN0eC5iZWdpblBhdGgoKTtcblxuICAgIGlmICggdGhpcy51cHBlciApXG4gICAge1xuICAgICAgICBjdHgubW92ZVRvKCB0aGlzLngsIHRoaXMueSApO1xuICAgICAgICBjdHgubGluZVRvKCB0aGlzLnggKyB0aGlzLnNpemUsIHRoaXMueSApO1xuICAgICAgICBjdHgubGluZVRvKCB0aGlzLngsIHRoaXMueSArIHRoaXMuc2l6ZSApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY3R4Lm1vdmVUbyggdGhpcy54LCB0aGlzLnkgKyB0aGlzLnNpemUgKTtcbiAgICAgICAgY3R4LmxpbmVUbyggdGhpcy54ICsgdGhpcy5zaXplLCB0aGlzLnkgKyB0aGlzLnNpemUgKTtcbiAgICAgICAgY3R4LmxpbmVUbyggdGhpcy54LCB0aGlzLnkgKTtcbiAgICB9XG4gICAgY3R4LmZpbGwoKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG59O1xuIiwiLy92YXIgQ2FudmFzSGVscGVyID0gcmVxdWlyZSggXCIuLi8uLi9oZWxwZXJzL0NhbnZhc0hlbHBlclwiICk7XG4vL3ZhciBUaWxlICAgICAgICAgPSByZXF1aXJlKCBcIi4vVGlsZVwiICk7XG4vL1xuLy92YXIgY3ZzICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJjYW52YXNcIiApO1xuLy92YXIgY3R4ICAgPSBjdnMuZ2V0Q29udGV4dCggXCIyZFwiICk7XG4vL1xuLy92YXIgdGlsZXMgPSBbXTtcbi8vXG4vL2Z1bmN0aW9uIGRyYXcoKVxuLy97XG4vLyAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSggZHJhdyApO1xuLy9cbi8vICAgIGN0eC5maWxsU3R5bGUgPSBcIiNGRkZGRkZcIjtcbi8vXG4vLyAgICBpZiAoIGNsZWFyQm94LmNoZWNrZWQgKVxuLy8gICAgICAgIGN0eC5maWxsUmVjdCggMCwgMCwgY3ZzLndpZHRoLCBjdnMuaGVpZ2h0ICk7XG4vL1xuLy8gICAgZm9yICggdmFyIGkgPSAwLCBsID0gdGlsZXMubGVuZ3RoOyBpIDwgbDsgKytpIClcbi8vICAgIHtcbi8vICAgICAgICB0aWxlc1sgaSBdLmRyYXcoIGN0eCApO1xuLy8gICAgfVxuLy99XG4vL1xuLy92YXIgY2FudmFzSGVscGVyLCB3LCBoLCBvdXRwdXRTaXplLCBob3Jpem9udGFsVGlsZUFtb3VudCwgdmVydGljYWxUaWxlQW1vdW50O1xuLy9cbi8vZnVuY3Rpb24gcmVuZGVyKClcbi8ve1xuLy8gICAgdGlsZXMgPSBbXTsgLy8gY2xlYXIgcHJldmlvdXMgdGlsZXNcbi8vXG4vLyAgICB2YXIgdGhlT3V0cHV0U2l6ZSA9IG91dHB1dFNpemUgKiBpbmNyO1xuLy9cbi8vICAgIGZvciAoIHZhciBpeSA9IDA7IGl5IDwgaDsgaXkgKz0gaW5jciApXG4vLyAgICB7XG4vLyAgICAgICAgZm9yICggdmFyIGl4ID0gMDsgaXggPCB3OyBpeCArPSBpbmNyIClcbi8vICAgICAgICB7XG4vLyAgICAgICAgICAgIHZhciByZ2IgPSBjYW52YXNIZWxwZXIuZ2V0Q29sb3IoIGl4LCBpeSwgc2l6ZSwgc21lYXIgKTtcbi8vXG4vLyAgICAgICAgICAgIHZhciB0aWxlID0gbmV3IFRpbGUoIHRpbGVzLmxlbmd0aCwgcmdiLnIsIHJnYi5nLCByZ2IuYiwgaXggKiBvdXRwdXRTaXplLCBpeSAqIG91dHB1dFNpemUsIHRoZU91dHB1dFNpemUgKTtcbi8vICAgICAgICAgICAgdGlsZS54aW5kZXggPSBpeDtcbi8vICAgICAgICAgICAgdGlsZS55aW5kZXggPSBpeTtcbi8vICAgICAgICAgICAgdGlsZXMucHVzaCggdGlsZSApO1xuLy8gICAgICAgIH1cbi8vICAgIH1cbi8vICAgIGhvcml6b250YWxUaWxlQW1vdW50ID0gaXggLyBpbmNyO1xuLy8gICAgdmVydGljYWxUaWxlQW1vdW50ICAgPSBpeSAvIGluY3I7XG4vL1xuLy8gICAgY29uc29sZS5sb2coIFwiYW1vdW50IG9mIHRpbGVzIGdlbmVyYXRlZCA+IFwiICsgdGlsZXMubGVuZ3RoICk7XG4vLyAgICBkcmF3KCk7XG4vL31cbi8vXG4vL3ZhciBzaXplICAgICA9IDE7IC8vIHByZWZlcnJlZCBzYW1wbGUgYmxvY2sgc2l6ZSBpbiBwaXhlbHNcbi8vdmFyIGluY3IgICAgID0gMTtcbi8vdmFyIHNtZWFyICAgID0gMTtcbi8vdmFyIHNzU2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwic2FtcGxlLXNpemVcIiApO1xuLy92YXIgc21TbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggXCJzbWVhci1zaXplXCIgKTtcbi8vdmFyIHNrU2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwic2tpcC1zaXplXCIgKTtcbi8vdmFyIGNsZWFyQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwiY2xlYXItYmdcIiApO1xuLy9cbi8vY2xlYXJCb3gub25jaGFuZ2UgPSBkcmF3O1xuLy9cbi8vc3NTbGlkZXIub25jaGFuZ2UgPSBmdW5jdGlvbiggZSApIHtcbi8vICAgIHNpemUgPSBlLnRhcmdldC52YWx1ZTtcbi8vICAgIHJlcVJlbmRlcigpO1xuLy99O1xuLy9cbi8vc21TbGlkZXIub25jaGFuZ2UgPSBmdW5jdGlvbiggZSApIHtcbi8vICAgIHNtZWFyID0gZS50YXJnZXQudmFsdWU7XG4vLyAgICByZXFSZW5kZXIoKTtcbi8vfTtcbi8vXG4vL3NrU2xpZGVyLm9uY2hhbmdlID0gZnVuY3Rpb24oIGUgKSB7XG4vLyAgICBpbmNyID0gcGFyc2VJbnQoIGUudGFyZ2V0LnZhbHVlICkgKyAxO1xuLy8gICAgcmVxUmVuZGVyKCk7XG4vL307XG4vL1xuLy92YXIgcml2YWw7XG4vL3ZhciByZXFSZW5kZXIgPSBmdW5jdGlvbigpXG4vL3tcbi8vICAgIGNsZWFyVGltZW91dCggcml2YWwgKTtcbi8vICAgIHJpdmFsID0gc2V0VGltZW91dCggZnVuY3Rpb24oKVxuLy8gICAge1xuLy8gICAgICAgIGNsZWFyVGltZW91dCggcml2YWwgKTtcbi8vICAgICAgICByZW5kZXIoKTtcbi8vICAgIH0sIDEwMCApO1xuLy99O1xuLy9cbi8vdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZpbGUtaW5wdXQnKTtcbi8vaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgaGFuZGxlRmlsZXMpO1xuLy9cbi8vZnVuY3Rpb24gaGFuZGxlRmlsZXMoIGUgKVxuLy97XG4vLyAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XG4vLyAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKVxuLy8gICAge1xuLy8gICAgICAgIGlmICggY2FudmFzSGVscGVyICkge1xuLy8gICAgICAgICAgICBjYW52YXNIZWxwZXIuZGVzdHJveSgpO1xuLy8gICAgICAgIH1cbi8vICAgICAgICBjYW52YXNIZWxwZXIgPSBuZXcgQ2FudmFzSGVscGVyKCBpbWcgKTtcbi8vICAgICAgICB3ICAgICAgICAgICAgPSBpbWcubmF0dXJhbFdpZHRoO1xuLy8gICAgICAgIGggICAgICAgICAgICA9IGltZy5uYXR1cmFsSGVpZ2h0O1xuLy8gICAgICAgIG91dHB1dFNpemUgICA9IGN2cy53aWR0aCAvIHc7XG4vL1xuLy8gICAgICAgIGN2cy5oZWlnaHQgPSBoIC8gdyAqIGN2cy53aWR0aDtcbi8vXG4vLyAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwicHJldmlld1wiKS5zcmMgPSBpbWcuc3JjO1xuLy8gICAgICAgIHJlbmRlcigpO1xuLy8gICAgfTtcbi8vICAgIGltZy5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGUudGFyZ2V0LmZpbGVzWzBdKTtcbi8vfVxuLy9cbi8vLyoqXG4vLyAqXG4vLyAqIEBwYXJhbSB7VGlsZX0gdGlsZVxuLy8gKiBAcGFyYW0ge251bWJlcn0gcG9zaXRpb24gb2YgdGhlIHRpbGUgdG8gYmUgcGFpcmVkIHdpdGgsIGNhbiBiZVxuLy8gKiAgICAgICAgICAgICAgICAgMCA9IHVwcGVyIGxlZnQsIDEgPSB0b3AsIDIgPSB1cHBlciByaWdodCxcbi8vICogICAgICAgICAgICAgICAgIDMgPSBsZWZ0LCA0ID0gcmlnaHQsIDUgPSBsb3dlciBsZWZ0LCA2ID0gYm90dG9tLCA3ID0gbG93ZXIgcmlnaHRcbi8vICovXG4vL2Z1bmN0aW9uIGdldFBhaXJpbmcoIHRpbGUsIHBvc2l0aW9uIClcbi8ve1xuLy8gICAgdmFyIHRhcmdldEluZGV4ID0gdGlsZS5pbmRleDtcbi8vXG4vLyAgICBzd2l0Y2ggKCBwb3NpdGlvbiApXG4vLyAgICB7XG4vLyAgICAgICAgLy8gdXBwZXIgbGVmdFxuLy8gICAgICAgIGNhc2UgMDpcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgMSApOyAvLyBtb3ZlIGxlZnRcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgNCApOyAvLyBtb3ZlIHVwXG4vLyAgICAgICAgICAgIGJyZWFrO1xuLy9cbi8vICAgICAgICAvLyB0b3Bcbi8vICAgICAgICBjYXNlIDE6XG4vLyAgICAgICAgICAgIHRhcmdldEluZGV4ID0gbW92ZSggdGFyZ2V0SW5kZXgsIDQgKTtcbi8vICAgICAgICAgICAgYnJlYWs7XG4vL1xuLy8gICAgICAgIC8vIHVwcGVyIHJpZ2h0XG4vLyAgICAgICAgY2FzZSAyOlxuLy8gICAgICAgICAgICB0YXJnZXRJbmRleCA9IG1vdmUoIHRhcmdldEluZGV4LCAyICk7IC8vIG1vdmUgcmlnaHRcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgNCApOyAvLyBtb3ZlIHVwXG4vLyAgICAgICAgICAgIGJyZWFrO1xuLy9cbi8vICAgICAgICAvLyBsZWZ0XG4vLyAgICAgICAgY2FzZSAzOlxuLy8gICAgICAgICAgICB0YXJnZXRJbmRleCA9IG1vdmUoIHRhcmdldEluZGV4LCAxICk7IC8vIG1vdmUgbGVmdFxuLy8gICAgICAgICAgICBicmVhaztcbi8vXG4vLyAgICAgICAgLy8gcmlnaHRcbi8vICAgICAgICBjYXNlIDQ6XG4vLyAgICAgICAgICAgIHRhcmdldEluZGV4ID0gbW92ZSggdGFyZ2V0SW5kZXgsIDIgKTsgLy8gbW92ZSByaWdodFxuLy8gICAgICAgICAgICBicmVhaztcbi8vXG4vLyAgICAgICAgLy8gbG93ZXIgbGVmdFxuLy8gICAgICAgIGNhc2UgNTpcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgMSApOyAvLyBtb3ZlIGxlZnRcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgMyApOyAvLyBtb3ZlIGRvd25cbi8vICAgICAgICAgICAgYnJlYWs7XG4vL1xuLy8gICAgICAgIC8vIGJvdHRvbVxuLy8gICAgICAgIGNhc2UgNjpcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgMyApOyAvLyBtb3ZlIGRvd25cbi8vICAgICAgICAgICAgYnJlYWs7XG4vL1xuLy8gICAgICAgIC8vIGxvd2VyIHJpZ2h0XG4vLyAgICAgICAgY2FzZSA3OlxuLy8gICAgICAgICAgICB0YXJnZXRJbmRleCA9IG1vdmUoIHRhcmdldEluZGV4LCAyICk7IC8vIG1vdmUgcmlnaHRcbi8vICAgICAgICAgICAgdGFyZ2V0SW5kZXggPSBtb3ZlKCB0YXJnZXRJbmRleCwgMyApOyAvLyBtb3ZlIGRvd25cbi8vICAgICAgICAgICAgYnJlYWs7XG4vLyAgICB9XG4vL1xuLy8gICAgLy8gbWFrZSBzdXJlIHdlJ3JlIHN0aWxsIGluIGJvdW5kc1xuLy8gICAgaWYgKCB0YXJnZXRJbmRleCA9PSB0aWxlLmluZGV4IHx8IHRhcmdldEluZGV4ID09PSAtIDEgKSB7XG4vLyAgICAgICAgY29uc29sZS5sb2coIFwiZXJyb25lb3VzIHJlcXVlc3QsIGFib3J0aW5nXCIgKTtcbi8vICAgICAgICByZXR1cm47XG4vLyAgICB9XG4vLyAgICAvLyBnZXQgdGhlIFwib3RoZXJcIiB0aWxlXG4vLyAgICB2YXIgb3RoZXJUaWxlID0gdGlsZXNbIHRhcmdldEluZGV4IF07XG4vL1xuLy8gICAgdGlsZS5oYXNQYWlyaW5nID0gdHJ1ZTtcbi8vICAgIHRpbGUucGFpckRpcmVjdGlvbiA9IHBvc2l0aW9uO1xuLy9cbi8vICAgIG90aGVyVGlsZS51cHBlciA9IHRpbGUudXBwZXI7XG4vLyAgICBvdGhlclRpbGUuY29sb3IgPSB0aWxlLmNvbG9yO1xuLy8gICAgb3RoZXJUaWxlLmhhc1BhaXJpbmcgPSB0cnVlO1xuLy8gICAgb3RoZXJUaWxlLnBhaXJEaXJlY3Rpb24gPSBwb3NpdGlvbjtcbi8vICAgIG90aGVyVGlsZS5kcmF3KCBjdHggKTtcbi8vfVxuLy9cbi8vdmFyIGdldFBhaXJlZFRpbGVzID0gZnVuY3Rpb24oKVxuLy97XG4vLyAgICB2YXIgb3V0ID0gW107XG4vL1xuLy8gICAgdmFyIGkgPSB0aWxlcy5sZW5ndGg7XG4vL1xuLy8gICAgd2hpbGUgKCBpLS0gKVxuLy8gICAge1xuLy8gICAgICAgIHZhciB0aWxlID0gdGlsZXNbIGkgXTtcbi8vXG4vLyAgICAgICAgaWYgKCB0aWxlLmhhc1BhaXJpbmcgKSB7XG4vLyAgICAgICAgICAgIG91dC5wdXNoKCB0aWxlICk7XG4vLyAgICAgICAgfVxuLy8gICAgfVxuLy8gICAgcmV0dXJuIG91dC5yZXZlcnNlKCk7XG4vL307XG4vL1xuLy8vKipcbi8vICogQHB1YmxpY1xuLy8gKlxuLy8gKiBAcGFyYW0ge251bWJlcn0gdGFyZ2V0SW5kZXhcbi8vICogQHBhcmFtIHtudW1iZXJ9IGRpcmVjdGlvbiAxIGZvciBsZWZ0LCAyIGZvciByaWdodCwgMyBmb3IgZG93biwgNCBmb3IgdXBcbi8vICogQHJldHVybiB7bnVtYmVyfSB0aGUgcmVzdWx0aW5nIGluZGV4IG9yIC0xIHRvIGluZGljYXRlIGFuIGludmFsaWQgb3BlcmF0aW9uXG4vLyAqL1xuLy9mdW5jdGlvbiBtb3ZlKCB0YXJnZXRJbmRleCwgZGlyZWN0aW9uIClcbi8ve1xuLy8gICAgdmFyIG91dEluZGV4ID0gdGFyZ2V0SW5kZXg7XG4vL1xuLy8gICAgc3dpdGNoICggZGlyZWN0aW9uIClcbi8vICAgIHtcbi8vICAgICAgICAvLyBsZWZ0XG4vLyAgICAgICAgY2FzZSAxOlxuLy9cbi8vICAgICAgICAgICAgLy8gbW92ZSBsZWZ0ICh1bmxlc3Mgd2UncmUgb24gdGhlIGZpcnN0IHRpbGUgb2YgYSBuZXcgcm93LCB0byBwcmV2ZW50IGp1bXBpbmdcbi8vICAgICAgICAgICAgLy8gdG8gdGhlIG91dGVybW9zdCByaWdodCB0aWxlIG9mIHRoZSBwcmV2aW91cyByb3cpXG4vLyAgICAgICAgICAgIGlmICggb3V0SW5kZXggJSBob3Jpem9udGFsVGlsZUFtb3VudCAhPSAwIClcbi8vICAgICAgICAgICAge1xuLy8gICAgICAgICAgICAgICAgLS1vdXRJbmRleDtcbi8vICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICBicmVhaztcbi8vXG4vLyAgICAgICAgLy8gcmlnaHRcbi8vICAgICAgICBjYXNlIDI6XG4vL1xuLy8gICAgICAgICAgICAvLyBtb3ZlIHJpZ2h0ICh1bmxlc3Mgd2UncmUgb24gdGhlIGxhc3QgdGlsZSBvZiBhIHJvdywgdG8gcHJldmVudCBqdW1waW5nXG4vLyAgICAgICAgICAgIC8vIHRvIHRoZSBvdXRlcm1vc3QgbGVmdCB0aWxlIG9mIHRoZSBuZXh0IHJvdylcbi8vICAgICAgICAgICAgaWYgKCBvdXRJbmRleCAlIGhvcml6b250YWxUaWxlQW1vdW50ICE9ICggaG9yaXpvbnRhbFRpbGVBbW91bnQgLSAxICkpXG4vLyAgICAgICAgICAgIHtcbi8vICAgICAgICAgICAgICAgICsrb3V0SW5kZXg7XG4vLyAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgYnJlYWs7XG4vL1xuLy8gICAgICAgIC8vIGRvd25cbi8vICAgICAgICBjYXNlIDM6XG4vL1xuLy8gICAgICAgICAgICBvdXRJbmRleCArPSBob3Jpem9udGFsVGlsZUFtb3VudDsgLy8gbW92ZSBkb3duXG4vL1xuLy8gICAgICAgICAgICAvLyBkbyB3ZSBleGNlZWQgdGhlIGJvdW5kYXJpZXMgb2YgdGhlIHRpbGVzID8gdGhlbiB3ZVxuLy8gICAgICAgICAgICAvLyB3ZXJlIG9uIHRoZSBsYXN0IHJvdywgaGFsdCBtb3ZlbWVudFxuLy8gICAgICAgICAgICAvLyBUT0RPIDogdGhpcyBpcyB3cm9uZywgd2lsbCBvbmx5IHdvcmsgb24gbGFzdCB0aWxlIVxuLy8gICAgICAgICAgICBpZiAoIG91dEluZGV4ID49IHRpbGVzLmxlbmd0aCApIHtcbi8vICAgICAgICAgICAgICAgIG91dEluZGV4ID0gLTE7XG4vLyAgICAgICAgICAgIH1cbi8vXG4vLyAgICAgICAgICAgIGJyZWFrO1xuLy9cbi8vICAgICAgICAvLyB1cFxuLy8gICAgICAgIGNhc2UgNDpcbi8vXG4vLyAgICAgICAgICAgIG91dEluZGV4IC09IGhvcml6b250YWxUaWxlQW1vdW50OyAvLyBtb3ZlIHVwXG4vL1xuLy8gICAgICAgICAgICAvLyBhcmUgd2UgYmVsb3cgdGhlIGJvdW5kYXJpZXMgb2YgdGhlIHRpbGVzID8gdGhlbiB3ZVxuLy8gICAgICAgICAgICAvLyB3ZXJlIG9uIHRoZSBmaXJzdCByb3csIGhhbHQgbW92ZW1lbnRcbi8vICAgICAgICAgICAgLy8gVE9ETyA6IHRoaXMgaXMgd3JvbmcsIHdpbGwgb25seSB3b3JrIG9uIGZpcnN0IHJvdyFcbi8vICAgICAgICAgICAgaWYgKCBvdXRJbmRleCA8IDAgKSB7XG4vLyAgICAgICAgICAgICAgICBvdXRJbmRleCA9IC0xO1xuLy8gICAgICAgICAgICB9XG4vLyAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgfVxuLy8gICAgcmV0dXJuIG91dEluZGV4O1xuLy99Il19
