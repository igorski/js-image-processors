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
var ImageSlicer = module.exports =
{
    /**
     * crop an Image
     *
     * @public
     *
     * @param {Image} aImage source Image to crop
     * @param {number} aX x-coordinate to start crop at
     * @param {number} aY y-coordinate to start crop at
     * @param {number} aWidt  h width of the cropped Image
     * @param {number} aHeight width of the cropped Image
     *
     * @return {Image} trimmed Image
     */
    crop : function( aImage, aX, aY, aWidth, aHeight )
    {
        var cvs = document.createElement( "canvas" );
        var ctx = cvs.getContext( "2d" );

        var orgWidth  = aImage.width;
        var orgHeight = aImage.height;

        // keep coordinates within bounds

        aX = Math.min( aX, orgWidth - 1 );
        aY = Math.min( aY, orgHeight - 1 );

        // keep dimensions within bounds

        if (( aWidth - aX ) > orgWidth )
            aWidth = orgWidth - aX;

        if (( aHeight - aY ) > orgHeight )
            aHeight = orgHeight - aY;

        cvs.width  = aWidth;
        cvs.height = aHeight;

        ctx.drawImage( aImage, aX, aY, aWidth, aHeight, 0, 0, aWidth, aHeight );

        var out = new Image();
        out.src = cvs.toDataURL( "image/jpeg" );

        return out;
    }
};
