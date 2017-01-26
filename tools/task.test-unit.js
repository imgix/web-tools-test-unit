var _ = require('lodash'),
    merge = require('merge2'),
    mainBowerFiles = require('main-bower-files'),
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
    var bowerFiles,
        bowerStream,
        assetStreams,
        testStream,
        allStreams;

    // Get Bower dev dependencies as well, since they can include test bootstraps
    bowerFiles = mainBowerFiles({
      includeDev: true,
      paths: {
          bowerJson: _.get(gulp, 'webToolsConfig.bower.json'),
          bowerDirectory: _.get(gulp, 'webToolsConfig.bower.components')
        },
      filter: '**/*.js'
    });

    bowerStream = gulp.src(bowerFiles, {read: false});

    assetStreams = _.map(assetDependencies, function getStream(name) {
      return gulp.streamCache.get(name);
    });

    testStream = gulp.src(testConfig.testSrc, {read: false})
      .pipe(argFilter());

    allStreams = merge.apply(null, _.flatten([
      bowerStream,
      assetStreams,
      testStream
    ]));

    return allStreams.pipe(unitTestPipeline(testConfig.karmaOptions));
  }, {
    description: 'Run unit tests with Karma.',
    category: 'test',
    arguments: {
        'match': '[Optional] A comma-separated list of strings to match test filepaths against.'
      }
  });
}
