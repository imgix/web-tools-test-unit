var _ = require('lodash'),
    merge = require('merge2'),
    argFilter = require('web-tools/tools/misc/arg-filter'),
    unitTestPipeline = require('./test-unit.js');

module.exports = function setUpTask(gulp) {
  var testConfig = _.get(gulp, 'webToolsConfig.unitTests'),
      appAssetDependencies,
      extAssetDependencies,
      taskDependencies = [];

  function prefixAssetType(prefix, assetType) {
    var prefixed = prefix + '-' + assetType;
    taskDependencies.push('build-' + prefixed);
    return prefixed;
  }

  if (!testConfig) {
    return;
  }

  appAssetDependencies = _.map(testConfig.appAssetDependencies, _.partial(prefixAssetType, 'app'));
  extAssetDependencies = _.map(testConfig.extAssetDependencies, _.partial(prefixAssetType, 'ext'));

  gulp.task('test-unit', taskDependencies, function task() {
    var assetDependencyStreams,
        testStream;

    assetDependencyStreams = _.chain(appAssetDependencies)
      .concat(extAssetDependencies)
      .map(function getStream(name) {
          var stream = gulp.streamCache.get(name);

          if (!!stream) {
            assetDependencyStreams[name] = stream;
          }
        })
      .compact()
      .value();

    testStream = gulp.src(testConfig.testSrc, {read: false})
      .pipe(argFilter());

    return merge(
      assetDependencyStreams,
      testStream
    ).pipe(unitTestPipeline(testConfig.karmaOptions));
  }, {
    description: 'Run unit tests with Karma.',
    category: 'test',
    arguments: {
        'match': '[Optional] A comma-separated list of strings to match test filepaths against.'
      }
  });
}
