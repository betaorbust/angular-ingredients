/**
 * @fileOverview Testing the google api service and its helper methods.
 * @author Jacques Favreau (betaorbust)
 */

/*global afterEach, isPromise */


describe('The google service', function () {
	'use strict';

	// stubs/spys
	var loadApiStub, authorizeStub, loadGapiStub, userInfoGetStub, getConfigStub;
	// 'global' variables
	var loadApiDef, FAKE_GOOGLE_CONFIG, FAKE_GOOGLE_USER, GOOGLE_TOKEN;
	// 'global' helper methods
	var resolveApiLoad;

	beforeEach(function () {
		module('ingredients');
	});

	beforeEach(inject(function ($q, $rootScope, $timeout, googleHelper) {
		FAKE_GOOGLE_CONFIG = {fry: 'leela'};
		FAKE_GOOGLE_USER = {name: 'Fry', job: 'delivery boy'};
		GOOGLE_TOKEN = 42;

		loadApiDef = $q.defer();
		loadApiStub = autoStub(googleHelper, 'loadApi', function(){return loadApiDef.promise;});
		getConfigStub = autoStub(googleHelper, 'getConfig', function(){return FAKE_GOOGLE_CONFIG;});

		/**
		 * A convenience method to make the loadApi resolve its promise
		 */
		resolveApiLoad = function(){
			loadApiDef.resolve(true);
			$rootScope.$apply();
			$timeout.flush();
		};

		//essentially define and then mock out the gapi services calls
		window.gapi = {
			auth:{
				// Defaults to always being signed in
				authorize: function(){}
			},
			client:{
				load: function(){},
				oauth2: {
					userinfo:{
						get: function(){}
					}
				}
			}
		};

		authorizeStub = autoStub(window.gapi.auth, 'authorize',
			function(options, callback){callback({code:GOOGLE_TOKEN});});
		loadGapiStub = autoStub(window.gapi.client, 'load',
			function(libary, version, callback){callback();});
		userInfoGetStub = autoStub(window.gapi.client.oauth2.userinfo, 'get',
			function(){
				var self = {
					execute: function(callback){
						$timeout(function() {callback(FAKE_GOOGLE_USER);}, 1);
					}
				};
				return self;
			});


		// These services warn and error when validation of arguments fails
		// and it junks the hell out of the console. This turns off error
		// and warn for the tests.
		sinon.stub(window.console, 'error');
		sinon.stub(window.console, 'warn');
	}));

	afterEach(function() {
		// If you don't restore the console each time, everything goes to hell
		window.console.error.restore();
		window.console.warn.restore();
	});

	it('should be injectable',
		inject(function(google){
			expect(google).toBeDefined();
	}));

	describe('| The getToken method', function(){
		it('should return a promise',
			inject(function(google){
				expect(isPromise(google.getToken(true))).toBeTruthy();
				expect(isPromise(google.getToken(false))).toBeTruthy();
				expect(isPromise(google.getToken())).toBeTruthy();
				expect(isPromise(google.getToken('not a boolean'))).toBeTruthy();
		}));

		it('should reject with error message if a immediate is not boolean or undefined',
			inject(function(google){
				expect(rejected(google.getToken('not a boolean'))).toBeDefined();
		}));

		it('should not resolve until the google API is loaded',
			inject(function(google){
				var token = google.getToken();
				expect(resolved(token)).toBeUndefined();
				expect(rejected(token)).toBeUndefined();
				resolveApiLoad();
				expect(resolved(token)).toBeDefined();
		}));

		it('should call out to gapi.auth.authorize to get a token',
			inject(function(google){
				google.getToken();
				resolveApiLoad();
				expect(authorizeStub).toHaveBeenCalledOnce();
		}));

		it('should should default to immediate as false if not supplied',
			inject(function(google){
				google.getToken();
				resolveApiLoad();
				expect(authorizeStub).toHaveBeenCalledOnce();
				expect(authorizeStub.args[0][0]['immediate']).toBe(false);
		}));

		it('should resolve with the token value if everything works',
			inject(function(google){
				var token = google.getToken();
				resolveApiLoad();
				expect(resolved(token)['code']).toBe(GOOGLE_TOKEN);
		}));

		it('should reject with error if authorize fails',
			inject(function(google){
				authorizeStub.restore();
				authorizeStub = autoStub(window.gapi.auth, 'authorize',
					function(options, callback){callback({oh: 'noes'});});
				var token = google.getToken();
				resolveApiLoad();
				expect(resolved(token)).toBeUndefined();
				expect(rejected(token)).toBeDefined();
		}));

	});

	describe('| The getMeResponse method', function(){
		it('should return a promise',
			inject(function(google){
				expect(isPromise(google.getMeResponse())).toBeTruthy();
		}));

		it('should wait until the api is loaded to resolve or reject',
			inject(function(google){
				var me = google.getMeResponse();
				expect(resolved(me)).toBeUndefined();
				expect(rejected(me)).toBeUndefined();
				resolveApiLoad();
				expect(resolved(me)).toBeDefined();
		}));

		it('should get an authorized token via a call to gapi.auth.authorize with immediate set to true',
			inject(function(google){
				google.getMeResponse();
				resolveApiLoad();
				expect(authorizeStub).toHaveBeenCalled();
				expect(authorizeStub.args[0][0]['immediate']).toBe(true);
		}));

		it('should call gapi.client.oauth2.userinfo.get to generate the user request',
			inject(function(google){
				google.getMeResponse();
				resolveApiLoad();
				expect(userInfoGetStub).toHaveBeenCalled();
		}));

		it('should resolve the promise if google responds to the request without error',
			inject(function(google){
				var me = google.getMeResponse();
				resolveApiLoad();
				expect(resolved(me)).toBe(FAKE_GOOGLE_USER);
		}));

		it('should reject the promise if google responds with an error',
			inject(function(google, $timeout){
				var GOOGLE_ERROR = {error: 'Emile Gorgonzola Burger'};
				userInfoGetStub.restore();
				userInfoGetStub = autoStub(window.gapi.client.oauth2.userinfo, 'get',
					function(){
						var self = {
							execute: function(callback){
								$timeout(function() {callback(GOOGLE_ERROR);}, 1);
							}
						};
						return self;
					});
				var me = google.getMeResponse();
				resolveApiLoad();
				expect(rejected(me)).toBe(GOOGLE_ERROR);
		}));
	});


});


