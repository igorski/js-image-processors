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
var ImageSlicer = require( "./ImageSlicer" );
var ImageCloner = require( "./ImageCloner" );

var ImageDisplacer = module.exports =
{
    /**
     * displace the pixels of an Image, pixels that extend beyond the visible
     * range of the source Images dimensions, will be added at the opposite end of the axis
     *
     * @public
     *
     * @param {Image} aImage source to displace
     * @param {number} aHorizontalOffset amount of pixels on the x-axis to displace
     * @param {number} aVerticalOffset amount of pixels on the y-axis to displace
     *
     * @return {Image} displaced Image
     */
    displace : function( aImage, aHorizontalOffset, aVerticalOffset )
    {
        if (( aHorizontalOffset === 0 && aVerticalOffset === 0 ) ||
              aHorizontalOffset === Infinity || aVerticalOffset === Infinity )
        {
            return aImage;
        }

        var cvs = document.createElement( "canvas" );
        var ctx = cvs.getContext( "2d" );

        cvs.width  = aImage.width;
        cvs.height = aImage.height;

        // sanitize values

        if ( aHorizontalOffset < 0 )
            aHorizontalOffset -= aImage.width;
        else if ( aHorizontalOffset >= aImage.width )
            aHorizontalOffset = aHorizontalOffset - aImage.width;

        if ( aVerticalOffset < 0 )
            aVerticalOffset -= aImage.height - Math.abs( aVerticalOffset );
        else if ( aVerticalOffset >= aImage.height )
            aVerticalOffset = aVerticalOffset - aImage.height;

        var intermediateImage = ImageCloner.clone( aImage );

        // displace horizontally

        if ( aHorizontalOffset > 0 )
        {
            var leftImage  = ImageSlicer.crop( intermediateImage, aHorizontalOffset, 0,
                intermediateImage.width - aHorizontalOffset, intermediateImage.height );

            var rightImage = ImageSlicer.crop( intermediateImage, 0, 0,
                aHorizontalOffset, intermediateImage.height );

            ctx.drawImage( leftImage, 0, 0, leftImage.width, leftImage.height );
            ctx.drawImage( rightImage, leftImage.width, 0, rightImage.width, rightImage.height );

            intermediateImage.src = cvs.toDataURL( "image/png" );
        }

        // displace vertically

        if ( aVerticalOffset > 0 )
        {
            var topImage   = ImageSlicer.crop( intermediateImage, 0, aVerticalOffset,
                intermediateImage.width, intermediateImage.height - aVerticalOffset );

            var bottomImage = ImageSlicer.crop( intermediateImage, 0, 0,
                intermediateImage.width, aVerticalOffset );

            ctx.drawImage( topImage, 0, 0, topImage.width, topImage.height );
            ctx.drawImage( bottomImage, 0, topImage.height, bottomImage.width, bottomImage.height );

            intermediateImage.src = cvs.toDataURL( "image/png" );
        }

        ctx.drawImage( intermediateImage, 0, 0, intermediateImage.width, intermediateImage.height );

        var out = new Image();
        out.src = cvs.toDataURL( "image/png" );

        return out;
    }
};
