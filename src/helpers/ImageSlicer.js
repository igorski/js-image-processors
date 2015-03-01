/**
 * Created by igorzinken on 01-03-15.
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
