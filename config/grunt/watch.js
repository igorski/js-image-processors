module.exports = {
    js: {
        files: '<%= config.project.root %>**/*.js',
        tasks: ['browserify']
    },
    html: {
        files: '<%= config.project.root %>**/*.html',
        tasks: ['copy', 'replace']
    }
};
