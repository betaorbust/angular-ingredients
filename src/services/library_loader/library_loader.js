angular.module('ingredients')
/**
 * @ngdoc service
 * @name ingredients.libraryLoader
 * @description
 * The `libraryLoader` service is a gerneral-use service for angular promise-based loading of
 * external javascript libraries. It provides a promise that resolves when everything is loaded.
 * The calculation of the "is loaded" state is based on jQuery's ajax implementation.
 *
 * @requires $q
 * @requires $rootscope
 * @requires $timeout
 * @requires cacheVersion
 *
 * @return {Object}
 */
.factory('libraryLoader', ['$q', '$rootScope', '$timeout',
	function ($q, $rootScope, $timeout) {
	'use strict';

	// Local libraries that you'd like to refer to with shorthand names (makes updating them
	// in the future easier because then you only have to update the paths here) can be placed
	// in this object with the shorthand name as the key and the URI (relative path or full
	// URL) as the value
	// Examples:
	// jquery: '/local/copy/of/jquery.js',
	// underscore: 'http://underscore.cdn/version/42/underscore.js'
	var libraries = {};

	var libraryLoadPromises = {};


	var self = {
		/**
		 * @ngdoc method
		 * @name utlity.libraryLoader#loadLibraries
		 * @methodOf ingredients.libraryLoader
		 *
		 * @description Loads an set of libraries, returning a promise which resolves when all
		 *              loading is complete.
		 *
		 * @param  {Array.<String>} libraryNames A list of either predefined libraries (hard coded)
		 *                                       absolute paths, or urls to javascript libraries.
		 * @return {Promise}                     A promise that resolves when all requested libraries
		 *                                       have loaded. Rejects if any fail to load.
		 */
		loadLibraries: function(libraryNames) {
			return $q.all(_.map(libraryNames, function (libraryName) {
				return self._fetchLibrary(libraryName);
			}));
		},

		 // Undocumented internal method that does the actual fetching.
		 // @param  {String} libraryName The name or URI of a script resource.
		 // @return {Promise}            A promise that resolves or rejects when the jQuery AJAX
		 //                             request comes back.
		_fetchLibrary: function(libraryName) {
			var scriptSource = libraries[libraryName] ? libraries[libraryName] : libraryName;
			var deferred = $q.defer();

			// Already loaded, just return the lib promise
			if (libraryLoadPromises[libraryName]) {
				return libraryLoadPromises[libraryName];
			}
			// Fetch from the server/browser cache
			else {
				libraryLoadPromises[libraryName] = deferred.promise;

				jQuery.ajax({
					dataType: 'script',
					cache: true,
					url: scriptSource
				})
				.success(function (data, status) {
					// This occurs outside of angular, so run a manual safe apply
					$timeout(function(){
						deferred.resolve();
					});
				})
				.error(function (data, status) {
					// This occurs outside of angular, so run a manual safe apply
					$timeout(function(){
						deferred.reject();
					});
				});
			}


			return deferred.promise;
		},
		// undocumented internal method for altering the
		// loaded library list. Do not use externally.
		_addLibrary: function(libraryName, libraryPath){
			libraries[libraryName] = libraryPath;
		}
	};

	return self;
}]);