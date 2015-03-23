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
module.exports = CanvasHelper;

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
    var len = 4; // amount of blocks per pixel (R,G,B,A)
    var rgb = { r : 0, g : 0, b : 0 }; // note no alpha ( would be 4th index )

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
