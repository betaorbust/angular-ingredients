/*global require*/

module.exports = function(config) {
	var configuration = require('./karma.conf.base.js');

	// Run all the tests
	configuration.files.push('tests/unit/**/*.spec.js');

	configuration.reporters.push('coverage');

	// level of logging
	// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
	configuration.logLevel = config.LOG_ERROR;

  config.set(configuration);
};
