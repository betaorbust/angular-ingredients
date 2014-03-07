/**
 * @fileOverview Testing for the facebook service and facebook helper service.
 * @author Jacques Favreau (betaorbust)
 */

/*global afterEach, isPromise */


describe('The facebook service', function () {
	'use strict';

	var loadApi, def, emitEventSpy, resolveApiLoad;
	var AUTH_RESPONSE_SUCCESS, AUTH_RESPONSE_UNKNOWN, ME_RESPONSE, CURRENT_AUTH_RESPONSE,
		FEED_OPTIONS, FEED_SHARE_ID, FEED_SHARE_ERROR;
	var fbAuthStub, fbLoginStub, fbMeStub, fbLogingStatusStub, fbUiStub;

	beforeEach(function () {
		module('ingredients');
	});

	beforeEach(inject(function ($q, $rootScope, facebookHelper) {
		def = $q.defer();
		loadApi = autoStub(facebookHelper, 'loadApi', function(){return def.promise;});

		// These services warn and error when validation of arguments fails
		// and it junks the hell out of the console. This turns off error
		// and warn for the tests.
		sinon.stub(window.console, 'error');
		sinon.stub(window.console, 'warn');

		// Auth object when authed
		AUTH_RESPONSE_SUCCESS = {
			status: 'connected',
			authResponse: {
				accessToken: 'fry',
				expiresIn:'123',
				signedRequest:'bender',
				userID:'planetExpress2001'
			}
		};


		// Auth object when not authed
		AUTH_RESPONSE_UNKNOWN = {
			status: 'unknown'
		};

		CURRENT_AUTH_RESPONSE = AUTH_RESPONSE_SUCCESS;

		// successful FB.api('/me' [...] response
		ME_RESPONSE = {
			'first_name': 'Phillip',
			'gender': 'male',
			'id': '13303007',
			'last_name': 'Fry',
			'link': 'https://www.facebook.com/phillipjfry',
			'locale': 'en_US',
			'name': 'Phillip J. Fry',
			'timezone': -7,
			'updated_time': '2013-09-04T03:14:13+0000',
			'username': 'phillipjfry',
			'verified': true,
		};

		// Default options to launch a feed request with
		FEED_OPTIONS = {
			link: 'http://google.com',
			picture: 'http://example.com/planetExpress2001.jpg',
			name: 'Planet Express 2001',
			caption: 'Fear of a bot planet',
			description: 'Hitler.... on ice!',
			ref: 'futurama'
		};


		// What facebook would send back in a feed share error situation
		FEED_SHARE_ERROR = {error: 'Bender', content: 'Kiff'};

		// The id of the stubbed out share method
		FEED_SHARE_ID = 42;

		/**
		 * A convenience method to make the loadApi resolve its promise
		 */
		resolveApiLoad = function(){
			def.resolve(true);
			$rootScope.$apply();
		};

	}));

	beforeEach(inject(function(facebook) {
		emitEventSpy = autoSpy(facebook, 'emitEvent');

		window.FB = {
			getAuthResponse: function(){},
			getLoginStatus: function(){},
			login: function(){},
			api: function(){},
			ui: function(){}
		};

		fbAuthStub = autoStub(window.FB, 'getAuthResponse',
			function(){return CURRENT_AUTH_RESPONSE;});

		fbLoginStub = autoStub(window.FB, 'login', function(method){method(CURRENT_AUTH_RESPONSE);});

		fbLogingStatusStub = autoStub(window.FB, 'getLoginStatus',
			function(method){method(CURRENT_AUTH_RESPONSE);});

		fbMeStub = autoStub(window.FB, 'api', function(endpoint, method){method(ME_RESPONSE);});

		fbUiStub = autoStub(window.FB, 'ui', function(options, method){method(42);});
	}));

	afterEach(function() {
		// If you don't restore the console each time, everything goes to hell
		window.console.error.restore();
		window.console.warn.restore();
	});

	it('should be injectable', inject(function (facebook) {
		expect(facebook).toBeTruthy();
	}));

	it('should event with "loaded" when facebook helper has finished loading the API.',
		inject(function(){
			resolveApiLoad();
			expect(emitEventSpy.withArgs('loaded').callCount).toBe(1);
	}));

	describe('| The getAuthResponse method', function(){

		it('should return a promise',
			inject(function(facebook){
				var ret = facebook.getAuthResponse();
				expect(isPromise(ret)).toBeTruthy();
		}));

		it('should not resolve until the facebook api is loaded',
			inject(function(facebook){

				var ret = facebook.getAuthResponse();
				var val = resolved(ret);

				expect(val).toBeUndefined();
				resolveApiLoad();

				val = resolved(ret);
				expect(val).toBe(AUTH_RESPONSE_SUCCESS);
		}));

		it('should call out to FB.getAuthResponse',
			inject(function(facebook){
				facebook.getAuthResponse();
				resolveApiLoad();
				expect(fbAuthStub).toHaveBeenCalled();
		}));

		it('should should prompt the user via FB.login if not authed',
			inject(function(facebook){
				fbAuthStub.restore();
				fbAuthStub = autoStub(window.FB, 'getAuthResponse', function(){return undefined;});
				facebook.getAuthResponse();
				resolveApiLoad();
				expect(fbLoginStub).toHaveBeenCalled();
		}));
		it('should reject the promise if not authed, and facebook login does not auth',
			inject(function(facebook){
				fbAuthStub.restore();
				fbAuthStub = autoStub(window.FB, 'getAuthResponse', function(){return undefined;});
				fbLoginStub.restore();
				fbLoginStub = autoStub(window.FB, 'login', function(method){method(AUTH_RESPONSE_UNKNOWN);});
				resolveApiLoad();
				expect(rejected(facebook.getAuthResponse())).toBe(AUTH_RESPONSE_UNKNOWN);
		}));
		it('should resolve the promise if not authed, but facebook login does auth',
			inject(function(facebook){
				fbAuthStub.restore();
				fbAuthStub = autoStub(window.FB, 'getAuthResponse', function(){return undefined;});
				var ret = facebook.getAuthResponse();
				resolveApiLoad();
				expect(resolved(ret)).toBe(AUTH_RESPONSE_SUCCESS);
		}));
	});

	describe('| The getMeResponse method', function(){

		it('should return a promise',
			inject(function(facebook){
				var ret = facebook.getMeResponse();
				expect(isPromise(ret)).toBeTruthy();
		}));

		it('should should not resolve until the facebook api has loaded',
			inject(function(facebook){
				var ret = facebook.getMeResponse();
				var val = resolved(ret);

				expect(val).toBeUndefined();
				resolveApiLoad();

				val = resolved(ret);
				expect(val).toBe(ME_RESPONSE);
		}));

		it('should should call out to the facebook api /me endpoint',
			inject(function(facebook){
				facebook.getMeResponse();
				resolveApiLoad();
				expect(fbMeStub).toHaveBeenCalled();
		}));

		it('should resolve the promise if FB.api /me returns without error',
			inject(function(facebook){
				var ret = facebook.getMeResponse();
				resolveApiLoad();
				expect(resolved(ret)).toBe(ME_RESPONSE);
		}));

		it('should reject the promise if FB.api /me returns with an error',
			inject(function(facebook){
				ME_RESPONSE = {
					error: 'there was an error'
				};
				var ret = facebook.getMeResponse();
				resolveApiLoad();
				expect(rejected(ret)).toBe(ME_RESPONSE);
		}));
		it('should reject the promise if the status is not connected',
			inject(function(facebook){
				CURRENT_AUTH_RESPONSE = AUTH_RESPONSE_UNKNOWN;
				var ret = facebook.getMeResponse();
				resolveApiLoad();
				expect(rejected(ret)).toBe(CURRENT_AUTH_RESPONSE);

		}));
	});

	describe('| The feedShare method', function(){
		it('should return a promise',
			inject(function(facebook){
				var ret = facebook.feedShare();
				expect(isPromise(ret)).toBeTruthy();
		}));

		it('should reject the promise if no option object is provided',
			inject(function(facebook){
				var ret = facebook.feedShare();
				expect(rejected(ret)).toBe('feedShare requres an options object');
		}));

		it('should call out to FB.ui for the actual share mechanism',
			inject(function(facebook, $timeout){
				facebook.feedShare(FEED_OPTIONS);
				resolveApiLoad();
				$timeout.flush();
				expect(fbUiStub).toHaveBeenCalled();
		}));

		it('should wait until the Facebook api is loaded',
			inject(function(facebook, $timeout){
				facebook.feedShare(FEED_OPTIONS);
				expect(fbUiStub).not.toHaveBeenCalled();
				resolveApiLoad();
				$timeout.flush();
				expect(fbUiStub).toHaveBeenCalled();
		}));

		it('should reject with "user cancel" if facebook FB.ui returns a null',
			inject(function(facebook, $timeout){
				fbUiStub.restore();
				fbUiStub = autoStub(window.FB, 'ui', function(opts, callback){callback(null);});
				var ret = facebook.feedShare(FEED_OPTIONS);
				resolveApiLoad();
				$timeout.flush();
				expect(rejected(ret)).toBe('unshared cancel');
		}));

		it('should reject with "user close" if FB.ui returns an undefined',
			inject(function(facebook, $timeout){
				fbUiStub.restore();
				fbUiStub = autoStub(window.FB, 'ui', function(opts, callback){callback(undefined);});
				var ret = facebook.feedShare(FEED_OPTIONS);
				resolveApiLoad();
				$timeout.flush();
				expect(rejected(ret)).toBe('unshared close');
		}));

		it('should return the full error object if FB.ui returns a facebook error object',
			inject(function(facebook, $timeout){
				fbUiStub.restore();
				fbUiStub = autoStub(window.FB, 'ui',
					function(opts, callback){callback(FEED_SHARE_ERROR);});
				var ret = facebook.feedShare(FEED_OPTIONS);
				resolveApiLoad();
				$timeout.flush();
				expect(rejected(ret)).toBe(FEED_SHARE_ERROR);
		}));

		it('should resolve with the facebook response and event "feedShare" if successful share',
			inject(function(facebook, $timeout){
				var ret = facebook.feedShare(FEED_OPTIONS);
				resolveApiLoad();
				$timeout.flush();
				expect(resolved(ret)).toBe(FEED_SHARE_ID);
				expect(emitEventSpy.withArgs('feedShare').callCount).toBe(1);
		}));

		it('should append the current protocol to picture shares because facebook is dumb',
			inject(function(facebook, $timeout, $location){
				FEED_OPTIONS.picture = '//server.tld/picture.jpg';
				facebook.feedShare(FEED_OPTIONS);
				resolveApiLoad();
				$timeout.flush();

				// Alter the feed options in the expected mannter
				FEED_OPTIONS.picture = $location.protocol()+':'+FEED_OPTIONS.picture;
				FEED_OPTIONS.method = 'feed';
				expect(fbUiStub.withArgs(FEED_OPTIONS).callCount).toBe(1);
		}));

	});


});

