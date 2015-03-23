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

/**
 * provides calculations for the most common image procedures
 */
var ImageUtil = module.exports =
{
    /** @public @const @type {string} */ MIME_JPEG  : "image/jpeg",
    /** @public @const @type {string} */ MIME_PNG   : "image/png",

    /**
     * resize an image, optionally with preserved ratios (via cropping)
     * this operation is synchronous as no HTMLImageElement sources are altered
     *
     * @public
     *
     * @param {Image}    aImage an HTMLImageElement to resize
     * @param {number}   aTargetWidth desired target width
     * @param {number}   aTargetHeight desired target height
     * @param {boolean=} aPreserveRatio whether we'd like to preserve the image ratio
     *                   defaults to true
     * @param {number=}  aOptRotation optional rotation to apply to the image ( = angle in degrees )
     * @param {boolean=} aEncodeAsPNG whether we like the maximum amount of quality or PNG transparency, this
     *                   means the output is in PNG encoding and might potentially be HUGE, off by default
     *
     * @return {Image} resized image object (new instance, not given aImage) with base64 encoded src attribute
     */
    resize : function( aImage, aTargetWidth, aTargetHeight, aPreserveRatio, aOptRotation, aEncodeAsPNG )
    {
        var imageDimensions = ImageUtil.getImageSize( aImage );
        var orgWidth        = imageDimensions.width;
        var orgHeight       = imageDimensions.height;

        if ( typeof aOptRotation !== "number" ) {
            aOptRotation = 0;
        }

        if ( typeof aPreserveRatio !== "boolean" ) {
            aPreserveRatio = true;
        }

        if ( orgWidth === aTargetWidth && orgHeight === aTargetHeight && aOptRotation === 0 )
        {
            return ImageCloner.clone( aImage );
        }

        var cvs    = document.createElement( "canvas" );
        var ctx    = cvs.getContext( "2d" );
        var ratioX = aTargetWidth  / orgWidth;
        var ratioY = aTargetHeight / orgHeight;
        var crop   = { left: 0, top: 0, width: aTargetWidth, height: aTargetHeight };

        // check if we need to crop the image to preserve its ratios

        if ( aPreserveRatio && ratioX !== ratioY )
        {
            var ratio      = 0;
            var toWidth    = orgWidth  * ratioX;
            var toHeight   = orgHeight * ratioY;
            var cropWidth  = orgWidth;
            var cropHeight = orgHeight;

            if ( toWidth > toHeight )
            {
                ratio = toWidth / toHeight;

                if ( ratioY > ratioX ) {
                    cropWidth = orgHeight * ratio;
                }
                else if ( ratioX > ratioY ) {
                    cropHeight = orgWidth / ratio;
                }
            }
            else if ( toHeight > toWidth )
            {
                ratio = toHeight / toWidth;
                cropHeight = orgWidth * ratio;
            }
            else if ( toHeight == toWidth )
            {
                cropHeight = cropWidth;
            }
            crop = ImageMath.crop( orgWidth, orgHeight, cropWidth, cropHeight );

            ratioX  = aTargetWidth  / crop.width;
            ratioY  = aTargetHeight / crop.height;
        }

        // update Canvas for resize operation

        cvs.width  = aTargetWidth;
        cvs.height = aTargetHeight;

        var preservedWidth  = orgWidth * ratioX;
        var preservedHeight = orgHeight * ratioY;
        var multiplier      = 1;

        // make sure we fill out the canvas

        if ( preservedHeight < aTargetHeight )
        {
            multiplier       = aTargetHeight / preservedHeight;
            preservedHeight *= multiplier;
            preservedWidth  *= multiplier;
        }
        else if ( preservedWidth < aTargetWidth )
        {
            multiplier      = aTargetWidth / preservedWidth;
            preservedHeight *= multiplier;
            preservedWidth  *= multiplier;
        }

        // did we specify a rotation ? > draw rescaled image at an angle

        if ( aOptRotation )
        {
            var bounds = ImageMath.rotate( preservedWidth, preservedHeight, aOptRotation );

            cvs.width  = bounds.width;
            cvs.height = bounds.height;

            ctx.translate( bounds.width * .5, bounds.height * .5 );
            ctx.rotate   ( Math.PI / 180 * aOptRotation );

            ctx.drawImage( aImage, -( preservedWidth * .5 ), -( preservedHeight * .5 ),
                           preservedWidth, preservedHeight );
        }
        else
        {

            // Make sure top-left render start is at least 0,0
            var leftPos = Math.max( ( preservedWidth  * .5 - aTargetWidth * .5 )  * -1 , 0);
            var topPos  = Math.max( ( preservedHeight * .5 - aTargetHeight * .5 ) * -1 , 0);

            // Make sure rendered dimensions never exceed canvas dimensions (or it renders black in Firefox)
            preservedWidth  = Math.min( cvs.width, preservedWidth );
            preservedHeight = Math.min( cvs.height, preservedHeight );

            // no rotation, draw rescaled image
            ctx.drawImage( aImage, 0, 0, orgWidth, orgHeight,
                           leftPos, topPos, preservedWidth, preservedHeight );

        }

        // IMPORTANT > assume photographic material as specifying no jpeg DataURL leads to MASSIVE memory consumption!!

        var newSource = cvs.toDataURL( aEncodeAsPNG ? ImageUtil.MIME_PNG : ImageUtil.MIME_JPEG );
        var out       = new Image();

        out.width       = cvs.width;
        out.height      = cvs.height;
        out.src         = newSource;

        ImageUtil.applyOrigin( aImage, out );

        return out;
    },

    /**
     * @public
     *
     * @param {Image} aImage
     * @param {number} aTargetWidth
     * @param {number} aTargetHeight
     * @param {boolean=} aPreserveRatio
     * @param {number=} aOptRotation
     * @param {boolean=} aEncodeAsPNG
     *
     * @return {Image}
     */
    smoothResize : function( aImage, aTargetWidth, aTargetHeight, aPreserveRatio, aOptRotation, aEncodeAsPNG )
    {
        var orgDimensions = ImageUtil.getImageSize( aImage );

        var oWidth  = orgDimensions.width;
        var oHeight = orgDimensions.height;

        if ( typeof aPreserveRatio !== "boolean" ) {
            aPreserveRatio = true;
        }

        // If scaling up, or scaling down to more than 50% of original size, use the normal resize
        if ( ( oWidth <= aTargetWidth * 2 ) || ( oHeight <= aTargetHeight * 2 ) )
        {
            return ImageUtil.resize( aImage, aTargetWidth, aTargetHeight, aPreserveRatio, aOptRotation, aEncodeAsPNG );
        }

        var steps             = 2;
        var intermediateImage = new Image();
        intermediateImage.src = aImage.src;

        ImageUtil.applyOrigin( aImage, intermediateImage );

        while ( ( oWidth > aTargetWidth * 2 ) || ( oHeight > aTargetHeight * 2 ) )
        {
            steps--;

            intermediateImage.src = ImageUtil.resize( /** @type {Image} */ ( intermediateImage ), oWidth * 0.5, oHeight * 0.5, aPreserveRatio, 0, aEncodeAsPNG ).src;

            oWidth  = intermediateImage.width;
            oHeight = intermediateImage.height;

            if ( steps <= 0 ) break;
        }

        if ( intermediateImage.width  !== aTargetWidth  ||
             intermediateImage.height !== aTargetHeight ||
             aOptRotation !== 0 )
        {
            intermediateImage.src = ImageUtil.resize( /** @type {Image} */ ( intermediateImage ), aTargetWidth, aTargetHeight, aPreserveRatio, aOptRotation, aEncodeAsPNG ).src;
        }

        return intermediateImage;
    },

    /**
     * @public
     *
     * @param {Image} aImage
     * @param {boolean=} aEncodeAsPNG whether we like the maximum amount of quality or PNG transparency, this
     *                   means the output is in PNG encoding and might potentially be HUGE, off by default
     * @return {string}
     */
    convertToDataSource : function( aImage, aEncodeAsPNG )
    {
        if ( typeof aEncodeAsPNG !== "boolean" ) {
            aEncodeAsPNG = false;
        }

        var imageDimensions = ImageUtil.getImageSize( aImage );

        var cvs    = document.createElement( "canvas" );
        cvs.width  = imageDimensions.width;
        cvs.height = imageDimensions.height;
        var ctx    = cvs.getContext( "2d" );

        ctx.drawImage( aImage, 0, 0, imageDimensions.width, imageDimensions.height );
        return cvs.toDataURL( aEncodeAsPNG ? ImageUtil.MIME_PNG : ImageUtil.MIME_JPEG );
    },

    /**
     * rotate an image
     * this operation is synchronous as no HTMLImageElement sources are altered
     *
     * @public
     *
     * @param {Image}    aImage a HTML Image element to resize
     * @param {number}   aRotation angle (in degrees) to rotate
     * @param {boolean=} aTransparent whether we like to maintain transparency, this
     *                   means the output is in PNG encoding and might potentially be HUGE, off by default
     * @param {number=}  aOptWidth optional width we assume for the source material (will default to the
     *                   width of aImage, but this can be erroneous if EXIF Orientation is ignored!)
     * @param {number=}  aOptHeight optional height we assume for the source material (will default to the
     *                   height of aImage, but this can be erroneous if EXIF Orientation is ignored!)
     *
     * @return {Image}
     */
    rotate : function( aImage, aRotation, aTransparent, aOptWidth, aOptHeight )
    {
        var cvs       = document.createElement( "canvas" );
        var ctx       = cvs.getContext( "2d" );

        var orgSize   = ImageUtil.getImageSize( aImage );
        var orgWidth  = orgSize.width;
        var orgHeight = orgSize.height;

        cvs.width     = typeof aOptWidth  === "number" ? aOptWidth  : orgWidth;
        cvs.height    = typeof aOptHeight === "number" ? aOptHeight : orgHeight;

        ctx.save();
        ctx.translate( cvs.width * .5, cvs.height * .5 );
        ctx.rotate   ( Math.PI / 180 * aRotation );

        //ImageUtil.drawImage( ctx, aImage, -orgWidth * .5, -orgHeight * .5, orgWidth, orgHeight );
        ctx.drawImage( aImage, -orgWidth * .5, -orgHeight * .5, orgSize.width, orgSize.height );
        ctx.restore();

        var newSource = cvs.toDataURL( aTransparent ? ImageUtil.MIME_PNG : ImageUtil.MIME_JPEG );
        var out       = new Image();

        ImageUtil.applyOrigin( aImage, out );

        out.width     = cvs.width;
        out.height    = cvs.height;
        out.src       = newSource;

        return out;
    },

    /**
     * @public
     * @param {Image} aImage
     * @return {boolean}
     */
    isImageDataAvailable: function ( aImage )
    {
        var bln = false;

        if ( aImage && aImage.src && aImage.src !== "" && aImage.width !== 0 )
        {
            bln = true;
        }
        return bln;
    },

    /**
     * checks the Image content and verifies whether it is
     * a PNG image
     *
     * @public
     *
     * @param {Image} aImage HTMLImageElement
     * @return {boolean}
     */
    isPNG : function( aImage )
    {
        // MIME data is contained in the first characters of the string
        // e.g. "data:image/png;base64," for a typical PNG

        var header = aImage.src.substr( 0, 24 );

        return header.indexOf( ImageUtil.MIME_PNG ) > -1;
    },

    /**
     * gets mime type
     *
     * @public
     *
     * @param {Image} aImage HTMLImageElement
     * @return {string}
     */
    getMimeType : function( aImage )
    {
        return ImageUtil.isPNG( aImage ) ? ImageUtil.MIME_PNG : ImageUtil.MIME_JPEG;
    },

    /**
     * @public
     * @param {Image|string} aImage
     * @return {boolean}
     */
    isDataSource: function( aImage )
    {
        // MIME data is contained in the first characters of the string
        // e.g. "data:image/png;base64," for a typical PNG

        return ( typeof aImage === "string" ? aImage : aImage.src ).substr( 0, 5 ) === "data:";
    },

    /**
     * use Lanczos algorhitm for rescaling, this provides clearer results
     * for large downscale operations, NOTE : this operation is more expensive on the CPU
     * than the "regular" resizing provided by this same util, and as such it is asynchronous
     *
     * @public
     *
     * @param {Image} aImage image to rescale
     * @param {number} aTargetWidth scaled width (Image will maintain aspect ratio)
     * @param {number} aKernelRadius kernel radius 1 - 8
     * @param {boolean=} aEncodeAsPNG whether we like the maximum amount of quality or PNG transparency, this
     *                   means the output is in PNG encoding and might potentially be HUGE, off by default
     * @param {!Function=} aCallback optional callback to execute once processing has completed, the callback
     *                     will receive a new resized Image as its first argument, if callback is undefined
     *                     given aImage will be altered to hold the resized data
     */
    resizeLanczos : function( aImage, aTargetWidth, aKernelRadius, aEncodeAsPNG, aCallback )
    {
        // Don't do this whole thing if not necessary
        if ( aImage.width === aTargetWidth )
        {
            if ( typeof aCallback === "function" )
            {
                aCallback( aImage );
            }
            return;
        }

        /**
         * creates a function that calculates lanczos weight
         *
         * @private
         *
         * @param {number} lobes
         * @return {Function}
         */
        var lanczosCreate = function( lobes )
        {
            return function( x )
            {
                if ( x > lobes )
                    return 0;

                x *= Math.PI;

                if ( Math.abs( x ) < 1e-16 ) {
                    return 1;
                }
                var xx = x / lobes;

                return Math.sin( x ) * Math.sin( xx ) / x / xx;
            }
        };

        /**
         * @private
         *
         * @param {number} u
         */
        var process1 = function( u )
        {
            var idx;

            center.x  = ( u + 0.5 ) * ratio;
            icenter.x = Math.floor( center.x );

            for ( var v = 0; v < dest.height; v++ )
            {
                center.y  = ( v + 0.5 ) * ratio;
                icenter.y = Math.floor( center.y );
                var a, r, g, b;
                a = r = g = b = 0;

                for ( var i = icenter.x - range2; i <= icenter.x + range2; i++ )
                {
                    if ( i < 0 || i >= src.width ) {
                        continue;
                    }
                    var f_x = Math.floor( 1000 * Math.abs( i - center.x ));

                    if ( !cacheLanc[ f_x ]) {
                        cacheLanc[ f_x ] = {};
                    }

                    for ( var j = icenter.y - range2; j <= icenter.y + range2; j++ )
                    {
                        if ( j < 0 || j >= src.height ) {
                            continue;
                        }
                        var f_y = Math.floor( 1000 * Math.abs( j - center.y ));

                        if ( cacheLanc[ f_x ][ f_y ] == undefined ) {
                            cacheLanc[ f_x ][ f_y ] = lanczos( Math.sqrt( Math.pow( f_x * rcp_ratio, 2 ) + Math.pow( f_y * rcp_ratio, 2 )) / 1000 );
                        }
                        var weight = cacheLanc[ f_x ][ f_y ];

                        if ( weight > 0 )
                        {
                            idx = ( j * src.width + i ) * 4;
                            a  += weight;
                            r  += weight * src.data[ idx ];
                            g  += weight * src.data[ idx + 1 ];
                            b  += weight * src.data[ idx + 2 ];
                        }
                    }
                }
                idx = ( v * dest.width + u ) * 3;

                dest.data[ idx ]     = r / a;
                dest.data[ idx + 1 ] = g / a;
                dest.data[ idx + 2 ] = b / a;
            }

            if ( ++u < dest.width ) {
                process1( u );
            }
            else {
                process2();
            }
        };

        /**
         * @private
         */
        var process2 = function()
        {
            cvs.width  = dest.width;
            cvs.height = dest.height;
            ctx.drawImage( aImage, 0, 0, dest.width, dest.height );
            src = ctx.getImageData( 0, 0, dest.width, dest.height );
            var idx, idx2;

            for ( var i = 0; i < dest.width; i++ )
            {
                for ( var j = 0; j < dest.height; j++ )
                {
                    idx  = ( j * dest.width + i ) * 3;
                    idx2 = ( j * dest.width + i ) * 4;
                    src.data[ idx2 ]     = dest.data[ idx ];
                    src.data[ idx2 + 1 ] = dest.data[ idx + 1 ];
                    src.data[ idx2 + 2 ] = dest.data[ idx + 2 ];
                }
            }
            ctx.putImageData( src, 0, 0 );
        };

        var cvs = document.createElement( "canvas" );
        var ctx = cvs.getContext( "2d" );

        cvs.width  = aImage.width;
        cvs.height = aImage.height;

        ctx.drawImage( aImage, 0, 0 );

        var src = ctx.getImageData( 0, 0, aImage.width, aImage.height );

        var dest = {
            width  : Math.round( aTargetWidth ),
            height : Math.round( aImage.height * aTargetWidth / aImage.width )
        };

        dest.data = [ dest.width * dest.height * 3 ];

        var lanczos   = lanczosCreate( aKernelRadius );
        var ratio     = aImage.width / aTargetWidth;
        var rcp_ratio = 2 / ratio;
        var range2    = Math.ceil( ratio * aKernelRadius / 2 );
        var cacheLanc = {};
        var center    = {};
        var icenter   = {};

        // delay execution until UI thread is free

        window[ "setImmediate" ]( function()
        {
            process1( 0 ); // starts crunching

            // IMPORTANT > assume photographic material as specifying no jpeg DataURL leads to MASSIVE memory consumption!!

            var newSource = cvs.toDataURL( aEncodeAsPNG ? ImageUtil.MIME_PNG : ImageUtil.MIME_JPEG );
            var img       = typeof aCallback === "function" ? new Image() : aImage;

            img.width     = cvs.width;
            img.height    = cvs.height;
            img.src       = newSource;

            ImageUtil.applyOrigin( aImage, img );

            if ( typeof aCallback === "function" ) {
                aCallback( img );
            }
        });
    },

    /**
     * convert an Images colour to gray scale, note this will not
     * return a new Image, but apply it on the original
     *
     * @public
     *
     * @param {Image} aImage
     * @param {boolean=} aEncodeAsPNG whether we like the maximum amount of quality or PNG transparency, this
     *                   means the output is in PNG encoding and might potentially be HUGE, off by default
     */
    toGrayScale : function( aImage, aEncodeAsPNG )
    {
        var cvs, ctx;

        cvs        = document.createElement( "canvas" );
        cvs.width  = aImage.width;
        cvs.height = aImage.height;
        ctx        = cvs.getContext( "2d" );

        ctx.drawImage( aImage, 0, 0 );

        var imageData = ctx.getImageData( 0, 0, aImage.width, aImage.height );
        var pixels    = imageData.data, grayscale;

        for ( var i = 0, n = pixels.length; i < n; i += 4 )
        {
            grayscale = pixels[ i ] * .3 + pixels[ i + 1 ] * .59 + pixels[ i + 2 ] * .11;

            pixels[ i     ] = grayscale;   // red
            pixels[ i + 1 ] = grayscale;   // green
            pixels[ i + 2 ] = grayscale;   // blue
            //pixels[ i + 3 ]              // is alpha
        }

        // commit changes
        ctx.putImageData( imageData, 0, 0 );

        aImage.src = cvs.toDataURL( aEncodeAsPNG ? ImageUtil.MIME_PNG : ImageUtil.MIME_JPEG );
    },

    /**
     * convert an Images colour to a sepia tone, note this will not
     * return a new Image, but apply it on the original
     *
     * @public
     *
     * @param {Image} aImage
     * @param {boolean=} aEncodeAsPNG whether we like the maximum amount of quality or PNG transparency, this
     *                   means the output is in PNG encoding and might potentially be HUGE, off by default
     */
    toSepia : function( aImage, aEncodeAsPNG )
    {
        var cvs, ctx;

        cvs        = document.createElement( "canvas" );
        cvs.width  = aImage.width;
        cvs.height = aImage.height;
        ctx        = cvs.getContext( "2d" );

        ctx.drawImage( /** @type {Image} */ ( aImage ), 0, 0, aImage.width, aImage.height );

        // get current image data
        var imageData   = ctx.getImageData( 0, 0, aImage.width, aImage.height );
        var pixels      = imageData.data;
        var destination = imageData.data;

        var h = cvs.height;
        var w = cvs.width;
        var y = h;

        // you can adjust these to alter the sepia flavour

        var sepiaDepth     = 0;
        var sepiaIntensity = 25;    // 0 - 255

        // keeps all color values within bounds
        var normalize = function( value )
        {
            if ( value < 0 ) {
                value = 0;
            }
            if ( value > 255 ) {
                value = 255;
            }
            return value;
        };

        // TODO: notoriously slow on iOS(6)... :(

        do
        {
            var iOffsetY = ( y - 1 ) * w * 4;
            var x = w;

            do
            {
                var iOffset = iOffsetY + ( x - 1 ) * 4;

                var iOldR = pixels[ iOffset ];
                var iOldG = pixels[ iOffset + 1 ];
                var iOldB = pixels[ iOffset + 2 ];

                var gry   = ( iOldR + iOldG + iOldB ) / 3;
                iOldR     = iOldG = iOldB = gry;
                iOldR     = iOldR + ( sepiaDepth * 2 );
                iOldG     = iOldG + sepiaDepth;

                normalize( iOldR );
                normalize( iOldG );
                normalize( iOldB );

                // Darken blue color to increase sepia effect
                iOldG = normalize( iOldG-= ( sepiaIntensity ));
                iOldB = normalize( iOldB-= ( sepiaIntensity * 1.75 ));

                destination[ iOffset ]     = iOldR;
                destination[ iOffset + 1 ] = iOldG;
                destination[ iOffset + 2 ] = iOldB;
                destination[ iOffset + 3 ] = pixels[ iOffset + 3 ];
            }
            while ( --x );

        } while ( --y );

        // commit changes
        ctx.putImageData( imageData, 0, 0 );

        aImage.src = cvs.toDataURL( aEncodeAsPNG ? ImageUtil.MIME_PNG : ImageUtil.MIME_JPEG );
    },

    /**
     * flip an image either horizontally or vertically, or both!
     * note this will not return a new Image, but apply it on the original
     *
     * @public
     *
     * @param {Image} aImage an Image element
     * @param {boolean} flipH whether to flip the Image horizontally
     * @param {boolean} flipV whether to flip the Image vertically
     * @param {boolean=} aEncodeAsPNG whether we like the maximum amount of quality or PNG transparency, this
     *                   means the output is in PNG encoding and might potentially be HUGE, off by default
     */
    flipImage : function( aImage, flipH, flipV, aEncodeAsPNG )
    {
        var cvs, ctx;
        
        cvs        = document.createElement( "canvas" );
        cvs.width  = aImage.width;
        cvs.height = aImage.height;
        ctx        = cvs.getContext( "2d" );

        var scaleH = flipH ? -1 : 1,                 // Set horizontal scale to -1 if flip horizontal
            scaleV = flipV ? -1 : 1,                 // Set vertical scale to -1 if flip vertical
            posX   = flipH ? aImage.width  * -1 : 0, // Set x position to -100% if flip horizontal
            posY   = flipV ? aImage.height * -1 : 0; // Set y position to -100% if flip vertical

        ctx.scale    ( scaleH, scaleV ); // Set scale to flip the image
        ctx.drawImage( aImage, posX, posY, aImage.width, aImage.height ); // draw the image

        aImage.src = cvs.toDataURL( aEncodeAsPNG ? ImageUtil.MIME_PNG : ImageUtil.MIME_JPEG );
    },

    /**
     * retrieve the dimensions of a given Image. As these properties
     * are used throughout the operations inside the ImageUtil, we need
     * to make sure these are correct as different browsers actually
     * need things done differently...
     *
     * @public
     *
     * @param {Image} aImage
     * @return {{ width: number, height: number }}
     */
    getImageSize : function( aImage )
    {
        var out = { width : aImage.width, height: aImage.height };

        // Internet Explorer 10 has an issue where Image.width and Image.height
        // don't necessarily correspond to their base64 content !!

        if ( window.navigator.userAgent.indexOf( "MSIE" ) > - 1 )
        {
            out.width  = aImage.naturalWidth;
            out.height = aImage.naturalHeight;
        }
        return out;
    },

    /**
     * Firefox and Safari will NOT accept images with erroneous crossOrigin attributes !
     * for cloning purposes, this method checks and applies the attribute accordingly
     *
     * @public
     *
     * @param {Image} aSourceImage source image whose crossOrigin properties should be cloned
     * @param {Image} aTargetImage taret image to apply the crossOrigin properties onto
     */
    applyOrigin : function( aSourceImage, aTargetImage )
    {
        if ( aSourceImage.crossOrigin && aSourceImage.length > 0 )
        {
            aTargetImage.crossOrigin = aSourceImage.crossOrigin;
        }
    },

    /**
     * a quick query to check whether the Image is ready for rendering
     *
     * @public
     *
     * @param {Image} aImage
     * @return {boolean}
     */
    isReady : function( aImage )
    {
        // IE (should be supported by most browsers bar Gecko)

        if ( !aImage.complete ) {
            return false;
        }

        if ( typeof aImage.naturalWidth !== "undefined" && aImage.naturalWidth === 0 ) {
            return false;
        }

        return true;
    },

    /**
     * XE-10117 All easy.Image operations are synchronous, except on Safari
     * where occassionally the Image is not actually ready while it should.
     *
     * @public
     *
     * @param {Image} aImage
     * @param {!Function} aCallback
     */
    onReady : function( aImage, aCallback )
    {
        var MAX_ITERATIONS = 255, iterations = 0;

        function readyCheck()
        {
            if ( ImageUtil.isReady( aImage ) ||
                ++iterations === MAX_ITERATIONS )
            {
                aCallback();
            }
            else {
                requestAnimationFrame( readyCheck );
            }
        }
        readyCheck();
    }
};

var ImageCloner = require( "./ImageCloner" );
var ImageMath   = require( "./MathHelper" );
