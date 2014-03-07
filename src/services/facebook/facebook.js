 /**
 * @fileOverview Services for working with the facebook API.
 * @author Jacques Favreau (betaorbust)
 */

//=************************************
// *  USAGE NOTE!!!!!!!               *
// *  YOU MUST SET FACEBOOK_APP_ID    *
// *  IN THE FACEBOOK HELPER SERVICE  *
// *  AT THE BOTTOM OF THIS FILE      *
// *  OR FACEBOOK WON'T PLAY NICE     *
//=************************************


angular.module('ingredients')

.factory('facebook', ['$q', '$timeout', '$location', 'mixin', 'facebookHelper',
	function ($q, $timeout, $location, mixin, facebookHelper) {
	'use strict';

	// ================ CONSTANTS ================
	/** const */
	var EMITTED_EVENTS = [
		'loaded', // When the API has loaded
		'feedShare', // When a facebook share happens
		'like']; // When a facebook like happens


	// =================== INIT ==================
	facebookHelper.loadApi().then(function(){self.emitEvent('loaded');});

	// ========= PUBLICLY EXPOSED METHODS ========
	var self = {
		/**
		 * Pop up a feed share dialog. Uses inline iframe if the user is authed, and otherwise
		 * uses a popup. Becase of the popup nature, this MUST be called as the result of a user
		 * click or the popup will be blocked.
		 * See goo.gl/DUMzYd for further documentation.
		 *
		 * @param  {Object} options              The feed share options
		 * @param {String} [options.link]        The link attached to this post
		 * @param {String} [options.picture]     The picture to share with the post. MUST be at
		 *                                       least 200x200.
		 * @param {String} [options.name]        The name of the link to share.
		 * @param {String} [options.caption]     The caption of the link (appears beneath the link
		 *                                       name). If not specified, this field is
		 *                                       automatically populated with the URL of the link.
		 * @param {String} [options.description] The description of the link (appears beneath the
		 *                                       link caption). If not specified, this field is
		 *                                       automatically populated by information scraped
		 *                                       from the link, typically the title of the page.
		 * @param {String} [options.ref]         A string (must be less than 50 characters and
		 *                                       contain only alphanumeric or +/=-.:_ characters)
		 *                                       reference for the category of feed post. This
		 *                                       category is used in Facebook Insights to help you
		 *                                       measure the performance of different types of post
		 * @return {Promise}        A promise that resolves to the ID of the post, or is rejected
		 *                          with either 'unshared cancel' or 'unshared close'
		 */
		feedShare: function(options){
			var deferred = $q.defer();
			if (typeof(options) !== 'object' || _.isNull(options)){
				return $q.reject('feedShare requres an options object');
			}else{
				options = _.extend({}, options, {method: 'feed'});
				// Facebook can't handle protocol relative urls, so patch those to work
				if (options.picture && options.picture.substring(0,2) === '//') {
					options.picture = $location.protocol()+':'+options.picture;
				}
				facebookHelper.loadApi() // The api might not be loaded yet, so wrap it here.
				.then(function(){
					// Kick off an facebook ui with the provided options.
					window.FB.ui(options, function(response){
						$timeout(function(){
							if(_.isNull(response)){
								// Facebook returns null when the user clicks the cancel button.
								deferred.reject('unshared cancel');
							}else if(response === undefined){
								// facebook returns undefined when the user closes the share window.
								deferred.reject('unshared close');
							}else if (response.error){
								// if we errored out, reject with that.
								deferred.reject(response);
							}else{
								// Otherwise we actually got a share; resolve with the share ID
								self.emitEvent('feedShare', response);
								deferred.resolve(response);
							}
						});
					});
				});
				return deferred.promise;
			}
		},


		/**
		 * Gets a facebook auth response.
		 * @returns {Promise}   A promise that resolves to the facebook return on successful
		 *                      call, and rejects with response during failure.
		 */
		getAuthResponse: function(){
			var deferred = $q.defer();
			// in case FB hasn't init'd yet, we wrap this
			facebookHelper.loadApi()
			.then(function() {
				var authResponse = window.FB.getAuthResponse();
				if (authResponse) {
					deferred.resolve(authResponse);
				}else{
					window.FB.login(function(response) {
						if (response.authResponse) {
							deferred.resolve(response);
						}else{
							deferred.reject(response);
						}
					}, {scope: 'email'});
				}
			});
			return deferred.promise;
		},

		/**
		 * Gets the user's information from facebook and run it inside the provided callback.
		 */
		getMeResponse: function() {
			var deferred = $q.defer();

			// in case FB hasn't init'd yet, we wrap this
			facebookHelper.loadApi()
			.then(function() {
				window.FB.getLoginStatus(function(response) {
					// If response.status is connected, we're authed and ready to go. Otherwise
					// they're either not logged in, or not authed. Both bad in this case.
					// See http://goo.gl/FqPLdY for more details
					if (response.status === 'connected') {
						window.FB.api('/me', function(response) {
							if(response.error){
								// If the response came back with an error, reject.
								deferred.reject(response);
							}else{
								// Otherwise we're good to go!
								deferred.resolve(response);
							}
						});
					}else{
						console.warn('tried to get me from FB but was not authd');
						deferred.reject(response);
					}
				});
			});
			return deferred.promise;
		}

	};

	return mixin.eventEmission(self, EMITTED_EVENTS);
}]);


angular.module('ingredients')

.factory('facebookHelper', ['$q', 'mixin', 'libraryLoader', '$timeout',
	function ($q, mixin, libraryLoader, $timeout) {
	'use strict';

	var deferredLoad, apiLoaded;


	// ================ CONSTANTS ================

	var FACEBOOK_APP_ID = 1;


	// ========= PUBLICLY EXPOSED METHODS ========
	var self = {
		/**
		 * For internal/testing purposes only.
		 * Resets the
		 * @return {[type]} [description]
		 */
		_init: function(){
			deferredLoad = $q.defer();
			apiLoaded = false;
		},

		/**
		 * Loads the facebook API and resolves its promise when complete.
		 * @returns {Promise} Resolves to true when the library is ready for use.
		 */
		loadApi: function() {
			// If it's already loaded, do nothing.
			if (apiLoaded !== true) {
				$('body').append('<div id="fb-root"></div>');
				if(!window.fbAsyncInit){
					// This loading code is from Facebook.
					window.fbAsyncInit = function() {
						window.FB.init({
							appId      : FACEBOOK_APP_ID,
							channelUrl : '//' + window.location.host + '/facebookChannel.html', // Channel File
							status     : true, // check login status
							cookie     : true, // enable cookies to allow the server to access the session
							xfbml      : true  // parse XFBML
						});
						apiLoaded = true;
						deferredLoad.resolve(true);
					};

				}
				// Ensure facebook's junk doesn't try to initialize during angular's bootstrap
				$timeout(function () {
					libraryLoader.loadLibraries(['//connect.facebook.net/en_US/all.js'])
					.then(
						null,
						function(){
							var reason = 'Facebook libraries failed to load!';
							console.warn(reason);
							deferredLoad.reject(reason);
						});
				}, 100);
			}
			return deferredLoad.promise;
		}
	};

	// =================== INIT ==================
	self._init();

	return self;
}]);
