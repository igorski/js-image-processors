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
