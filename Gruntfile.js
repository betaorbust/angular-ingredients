'use strict';
/*
 global module: true, require: true,
*/
var path = require('path');
/*jshint -W079 */
var _ = require('underscore');
/*jshint +W079 */

module.exports = function(grunt) {

	// Utility function: prepends a prefix to each item in
	// a list of file paths/glob expressions
	function prefixPaths(prefix, filePaths) {
		return _.map(filePaths, function (filePath) {
			return path.join(prefix, filePath);
		});
	}

	// Load all grunt modules except grunt-cli, since that's not used in the build
	require('matchdep').filterAll(['grunt-*', '!grunt-cli']).forEach(grunt.loadNpmTasks);

	// Base File Paths - always include the trailing slash
	// These must be kept in sync with the livereload gruntfile!
	var BASE_PATH = 'src/',
		MIN_PATH = 'minified/';



	// Project configuration.
	grunt.initConfig({
		'closureCompiler': {
			// Minify AND concatenate all our js into one udacity.js file
			'all': {
				'files': [{
					'src': ['/{,**/}*.js'],
					'dest': MIN_PATH,
					'cwd': BASE_PATH,
					'expand': true,
				}]
			},
			'options': {
				'compilerFile': 'util/closure_compiler.jar',
				'compilation_level': 'SIMPLE_OPTIMIZATIONS',
				'warning_level': 'verbose',
				'jscomp_off': ['checkTypes', 'fileoverviewTags', 'undefinedVars'],
				'summary_detail_level': 3
			}
		},
		'less': {
			// Minify our less files into udacity.css
			'all': {
				'files': [{
					'src': ['./{,**/}*.less'],
					'dest': MIN_PATH,
					'cwd': BASE_PATH,
					'expand': true,
					'ext': '.css'
				// All of the standalone directories in css/standalone/
				}],
				'options': {
					'cleancss': true
				}
			},
		},
		'copy': {
			'all': {
				'files': [{
					'src': ['**'],
					'dest': MIN_PATH,
					'cwd': BASE_PATH,
					'expand': true
				}]
			}
		},
		'clean': {
			'all': {
				'src': [
					MIN_PATH
				]
			},
		},
	});



	// ==================
	// = Internal Tasks =
	// ==================

	grunt.registerTask('default', 'Copys everything over and minifies what it can.', [
		'clean:all',
		'copy:all',
		'less:all',
		//'closure:all'
	]);
};
