/**
 * Created by igorzinken on 22-03-15.
 */
var VoronoiCore = require( "./third_party/Voronoi_core" );

var Voronoi = module.exports =
{
    core              : new VoronoiCore(),
    sites             : [],
    diagram           : null,
    margin            : 0.15,
    canvas            : null,
    bbox              : { xl: 0, xr: 800, yt: 0, yb: 600 },
    benchmarkTimer    : null,
    benchmarkTimes    : new Array( 50 ),
    benchmarkPointer  : 0,
    benchmarkMaxSites : 100,
    colors            : [],

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
        var n = ( aWidth * aHeight ) / sampleSize;
        var clear = true;//false;

        if ( clear ) {
            Voronoi.sites  = [];
            Voronoi.colors = [];
            Voronoi.core   = new VoronoiCore();
        }
        var margin = Voronoi.margin * smearSize / 2;

        // create vertices

        var xmargin = aWidth  * margin,
            ymargin = aHeight * margin,
            xo = xmargin,
            dx = aWidth  - ( xmargin * 2 ),
            yo = ymargin,
            dy = aHeight - ( ymargin * 2 );

        var site, maxX = 0, maxY = 0;

        for ( var i = 0; i < n; ++i )
        {
            site = {
                x: xo + Math.random() * dx + Math.random() / dx,
                y: yo + Math.random() * dy + Math.random() / dy
            };
            if ( site.x > maxX ) maxX = site.x;
            if ( site.y > maxY ) maxY = site.y;

            Voronoi.sites.push( site );
        }

        // calculate ratios

        var ratioX = aWidth  / maxX;
        var ratioY = aHeight / maxY;
        console.log(ratioX,ratioY);
        Voronoi.core.recycle( Voronoi.diagram );
        Voronoi.diagram = Voronoi.core.compute( Voronoi.sites, Voronoi.bbox );

        for ( i = 0; i < n; ++i )
        {
            site = Voronoi.sites[ i ];
            Voronoi.colors.push( aCanvasHelper.getColor( Math.round( site.x ), Math.round( site.y ), 1 ));
        }
        console.log(Voronoi.diagram);
        // Voronoi calculate, now calculate average colors under the sites
       // var rgb = canvasHelper.getColor( ix, iy, size, smear );
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
        // re-cache if properties have changed

        if ( lastSampleSize !== sampleSize ||
             lastSmearSize  !== smearSize ||
             lastSkipSize   !== skipSize )
        {
            Voronoi.prepare( aContext, aWidth, aHeight, aCanvasHelper, sampleSize, smearSize, skipSize );
        }
        // uncomment below to draw Voronoi outlines
        /*
        // background
        aContext.globalAlpha = 1;
        aContext.beginPath();
        aContext.rect (0, 0, aWidth, aHeight );
        aContext.fillStyle = 'white';
        aContext.fill();
        aContext.strokeStyle = '#888';
        aContext.stroke();

        // voronoi
        if ( !Voronoi.diagram )
            return;

        // edges
        aContext.beginPath();
        aContext.strokeStyle = '#000';
        var edges = Voronoi.diagram.edges,
            iEdge = edges.length,
            edge, v;
        while (iEdge--) {
            edge = edges[iEdge];
            v = edge.va;
            aContext.moveTo(v.x,v.y);
            v = edge.vb;
            aContext.lineTo(v.x,v.y);
            }
        aContext.stroke();
        // edges
        aContext.beginPath();
        aContext.fillStyle = 'red';
        var vertices = Voronoi.diagram.vertices,
            iVertex = vertices.length;
        while (iVertex--) {
            v = vertices[iVertex];
            aContext.rect(v.x-1,v.y-1,3,3);
            }
        aContext.fill();
        // sites
        aContext.beginPath();
        aContext.fillStyle = '#44f';
        var sites = Voronoi.sites,
            iSite = sites.length;
        while (iSite--) {
            v = sites[iSite];
            aContext.rect(v.x-2/3,v.y-2/3,2,2);
            }
        aContext.fill();
        */
        // highlight cells
        var i, v, color;

        for ( i = 0; i < Voronoi.sites.length; ++i )
        {
            var cell = Voronoi.diagram.cells[ Voronoi.sites[ i ].voronoiId ];
            // there is no guarantee a Voronoi cell will exist for any
            // particular site
            if ( cell )
            {
                var halfedges = cell.halfedges,
                    nHalfedges = halfedges.length;
                if (nHalfedges > 2) {
                    v = halfedges[0].getStartpoint();
                    aContext.beginPath();
                    aContext.moveTo(v.x,v.y);
                    for (var iHalfedge=0; iHalfedge<nHalfedges; iHalfedge++) {
                        v = halfedges[iHalfedge].getEndpoint();
                        aContext.lineTo(v.x,v.y);
                    }

                    color = Voronoi.colors[ i ];

                    aContext.fillStyle = "rgba(" + color.r + "," +color.g + "," + color.b + ",255)";
                    aContext.fill();
                }
            }
        }
    }
};

// cached properties

var samples;
var lastSampleSize, lastSmearSize, lastSkipSize;
