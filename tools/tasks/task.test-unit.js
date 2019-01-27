var _ = require('lodash'),
    merge = require('merge2'),
    argFilter = require('web-tools/tools/misc/arg-filter.js'),
    unitTestPipeline = require('./pipeline.test-unit.js');

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

  gulp.task('test-unit', taskDependencies, function task() {
    var extFiles,
        extStream,
        assetStreams,
        helperStream,
        testStream,
        allStreams,
        testPipeline;

    // Get Bower dev dependencies as well, since they can include test bootstraps
    extFiles = gulp.getExt({
      includeDev: true,
      filter: '**/*.js'
    });

    extStream = gulp.src(extFiles, {read: false});

    assetStreams = _.map(assetDependencies, function getStream(name) {
      return gulp.streamCache.get(name);
    });

    helperStream = gulp.src(testConfig.testHelpers, {read: false});

    testStream = gulp.src(testConfig.testSrc, {read: false})
      .pipe(argFilter());

    allStreams = merge.apply(null, _.flatten([
      extStream,
      assetStreams,
      helperStream,
      testStream
    ]));

    testPipeline = gulp.pipelineCache.get('test-unit');

    return allStreams.pipe(testPipeline(testConfig.karmaOptions));
  }, {
    description: 'Run unit tests with Karma.',
    category: 'test',
    arguments: {
        'match': '[Optional] A comma-separated list of strings to match test filepaths against.'
      }
  });
}