describe('The google helper service', function () {
	'use strict';

	var libraryLoaderStub, gapiStub;
	var def;
	var resolveLibraryLoad, rejectLibraryLoad, resetHelper;

	beforeEach(function () {
		module('ingredients');
	});

	beforeEach(inject(function() {
		// These services warn and error when validation of arguments fails
		// and it junks the hell out of the console. This turns off error
		// and warn for the tests.
		sinon.stub(window.console, 'error');
		sinon.stub(window.console, 'warn');
	}));

	afterEach(function() {
		// If you don't restore the console each time, everything goes to hell
		window.console.error.restore();
		window.console.warn.restore();

	});

	beforeEach(inject(function($q, $timeout, googleHelper, libraryLoader) {

		window.gapi = {auth: {init: function(){}}};
		gapiStub = autoStub(window.gapi.auth, 'init', function(method){method();});

		def = $q.defer();
		libraryLoaderStub = autoStub(libraryLoader, 'loadLibraries', function(){return def.promise;});

		/**
		 * Convenience method for resolving the library load
		 */
		resolveLibraryLoad = function(){
			def.resolve(true);
			window.__GFDGoogle(); // google's clinet.js calls __GFDGoogle, but we have it stubbed out.
			$timeout.flush();
		};

		/**
		 * Conv. method for rejecting library load
		 */
		rejectLibraryLoad = function(){
			def.reject();
		};

		/**
		 * Resets the google helper service back to a "first run" state.
		 */
		resetHelper = function(){
			delete(window.__GFDGoogle);
			googleHelper._init();
		};

	}));

	afterEach(inject(function() {
		resetHelper();
	}));

	it('should be injectable', inject(function(googleHelper) {
		expect(googleHelper).toBeTruthy();
	}));

	describe('| The getConfig method', function(){
		it('should return a config object with client_id and scope set as string after init',
			inject(function(googleHelper){
				googleHelper._init();
				var config = googleHelper.getConfig();
				expect(typeof(config['client_id'])).toBe('string');
				expect(typeof(config['scope'])).toBe('string');
		}));
	});

	describe('| The loadApi method', function(){

		it('should return a promise',
			inject(function(googleHelper){
				var ret = googleHelper.loadApi();
				expect(isPromise(ret)).toBeTruthy();
		}));

		it('should create window.__GFDGoogle if it does not exist and otherwise leave it alone',
			inject(function(googleHelper){
				// check that it makes it
				expect(window.__GFDGoogle).toBeUndefined();
				googleHelper.loadApi();
				resolveLibraryLoad();
				expect(window.__GFDGoogle).toBeDefined();

				resetHelper();
				// define window.__GFDGoogle and see if it gets overwritten
				var a = function(){};
				window.__GFDGoogle = a;
				googleHelper.loadApi();
				expect(window.__GFDGoogle).toBe(a);

		}));

		it('should use the library loader to load up the google plusone and client js libraries',
			inject(function(googleHelper){
				googleHelper.loadApi();
				resolveLibraryLoad();
				expect(libraryLoaderStub)
					.toHaveBeenCalled(['https://apis.google.com/js/plusone.js',
					'https://apis.google.com/js/client.js?onload=__GFDGoogle']);
		}));

		it('should resolve the promise when the libraries load correctly',
			inject(function(googleHelper){
				var ret = googleHelper.loadApi();
				expect(resolved(ret)).toBeUndefined();
				resolveLibraryLoad();
				expect(resolved(ret)).toBeDefined();
		}));

		it('should reject the promise when the libraries fail to load',
			inject(function(googleHelper){
				var ret = googleHelper.loadApi();
				expect(resolved(ret)).toBeUndefined();
				expect(rejected(ret)).toBeUndefined();
				rejectLibraryLoad();
				expect(rejected(ret)).toBeDefined();
		}));

		it('should do nothing if api has already loaded',
			inject(function(googleHelper){
				// Run it the first time
				var ret = googleHelper.loadApi();
				expect(resolved(ret)).toBeUndefined();
				resolveLibraryLoad();
				expect(resolved(ret)).toBeDefined();
				expect(libraryLoaderStub.callCount).toBe(1);

				// Run it the second time
				ret = googleHelper.loadApi();
				expect(resolved(ret)).toBeDefined();
				expect(libraryLoaderStub.callCount).toBe(1);
		}));
		it('should use the local app id when on 127.0.0.1',
			inject(function(googleHelper, $location){
				autoStub($location, 'host', function(){return '127.0.0.1';});
				googleHelper._init();
				expect(googleHelper._consts()['CURRENT_APP_ID'])
					.toBe(googleHelper._consts()['LOCAL_APP_ID']);
		}));
		it('should use the local app id when not on 127.0.0.1',
			inject(function(googleHelper, $location){
				autoStub($location, 'host', function(){return '42.42.42.42';});
				googleHelper._init();
				expect(googleHelper._consts()['CURRENT_APP_ID'])
					.toBe(googleHelper._consts()['PROD_APP_ID']);
		}));
	});
});