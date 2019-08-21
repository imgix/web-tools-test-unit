var _ = require('lodash');

module.exports = function setUpTestUnit(gulp) {
  gulp.pipelineCache.put('test-unit', require('./pipelines/pipeline.test-unit.js'));

  require('./tasks/task.test-unit.js')(gulp);
}
