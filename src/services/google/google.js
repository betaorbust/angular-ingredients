/**
 * @ngdoc overview
 * @description Services for working with the google API.
 * @author Jacques Favreau (betaorbust)
 */

//=************************************
// *  USAGE NOTE!!!!!!!               *
// *  YOU MUST SET PROD_APP_ID &      *
// *  LOCAL_APP_ID IN THE GOOGLE      *
// *  HELPER SERVICE AT THE BOTTOM OF *
// *  THIS FILE OR GOOLGLE WON'T PLAY *
// *  NICE                            *
//=************************************

angular.module('ingredients')
/**
 * @ngdoc service
 * @name ingredients.google
 * @description
 * `google` is a service that allows authenticating via google and getting user information.
 * Very useful when you want to get user info after allowing a user to sign up via google.
 * https://www.udacity.com/account/auth#!/signup for a sign up flow that uses this.
 *
 * @requires $timeout
 * @requires $q
 * @requires ingredients.mixin
 * @requires ingredients.googleHelper
 */
.factory('google', ['$timeout', '$q', 'mixin', 'googleHelper',
	function ($timeout, $q, mixin, googleHelper) {
	'use strict';

	// ================ CONSTANTS ================
	/** const */
	var EMITTED_EVENTS = [
		'loaded', // When the google API's have loaded.
		];

	/** const */
	var GOOGLE_CONFIG = googleHelper.getConfig(); // Copy the config over from googleHelper

	// =================== INIT ==================
	googleHelper.loadApi().then(function(){self.emitEvent('loaded');});

	// ========= PUBLICLY EXPOSED METHODS ========
	var self = {
		/**
		 * @ngdoc method
		 * @name ingrediets.google#getToken
		 * @methodOf ingredients.google
		 * @description
		 * Initiates the OAuth 2.0 authorization process. The browser displays a popup window
		 * prompting the user authenticate and authorize. After the user authorizes, the popup
		 * closes and the callback function fires.
		 * See http://goo.gl/13rE7T	for details
		 * @param  {Boolean|Undefined} immediate  If true, then login uses "immediate mode", which
		 *                                        means that the token is refreshed behind the
		 *                                        scenes, and no UI is shown to the user.
		 * @returns {Promise}            A promise that will resolve to the token when the call
		 *                               comes back. Rejected otherwise.
		 */
		getToken: function(immediate){
			var deferred = $q.defer();
			if(typeof(immediate) === 'boolean' || typeof(immediate) === 'undefined'){
				immediate = immediate === true ? true : false;
				googleHelper.loadApi()
				.then(function() {
					window.gapi.auth.authorize(
						_.extend(
							{'response_type': 'code', 'immediate': immediate},
							GOOGLE_CONFIG),
						function(token) {
							$timeout(function(){
								if (token && token.code) {  // only true if user logged in and authorized us
									deferred.resolve(token);
								}else{
									var er = 'google.getToken failed to return a token!';
									console.warn(er);
									deferred.reject(er);
								}
							});
					});
				});
			}else{
				deferred.reject('Immediate must be boolean or undefined');
			}
			return deferred.promise;
		},

		/**
		 * @ngdoc method
		 * @name ingredients.google#getMeResponse
		 * @methodOf ingredients.google
		 * @description Gets the personal information about a user.
		 * @returns {Promise}   A promise that resolves to the gapi.client.oauth2.userinfo.get()
		 *                      value when everything is said and done. Rejects with the google
		 *                      server return google returns errors.
		 */
		getMeResponse: function() {
			var deferred = $q.defer();
			googleHelper.loadApi()
			.then(function() {
				// no id, so ask for full authorization...
				window.gapi.auth.authorize(
					_.extend({'immediate': true}, GOOGLE_CONFIG),
					function(token) {
						// so we can get the user's name/email for prefilling...
						window.gapi.client.load('oauth2', 'v2', function() {
							var request = window.gapi.client.oauth2.userinfo.get();
							request.execute(function(response) {
								response['token'] = token;
								// This happens outside of angular land (sometimes), so wrap it in a
								// timeout with an implied apply and blammo, we're in action.
								$timeout(function() {
									if(typeof(response['error']) !== 'undefined'){
										// If the google api sent us an error, reject the promise.
										deferred.reject(response);
									}else{
										// Resolve the promise with the whole response if ok.
										deferred.resolve(response);
									}
								});
							});
						});
					}
				);
			});
			return deferred.promise;
		}
	};

	return mixin.eventEmission(self, EMITTED_EVENTS);
}]);


