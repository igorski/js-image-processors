module.exports = {
    src: {
        options: {
            browserifyOptions: {
                debug: true
            }
        },
        files: {
            '<%= config.target.tmp %><%= pkg.name %>.js' : [ '<%= config.project.root %>**/*.js' ]
        }
    }
};
