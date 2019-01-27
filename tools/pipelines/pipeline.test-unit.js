var path = require('path'),
    _ = require('lodash'),
    through = require('through2'),
    gutil = require('gulp-util'),
    KarmaServer = require('karma').Server;

module.exports = function setupTestUnitPipeline(gulp) {
  return function testUnitPipeline(options) {
    var karmaFiles = [];

    options = _.defaultsDeep({}, options, {
      // Honestly, these are the only three options you should care about
      // Overwriting any of the other options will probably start fires
      reporters: ['progress'],
      browsers: ['PhantomJS'],
      captureTimeout: 20 * 1000,

      autoWatch: false,
      singleRun: true,
      frameworks: [
          'jasmine',
          'jasmine-matchers'
        ],
      plugins: [
          // We have to require() these because otherwise Karma will look in the wrong place
          require('karma-jasmine'),
          require('karma-jasmine-matchers'),
          require('karma-phantomjs-launcher'),
          require('karma-chrome-launcher'),
          require('karma-firefox-launcher'),
          require('karma-safari-launcher')
        ]
    });

    return through.obj(
      function transform(chunk, encoding, callback) {
          this.push(chunk);
          karmaFiles.push(chunk.path);
          callback();
        },
      function flush(done) {
          var th = this, // 'this' refers to the stream itself
              karmaOptions = _.merge({}, options, {
                  files: karmaFiles
                });

          new KarmaServer(karmaOptions, function onFinish(exitCode) {
            if (exitCode !== 0) {
              th.emit('error', new gutil.PluginError('test-unit', {
                message: 'Unit tests failed.',
                showStack: false
              }));
            }

            done();
          }).start();
        }
    );
  };
};