angular.module('ingredients')
/**
 * @ngdoc service
 * @name ingredients.googleHelper
 * @description
 * `googleHelper` is an internal service that... well, helps the `google` service. It is not meant
 * to be used outside this context and should be considered not future safe.
 * @requires $timeout
 * @requires $q
 * @requires $location
 * @requires ingredients.libraryLoader
 */
.factory('googleHelper', ['$timeout', '$q', '$location', 'libraryLoader',
	function ($timeout, $q, $location, libraryLoader) {
	'use strict';

	var deferredLoad, apiLoaded;
	var PROD_APP_ID = 'YOUR-APP-ID.apps.googleusercontent.com';
	var LOCAL_APP_ID = 'YOUR-LOCAL-DEV-SERVER-ID.apps.googleusercontent.com';

	// ================ CONSTANTS ================

	/**
	 * @ngdoc object
	 * @name ingredients.googleHelper#GOOGLE_CONFIG
	 * @private
	 * @description The connection and request object for google
	 * @property {string} client_id The app/client id of YOUR application. Replace whatever
	 *                              is there now with your own.
	 * @property {string} scope	The scope you are requesting for this transaction. Go as
	 *                          conservative as you can here because it will put up scary
	 *                          requests to users if you ask for more. Don't scare anybody
	 *                          away :)
	 */
	/** const */
	var GOOGLE_CONFIG = {
		'client_id': PROD_APP_ID,
		'scope': 'https://www.googleapis.com/auth/userinfo.profile' +
			' https://www.googleapis.com/auth/userinfo.email'
	};

	// ========= PUBLICLY EXPOSED METHODS ========
	var self = {
		// Undocumented method. For internal/testing purposes ONLY.
		_init: function(){
			deferredLoad = $q.defer();
			apiLoaded = false;
			// automatically detect accepted local servers and switch to the testing app
			GOOGLE_CONFIG['client_id'] =
				$location.host() === '127.0.0.1' ? LOCAL_APP_ID : PROD_APP_ID;
		},

		// Undocumented method. For testing purposes ONLY.
		_consts: function(){
			return {
				PROD_APP_ID: PROD_APP_ID,
				LOCAL_APP_ID: LOCAL_APP_ID,
				CURRENT_APP_ID: GOOGLE_CONFIG['client_id']
			};
		},

		/**
		 * @ngdoc method
		 * @name ingredients.googleHelper#getConfig
		 * @methodOf ingredients.googleHelper
		 * @description Returns a copy of the current google config object.
		 * @returns {Promise}   A promise that resolves to the gapi.client.oauth2.userinfo.get()
		 *                      value when everything is said and done. Rejects with the google
		 *                      server return google returns errors.
		 */
		getConfig: function(){
			GOOGLE_CONFIG.foo = 'bar';
			return _.clone(GOOGLE_CONFIG);
		},

		/**
		 * @ngdoc method
		 * @name ingredients.googleHelper#loadApi
		 * @methodOf ingredients.googleHelper
		 * @description Loads up the plusone and client libraries for google, resolves apiLoaded
		 *              to true.
		 * @returns {Promise} A promise that resolves to if the api has loaded.
		 */
		loadApi: function() {
			if(apiLoaded !== true){
				if(!window.__GFDGoogle){
					window.__GFDGoogle = function(){
						// Init gapi so it's not popup blocked
						// See: http://goo.gl/AcIsLn
						window.gapi.auth.init(function(){
							// Timeout to deal with if we're already in a digest where $apply
							// will fail.
							$timeout(function(){
								apiLoaded = true;
								deferredLoad.resolve(true); // Set that google apis have loaded.
							});
						});
					};
				}
				libraryLoader.loadLibraries(['https://apis.google.com/js/client.js?onload=__GFDGoogle'])
				.then(
					function(){},
					function(){
						var reason = 'Google libraries failed to load!';
						console.warn(reason);
						deferredLoad.reject(reason);
					});
			}
			return deferredLoad.promise;
		}
	};

	// =================== INIT ==================
	self._init();

	return self;
}]);
