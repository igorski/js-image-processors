/**
 * Created with IntelliJ IDEA.
 * User: izinken
 * Date: 02/03/15
 * Time: 18:42
 */
var MathHelper = module.exports =
{
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
