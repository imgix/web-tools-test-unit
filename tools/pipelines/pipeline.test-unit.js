var path = require('path'),
    _ = require('lodash'),
    through = require('through2'),
    gutil = require('gulp-util'),
    KarmaServer = require('karma').Server;

process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function setupTestUnitPipeline(gulp) {
  return function testUnitPipeline(options) {
    var karmaFiles = [],
        testFileCount = 0;

    options = _.defaultsDeep({}, options, {
      // Honestly, these are the only three options you should care about
      // Overwriting any of the other options will probably start fires
      reporters: ['progress'],
      browsers: ['ChromeHeadless'],
      captureTimeout: 20 * 1000,

      maxParallel: 7,

      autoWatch: false,
      singleRun: true,
      frameworks: [
          'parallel',
          'jasmine',
          'jasmine-matchers'
        ],
      plugins: [
          // We have to require() these because otherwise Karma will look in the wrong place
          require('karma-parallel'),
          require('karma-jasmine'),
          require('karma-jasmine-matchers'),
          require('karma-chrome-launcher'),
          require('karma-firefox-launcher')
        ]
    });

    return through.obj(
      function transform(chunk, encoding, callback) {
          this.push(chunk);
          karmaFiles.push(chunk.path);

          if (chunk.isTestFile) {
            testFileCount++;
          }

          callback();
        },
      function flush(done) {
          var th = this, // 'this' refers to the stream itself
              karmaOptions = _.merge({}, options, {
                  files: karmaFiles
                });

          if (testFileCount < options.maxParallel) {
            _.set(karmaOptions, 'parallelOptions.executors', testFileCount);
          } else {
            _.set(karmaOptions, 'parallelOptions.executors', options.maxParallel);
          }

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
