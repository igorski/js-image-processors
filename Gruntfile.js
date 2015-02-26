var globals = require("./config/globals");

module.exports = function( grunt )
{
    grunt.initConfig(
    {
        pkg:         grunt.file.readJSON( "package.json" ),
        config:      globals.config,
        browserify:  globals.browserify,
        clean:       globals.clean,
        replace:     globals.replace,
        copy:        globals.copy,
        browserSync: globals.browsersync,
        watch:       globals.watch
    });

    grunt.loadNpmTasks( "grunt-browserify" );
    grunt.loadNpmTasks( "grunt-contrib-clean" );
    grunt.loadNpmTasks( "grunt-text-replace" );
    grunt.loadNpmTasks( "grunt-contrib-copy" );
    grunt.loadNpmTasks( "grunt-browser-sync" );
    grunt.loadNpmTasks( "grunt-contrib-watch" );

    grunt.registerTask( "start", function()
    {
        grunt.task.run( "clean" );
        grunt.task.run( "copy" );
        grunt.task.run( "replace" );
        grunt.task.run( "browserify" );
        grunt.task.run( "browserSync" );
        grunt.task.run( "watch" );
    });
};
