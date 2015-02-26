module.exports = {
    html: {
        src: ['<%= config.project.root %>index.html'],
        dest: ['<%= config.target.tmp %>index.html'],
        replacements: [
            {
                from: '{{title}}',
                to: '<%= pkg.name %>'
            },
            {
                from: '{{css}}',
                to: '<%= pkg.name %>.css'
            },
            {
                from: '{{js}}',
                to: '<%= pkg.name %>.js'
            }
        ]
    }
};