describe('The facebook helper service', function () {
	'use strict';

	var libraryLoaderStub, FBStub;
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

	beforeEach(inject(function($q, $timeout, libraryLoader, facebookHelper) {

		window.FB = {init: function(){}};
		FBStub = autoStub(window.FB, 'init', function(){});

		def = $q.defer();
		libraryLoaderStub = autoStub(libraryLoader, 'loadLibraries', function(){return def.promise;});

		/**
		 * Convenience method for resolving the library load
		 */
		resolveLibraryLoad = function(){
			def.resolve(true);
			window.fbAsyncInit(); // FB's callback is to fbAsyncInit.
			$timeout.flush();
		};

		/**
		 * Conv. method for rejecting library load
		 */
		rejectLibraryLoad = function(){
			def.reject();
		};

		/**
		 * Resets the facebook helper service back to a "first run" state.
		 */
		resetHelper = function(){
			delete(window.fbAsyncInit);
			facebookHelper._init();
		};

	}));

	afterEach(inject(function() {
		resetHelper();
	}));

	it('should be injectable', inject(function(facebookHelper) {
		expect(facebookHelper).toBeTruthy();
	}));

	describe('| The loadApi method', function(){

		it('should return a promise',
			inject(function(facebookHelper){
				var ret = facebookHelper.loadApi();
				expect(isPromise(ret)).toBeTruthy();
		}));

		it('should create window.fbAsyncInit if it does not exist and otherwise leave it alone',
			inject(function(facebookHelper){
				// check that it makes it
				expect(window.fbAsyncInit).toBeUndefined();
				facebookHelper.loadApi();
				resolveLibraryLoad();
				expect(window.fbAsyncInit).toBeDefined();

				resetHelper();
				// define window.fbAsyncInit and see if it gets overwritten
				var a = function(){};
				window.fbAsyncInit = a;
				facebookHelper.loadApi();
				expect(window.fbAsyncInit).toBe(a);
		}));

		it('should use the library loader to load up the fbjssdk',
			inject(function(facebookHelper){
				facebookHelper.loadApi();
				resolveLibraryLoad();
				expect(libraryLoaderStub)
					.toHaveBeenCalled(['//connect.facebook.net/en_US/all.js']);
		}));

		it('should have injected the facebook root element',
			inject(function(facebookHelper){
				facebookHelper.loadApi();
				expect($('#fb-root').length).toBe(1);
		}));

		it('should return a promise that resolves when facebook inits',
			inject(function(facebookHelper){
				var ret = facebookHelper.loadApi();
				expect(resolved(ret)).toBeUndefined();
				resolveLibraryLoad();
				expect(resolved(ret)).toBeDefined();
		}));

		it('should reject the promise when the libraries fail to load',
			inject(function(facebookHelper, $timeout){
				var ret = facebookHelper.loadApi();
				$timeout.flush();
				expect(resolved(ret)).toBeUndefined();
				expect(rejected(ret)).toBeUndefined();
				rejectLibraryLoad();
				expect(rejected(ret)).toBeDefined();
		}));

		it('should do nothing if api has already loaded',
			inject(function(facebookHelper){
				// Run it the first time
				var ret = facebookHelper.loadApi();
				expect(resolved(ret)).toBeUndefined();
				resolveLibraryLoad();
				expect(resolved(ret)).toBeDefined();
				expect(libraryLoaderStub.callCount).toBe(1);

				// Run it the second time
				ret = facebookHelper.loadApi();
				expect(resolved(ret)).toBeDefined();
				expect(libraryLoaderStub.callCount).toBe(1);
		}));
	});

});