module.exports = {
    bsFiles: {
	src: [
		'dist/**/*'
	]
    },
    options: {
        watchTask: true,
        server: {
            baseDir: '<%= config.target.tmp %>',
            index: 'index.html'
        }
    }
};
