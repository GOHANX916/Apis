module.exports = (grunt)=>

    (require 'time-grunt') grunt
    (require 'load-grunt-tasks') grunt
    grunt.initConfig
        build: 'build',
        jshint:
            options:
                jshintrc: '.jshintrc'
            all: ['p.js', 'test/*.js']
        mochaTest:
            src: ['test/*.js']
        coveralls:
            all:
                src: 'coverage/lcov.info'
        watch:
            karma:
                files: ['*.js', 'test/*.js'],
                tasks: ['jshint', 'browserify']
        karma:
            unit:
                configFile: 'karma.conf.js'
        browserify:
            test:
                expand: true,
                cwd: 'test',
                src: '*.test.js',
                dest: '<%= build %>'

    grunt.registerTask 'test', ['mochaTest']
    grunt.registerTask 'default', ['jshint', 'test']
    