/**
 * @fileOverview A service for generating front-end-only builds.
 * dependencies
 */
angular.module('website', []);

angular.module('website')
.factory('builder', [function () {
	'use strict';

}]);

var manifest = {
	name: 'Angular Elements',
	description: 'Useful angular services that help take the pain out of common tasks like ' +
		'social network integration, pub/sub, loading external libraries, and validating user ' +
		'input. Just a collection of solved problems to make your day easier :)',
	version: '0.1 alpha',
	base: '/src/',
	minifiedbase: '/src/minified/',
	packages: {
		'Core': {
			description: 'The core angular ingredients module.',
			files: ['angular_ingredients.js']
		},
		'Event Mixin': {
			description: 'A service for mixing in event pub/sub in Angular.',
			files: [
				'services/mixin/callback_list.js',
				'services/mixin/mixin.js'
			],
			dependencies: ['Core']
		},
		'Facebook Service': {
			description: 'Service for interacting (auth, sharing) with Facbook.',
			files: ['services/facebook/facebook.js'],
			dependencies: [
				'Core',
				'Event Mixin'
			]
		},
		'Google Service': {
			description: 'Service for interacting (auth) with Google',
			files: ['services/google/google.js'],
			dependencies: [
				'Core',
				'Event Mixin'
			]
		},
		'Library Loader Service': {
			description: 'A promise-based angular service for loading javascript files.',
			files: ['services/library_loader/library_loader.js'],
			dependencies: ['Core']
		},
		'Validator Service': {
			description: 'A service providing flexible and chainable validation of arbitrary ' +
				'values. (Think form or object validation.)',
			files: ['services/validator/validator.js'],
			dependencies: ['Core']
		}
	}
};