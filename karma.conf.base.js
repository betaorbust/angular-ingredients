/*global
basePath: true,
files: true,
preprocessors: false,
JASMINE: false,
JASMINE_ADAPTER: false,
exclude: false,
junitReporter: false,
reporters: false,
port: false,
runnerPort: false,
colors: false,
logLevel: false,
LOG_INFO: false,
autoWatch: false,
browsers: false,
captureTimeout: false,
singleRun: false,
reportSlowerThan: false,
coverageReporter: false
*/

module.exports = {

	// base path, that will be used to resolve files and exclude
	basePath: '',


	// frameworks to use
	frameworks: ['jasmine'],


	// list of files / patterns to load in the browser
	files: [
		'lib/angular/*.js',
		'lib/angular/**/*.js',
		'lib/underscore/**/*.js',
		'services/**/*.js',
		// libraries only used in testing
		'tests/unit/lib/mocks/mock_module.js',
		'tests/unit/lib/**/*.js',
		// The templates, so they can be preprocessed
		'templates/**/*.html',
		'tests/unit/_common_setup.spec.js',
	],

	// list of files to exclude
	exclude: [

	],

	// Preprocessors to run before tests
	preprocessors: {
		'services/**/*.js': 'coverage',
		'templates/**/*.html': 'ng-html2js'
	},

	// test results reporter to use
	// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
	reporters: ['progress'],

	// Istanbul configuration
	coverageReporter: {
		type : 'html',
		dir : 'tests/coverage/',
		file : 'coverage.txt'
	},

	// web server port
	port: 9876,


	// enable / disable colors in the output (reporters and logs)
	colors: true,

	// enable / disable watching file and executing tests whenever any file changes
	autoWatch: true,

	// Start these browsers, currently available:
	// - Chrome
	// - ChromeCanary
	// - Firefox
	// - Opera
	// - Safari (only Mac)
	// - PhantomJS
	// - IE (only Windows)
	browsers: ['PhantomJS'],


	// If browser does not capture in given timeout [ms], kill it
	captureTimeout: 60000,


	// Continuous Integration mode
	// if true, it capture browsers, run tests and exit
	singleRun: false
};
