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
