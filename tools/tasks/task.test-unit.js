var _ = require('lodash'),
    args = require('yargs').argv,
    merge = require('merge2'),
    through = require('through2');

module.exports = function setUpTask(gulp) {
  var testConfig = _.get(gulp, 'webToolsConfig.unitTests'),
      assetDependencies,
      taskDependencies = [];

  if (!testConfig) {
    return;
  }

  assetDependencies = _.map(testConfig.appAssetDependencies, function addType(type) {
    taskDependencies.push('build-app-' + type);
    return 'app-' + type;
  });

  gulp.task('test-unit', function task(taskDone) {
    return gulp.series(...taskDependencies, function build(seriesDone) {
      var extFiles,
          extStream,
          assetStreams,
          helperStream,
          testStream,
          regexMatchers,
          filterTestFiles,
          allStreams,
          testPipeline;

      // Get dev dependencies as well, since they can include test bootstraps
      extFiles = gulp.getExt({
        includeDev: true,
        filter: '**/*.js'
      });

      extStream = gulp.src(extFiles, {read: false});

      assetStreams = _.map(assetDependencies, function getStream(name) {
        return gulp.streamCache.get(name);
      });

      helperStream = gulp.src(testConfig.testHelpers, {read: false});

      testStream = gulp.src(testConfig.testSrc, {read: false});

      regexMatchers = _.chain(args)
        .get('match', '')
        .split(',')
        .map(function makeRegex(match) {
            return new RegExp(match.replace('/', '\\/'), 'i');
          })
        .value();

      // Filter and label test files
      filterTestFiles = through.obj(
        function transform(chunk, encoding, callback) {
            var matchesFilter = _.some(regexMatchers, function testFileWithRegex(regex) {
              return regex.test(chunk.path);
            });

            if (matchesFilter || !regexMatchers.length) {
              this.push(chunk);
              chunk.isTestFile = true;
            }

            callback();
          },
        function flush(done) {
            done();
          }
      );

      allStreams = merge(
        extStream,
        assetStreams,
        helperStream,
        testStream.pipe(filterTestFiles)
      );

      testPipeline = gulp.pipelineCache.get('test-unit');

      return allStreams
        .pipe(testPipeline(testConfig.karmaOptions))
        .on('end', function finishBuildTask () {
          seriesDone();
          taskDone();
        });
    })();
  }, {
    description: 'Run unit tests with Karma.',
    category: 'test',
    arguments: {
        'match': '[Optional] A comma-separated list of strings to match test filepaths against.'
      }
  });
}
