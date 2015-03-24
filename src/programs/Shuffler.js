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
var ImageDisplacer = require( "../helpers/ImageDisplacer" );
var ImageSlicer    = require( "../helpers/ImageSlicer" );

var Shuffler = module.exports =
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
     * @param {number} sampleSize
     * @param {number} smearSize
     * @param {number} skipSize
     */
    prepare : function( aContext, aWidth, aHeight, aCanvasHelper, sampleSize, smearSize, skipSize )
    {
        var image       = aCanvasHelper.image;
        var imageWidth  = image.width;
        var imageHeight = image.height;

        lastSampleSize = sampleSize;
        lastSmearSize  = smearSize;
        lastSkipSize   = skipSize;

        // create samples from the image

        samples      = [];

        var sampleWidth = imageWidth / sampleSize, sampleHeight = imageHeight;

        var tmpCanvas    = document.createElement( "canvas" );
        var tmpCtx       = tmpCanvas.getContext( "2d" );
        tmpCanvas.height = imageHeight;
        tmpCanvas.width  = sampleWidth;

        var img, img2;
        var totalSamples = Math.ceil( imageWidth / tmpCanvas.width );
        var verticalDisplace = imageHeight * ( skipSize / 100 );
        for ( var i = 0; i < imageWidth; i += tmpCanvas.width )
        {
            tmpCtx.drawImage( image, i, 0, sampleWidth, sampleHeight,
                              0, 0, sampleWidth, sampleHeight );

            img = new Image();
            img.src = tmpCanvas.toDataURL( "image/png" ); // PNG ensures 24-bit lossless quality
            img.width = sampleWidth;
            img.height = sampleHeight;

            img2 = ImageDisplacer.displace( img, 0, i % 2 === 0 ? i + verticalDisplace : sampleHeight - ( i + verticalDisplace ));//( sampleHeight * ( i / totalSamples ) ));

            samples.push( img2 );
        }
    },

    /**
     * @public
     *
     * @param {CanvasRenderingContext2D} aContext
     * @param {number} aWidth total width of the canvas
     * @param {number} aHeight total height of the canvas
     * @param {CanvasHelper} aCanvasHelper reference to the CanvasHelper
     *        contains the Image to draw in property .image
     * @param {number} sampleSize
     * @param {number} smearSize
     * @param {number} skipSize
     */
    render : function( aContext, aWidth, aHeight, aCanvasHelper, sampleSize, smearSize, skipSize )
    {
        var image       = aCanvasHelper.image;
        var imageWidth  = image.width;
        var imageHeight = image.height;
        var sampleWidth = imageWidth / sampleSize, sampleHeight = imageHeight;
        var rotate, i, l;

        var targetWidth = Math.round( aWidth / samples.length );

        var mpi = Math.PI / 180;
        var slidesInCircle = smearSize;
        var circleRadius = aWidth / 3;
        var incrementRadians = ( 360 / slidesInCircle ) * mpi;
        var radians = mpi, x, y;

        for ( i = 0, l = samples.length; i < l; ++i )
        {
            x = i * targetWidth;
            y = 0;

            rotate = smearSize > 1;

            if ( rotate )
            {
                x = ( aWidth / 2  ) + Math.sin( radians ) * circleRadius;
                y = ( aHeight / 2 ) + Math.cos( radians ) * circleRadius;

                //aContext.save();
                //aContext.translate( aWidth / 2, aHeight / 2 );
                //aContext.rotate( radians );// Math.PI / 4 );
                //aContext.translate( -aWidth / 2, -aHeight / 2 );
            }
            aContext.drawImage( samples[ i ], 0, 0, sampleWidth, sampleHeight,
                                x, y, targetWidth, aHeight );

            if ( rotate ) {
                //aContext.restore();
                radians += incrementRadians;
            }
       }

//        aContext.drawImage( image, 0, 0, image.width, image.height,
//                            0, 0, aWidth, aHeight );
    }
};

// cached properties

var samples;
