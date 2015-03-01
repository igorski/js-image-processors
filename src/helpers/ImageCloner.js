/**
 * Created by igorzinken on 01-03-15.
 */
var ImageCloner = module.exports =
{
    /**
     * clone an image
     *
     * @public
     *
     * @param {Image} aImage
     * @return {Image}
     */
    clone : function( aImage )
    {
        var out    = new Image();

        out.width  = aImage.width;
        out.height = aImage.height;

        out.src = aImage.src;

        return out;
    }
};
