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
module.exports = Tile;

function Tile( i, r, g, b, x, y, size )
{
    this.index = i;
    this.color = "rgba(" + r + "," + g + "," + b + ",255)";
    this.x     = x || 0;
    this.y     = y || 0;
    this.size  = size || 15;
    this.upper = Math.random() > .5;
}

/* class properties */

/** @public @type {number} */  Tile.prototype.index;
/** @public @type {number} */  Tile.prototype.x;
/** @public @type {number} */  Tile.prototype.y;
/** @public @type {number} */  Tile.prototype.size;
/** @public @type {number} */  Tile.prototype.upper;
/** @public @type {number} */  Tile.prototype.color;
/** @public @type {boolean} */ Tile.prototype.hasPairing = false;
/** @public @type {number} */  Tile.prototype.pairDirection = 0;

Tile.prototype.draw = function( ctx )
{
    ctx.fillStyle = this.color;
    ctx.beginPath();

    if ( this.upper )
    {
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( this.x + this.size, this.y );
        ctx.lineTo( this.x, this.y + this.size );
    }
    else {
        ctx.moveTo( this.x, this.y + this.size );
        ctx.lineTo( this.x + this.size, this.y + this.size );
        ctx.lineTo( this.x, this.y );
    }
    ctx.fill();
    ctx.closePath();
};
