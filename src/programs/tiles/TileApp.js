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