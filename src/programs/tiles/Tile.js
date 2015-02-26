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
