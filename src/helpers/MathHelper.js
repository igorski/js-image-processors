/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2015 Igor Zinken
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
var MathHelper = module.exports =
{
    /**
     * request a rectangle representing an image dimensions after cropping
     *
     * @public
     *
     * @param {number} aSourceWidth width of the source image
     * @param {number} aSourceHeight height of the source image
     * @param {number} aTargetWidth desired target width
     * @param {number} aTargetHeight desired target height
     * @param {number=} aSourceX optional X coordinate relative to the source image, defaults to center
     * @param {number=} aSourceY optional Y coordinate relative to the source image, defaults to center
     *
     * @return {{ left: number, top:number, width: number, height: number }}
     */
    crop : function( aSourceWidth, aSourceHeight, aTargetWidth, aTargetHeight, aSourceX, aSourceY )
    {
        // if crop coordinates weren't passed, create
        // crop from the center of image

        if ( typeof aSourceX !== "number" )
        {
            if ( aSourceWidth > aTargetWidth )
            {
                aSourceX = aSourceWidth * .5 - aTargetWidth * .5;
            }
            else {
                aSourceX = 0;
            }
        }

        if ( typeof aSourceY !== "number" )
        {
            if ( aSourceHeight > aTargetHeight ) {
                aSourceY = aSourceHeight * .5 - aTargetHeight * .5;
            }
            else {
                aSourceY = 0;
            }
        }

        return { left: aSourceX, top: aSourceY, width: aTargetWidth, height: aTargetHeight };
    },

    /**
     * retrieve the bounding box describing the size of an image
     * after it has been rotated
     *
     * @public
     *
     * @param {number} aSourceWidth original width of the image in non-transformed state
     * @param {number} aSourceHeight original height of the image in non-transformed state
     * @param {number} aAngle desired angle ( in degrees ) to rotate the image by
     *
     * @return {{ left: number, top:number, width: number, height: number }}
     */
    rotate : function( aSourceWidth, aSourceHeight, aAngle )
    {
        var angleInRadians = lib.utils.MathUtil.deg2rad( aAngle );

        var x1 = -aSourceWidth  * .5,
            x2 =  aSourceWidth  * .5,
            x3 =  aSourceWidth  * .5,
            x4 = -aSourceWidth  * .5,
            y1 =  aSourceHeight * .5,
            y2 =  aSourceHeight * .5,
            y3 = -aSourceHeight * .5,
            y4 = -aSourceHeight * .5;

        var x11 = x1  * Math.cos( angleInRadians ) + y1 * Math.sin( angleInRadians ),
            y11 = -x1 * Math.sin( angleInRadians ) + y1 * Math.cos( angleInRadians ),
            x21 = x2  * Math.cos( angleInRadians ) + y2 * Math.sin( angleInRadians ),
            y21 = -x2 * Math.sin( angleInRadians ) + y2 * Math.cos( angleInRadians ),
            x31 = x3  * Math.cos( angleInRadians ) + y3 * Math.sin( angleInRadians ),
            y31 = -x3 * Math.sin( angleInRadians ) + y3 * Math.cos( angleInRadians ),
            x41 = x4  * Math.cos( angleInRadians ) + y4 * Math.sin( angleInRadians ),
            y41 = -x4 * Math.sin( angleInRadians ) + y4 * Math.cos( angleInRadians );

        var x_min = Math.min( x11, x21, x31, x41 ), x_max = Math.max( x11, x21, x31, x41 );
        var y_min = Math.min( y11, y21, y31, y41 ), y_max = Math.max( y11, y21, y31, y41 );

        return { left: 0, top: 0, width: x_max - x_min, height: y_max - y_min };
    },

    /**
     * rotate an Array that should be treated as a Matrix
     * NOTE : this implies the Array should have a rounded square
     * root value to ensure the amount of rows are equal to the amount
     * of columns. Works in 90 degree increments
     *
     * @public
     *
     * @param {Array.<*>} aMatrix
     * @param {number} aAngle to rotate (in degrees)
     *
     * @return {Array.<*>} rotated matrix
     */
    rotateMatrix : function( aMatrix, aAngle )
    {
        if ( aAngle === 0 )
            return aMatrix;

        // sanitize negative rotations
        if ( aAngle === -90 )
            aAngle = 270;

        aAngle = Math.abs( aAngle % 360 );

        function clockwise( aMatrix )
        {
            var matrixSize = aMatrix.length;
            var rows       = Math.sqrt( matrixSize );
            var columns    = rows; // equal amount of rows and columns
            var newMatrix  = new Array( matrixSize );

            var newMatrixIndex = 0;

            for ( var i = 0, offset = columns; i < columns; ++i, --offset )
            {
                for ( var k = 0; k < rows; k++ )
                {
                    newMatrix[ newMatrixIndex ] = aMatrix[ matrixSize - ( offset + ( k * columns ))];
                    ++newMatrixIndex;
                }
            }
            return newMatrix;
        }
        var out = aMatrix;

        for ( var i = 0; i < aAngle; i += 90 ) {
            out = clockwise( out );
        }
        return out;
    }
};
