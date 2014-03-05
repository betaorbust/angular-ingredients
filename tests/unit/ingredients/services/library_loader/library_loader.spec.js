describe('The libraryLoader service', function () {
	'use strict';
	beforeEach(function () {
		module('ingredients');
	});

	describe('| The loadLibraries method', function(){
		var fetchLibrariesStub;
		var deferred;
		var LIBRARIES_TO_LOAD = [
			'//code.jquery.com/jquery-1.10.2.min.js',
			'//underscorejs.org/underscore-min.js',
			'/fake/local/library.js'
		];
		beforeEach(inject(function ($q, libraryLoader) {
			deferred = $q.defer();
			fetchLibrariesStub = autoStub(libraryLoader, '_fetchLibrary', function(){
				return deferred.promise;
			});
		}));
		it('should return a promise',
			inject(function(libraryLoader){
				var libs = libraryLoader.loadLibraries(LIBRARIES_TO_LOAD);
				expect(isPromise(libs)).toBe(true);
		}));
		it('should resolve the returned promise when every library loads',
			inject(function(libraryLoader){
				var libs = libraryLoader.loadLibraries(LIBRARIES_TO_LOAD);
				deferred.resolve();
				expect(resolved(libs)).toBeDefined();
		}));
		it('should reject the promise if any of the libraries reject (fail to load)',
			inject(function(libraryLoader, $rootScope, $q){
				var libs = libraryLoader.loadLibraries(LIBRARIES_TO_LOAD);
				deferred.reject(false);
				expect(rejected(libs)).toBeDefined();
		}));
	});

	describe('| The _fetchLibrary method', function(){
		var deferred, promise, jQueryStub;
		var JQUERY_AJAX_CONFIG = {
			dataType: 'script',
			cache: true,
			url: '/planet_express.js'
		}

		beforeEach(inject(function($q) {
			
			deferred = $q.defer();
			promise = deferred.promise;
			jQueryStub = autoStub(jQuery, 'ajax', function(){
				var self = {
					success: function(fn){
						deferred.promise.then(function(){
							fn('success', '200');
						});
						return self;
					},
					error: function(fn){
						deferred.promise.then( null, function(){
							fn('error', 400)
						});
						return self;
					}
				};
				return self;
			})
		}));
		it('should return a promise',
			inject(function(libraryLoader){
				var hopefullyAPromise = libraryLoader._fetchLibrary('/fry.js');
				expect(isPromise(hopefullyAPromise)).toBe(true);
		}));
		it('should resolve its promise when the library loads',
			inject(function($timeout, libraryLoader){
				var promiseResolved = false;
				var lib = libraryLoader._fetchLibrary('/fry.js')
				.then(function(){
					promiseResolved = true;
				});
				deferred.resolve();
				$timeout.flush();
				expect(promiseResolved).toBe(true);
		}));
		it('should reject its promise when the library fails to load',
			inject(function($timeout, libraryLoader){
				var promiseResolved = false;
				var lib = libraryLoader._fetchLibrary('/fry.js')
				.then(function(){
					promiseResolved = true;
				});
				deferred.reject();
				$timeout.flush();
				expect(promiseResolved).toBe(false);
		}));

		it('should load a named library if previously defined',
			inject(function($timeout, libraryLoader){
				var FRY_SCRIPT = ['fry', JQUERY_AJAX_CONFIG.url];
				libraryLoader._addLibrary(FRY_SCRIPT[0], FRY_SCRIPT[1]);
				var lib = libraryLoader._fetchLibrary('fry');
				deferred.resolve();
				$timeout.flush();
				expect(jQueryStub).toHaveBeenCalledWith(JQUERY_AJAX_CONFIG);
		}));

		it('should not load a library that has previously been loaded',
			inject(function($timeout, libraryLoader){
				// Load the library once
				var lib = libraryLoader._fetchLibrary(JQUERY_AJAX_CONFIG.url);
				// Load the same library
				var lib2 = libraryLoader._fetchLibrary(JQUERY_AJAX_CONFIG.url);
				deferred.resolve();
				$timeout.flush();
				expect(jQueryStub).toHaveBeenCalledOnce()
				expect(jQueryStub).toHaveBeenCalledWith(JQUERY_AJAX_CONFIG);
		}));
	});

});