angular.module('ingredients')

/**
 * @ngdoc function
 * @name ingredients.mixin
 *
 * @requires ingredients.callbackList
 *
 * @description The `mixin` service augments an object to have the ability to emit events, and
 * provides an interface where other code can add or remove event listeners.
 *
 * # General usage
 * The `mixin` service takes in a target object and a list of event names via eventEmission
 * and then augments that object to have addEventListener and removeEventListener methods for
 * those event names.
 * <pre>
 * 	angular.module('futurama').factory('nibbler', ['mixin', function (mixin) {
 * 		var EMITTED_EVENTS = ['eat', 'sleep', 'saveUniverse'];
 * 		var self = {
 * 			// public methods
 * 			food: function(amount){
 * 				self.emitEvent('eat', amount);
 * 			}
 * 		}
 * 		return mixin.eventEmission(self, EMITTED_EVENTS);
 * 	});
 * 	angular.module('futurama').factory('pig', ['nibbler', function (nibbler) {
 * 		var pigCount = 42;
 * 		// Sets up a listener and decrements the number of snouts.
 * 		nibbler.addEventListener('eat', function(amount){
 * 			pigCount -= amount;
 * 		})
 * 		var self = {
 * 			// public methods
 * 			getPigCount = function(){return pigCount};
 * 		}
 * 		return mixin.eventEmission(self, EMITTED_EVENTS);
 * 	});
 * </pre>
 */
.service('mixin', ['callbackList', function (callbackList) {
	'use strict';
	return {
		/**
		 * The actual event emission method that is called to set up an evented module.
		 * @param  {Object} targetObject         The object to be evented.
		 * @param  {Array.<String>} eventNames   Array of event names that are possible.
		 * @return {Object}                      The targetObject, augmented with mixin properties
		 *                                       to allow eventing.
		 */
		eventEmission: function (targetObject, eventNames) {
			// Map each event name to a list of callbacks
			var eventCallbacks = _.object(_.map(eventNames, function (eventName) {
				return [eventName, callbackList.create()];
			}));

			// Type safety checks: eventNames must be an array of strings,
			// while targetObject must be, of course, an object
			if (!_.isArray(eventNames) ||
				!_.all(eventNames, function(n) { return _.isString(n); })) {
				throw 'eventNames must be an array of strings';
			}
			if (!_.isObject(targetObject)) {
				throw 'targetObject must be an object to mix into';
			}

			/**
			 * Check that the given event name is valid and throw if it's not
			 *
			 * @private
			 */
			var whenEventNameIsValid = function (eventName, invalidityMessage, continuation) {
				if (eventCallbacks[eventName]) {
					continuation();
				} else {
					throw invalidityMessage;
				}
				return targetObject; // for chaining
			};

			// Safety check - ensure no properties are overwritten
			if (_.intersection(_.keys(targetObject),
				['addEventListener', 'removeEventListener', 'emitEvent']).length) {
				throw 'Can\'t add event methods--they already exist!';
			}

			// ====================
			// = Mixed in methods =
			// ====================

			/**
			 * Add a new listener callback for the specified event
			 *
			 * @public
			 *
			 * @param {String} eventName name of the event.
			 * @param {Function} callback function to call whenever the event is emitted.
			 * @param {Object} options Currently supports replayLast and removeOnDestructionOf
			 *		set 'replayLast' to true to replay the most recently emitted event immediately on this listener.
			 *		set 'removeOnDestructionOf' to a $scope instance to auto-remove this listener when the scope is destroyed.
			 *		set 'removeAfterFired' to true to auto-remove this listener after it is fired once.
			 *		NOTE: all 'remove' options will auto-remove every copy of that exact listener function.
			 *
			 *
			 * @example
			 * <pre>
			 *		interestingObject.addEventListener('excitingEvent', function () {
			 *			console.log("if this event already fired, this will log immediately!")
			 *		}, { 'replayLast': true });
			 * </pre>
			 *
			 * @example
			 * <pre>
			 *		interestingObject.addEventListener('excitingEvent', function () {
			 *			console.log("this will log until the scope is destroyed!")
			 *		}, { 'removeOnDestructionOf': $scope });
			 *		// $scope is the $scope of the directive/controller this call is in
			 * </pre>
			 *
			 * @example
			 * <pre>
			 *		interestingObject.addEventListener('excitingEvent', function () {
			 *			console.log("this will log the first time the event happens, and that's it!")
			 *		}, { 'removeAfterFired': true });
			 *		// $scope is the $scope of the directive/controller this call is in
			 * </pre>
			 *
			 * @return {object} The object the listener was added to, for chaining.
			*/
			targetObject.addEventListener = function (eventName, callback, options) {
				// Default options to none enabled if they were omitted
				options = options || {};

				// Let them know if they specified invalid options
				var unsupportedOptionsProvided = _.without(_.keys(options), 'replayLast', 'removeOnDestructionOf', 'removeAfterFired');
				if (unsupportedOptionsProvided.length) {
					throw new Error('Unsupported options ' + unsupportedOptionsProvided + ' when adding event listener');
				}

				return whenEventNameIsValid(eventName, 'Cannot listen for non-emitted event "' + eventName + '"', function () {
					// Ensure a callback was passed in
					if (!_.isFunction(callback)) {
						throw new Error('You must provide a callback to run when the "' + eventName + '" event is emitted');
					}

					eventCallbacks[eventName].add(callback, options.replayLast, options.removeAfterFired);

					// If enabled, set the callback to automatically be removed on scope destruction
					// check that the object passed in is a scope, or at least responds to $on
					if (_.isObject(options.removeOnDestructionOf) && options.removeOnDestructionOf.$on) {
						options.removeOnDestructionOf.$on('$destroy', function () {
							targetObject.removeEventListener(eventName, callback);
						});
					}
				});
			};


			/**
			 * Remove the provided function from the listeners for that event
			 *
			 * @public
			 *
			 * @param {String} eventName event you wish to remove the listener from
			 * @param {Function} callback listener function you wish to remove.
			 *		Note that this will remove all instances of that function, in case for some reason you added it multiple times.
			 *
			 * @return {Object} The object the listener was removed from, for chaining.
			 */
			targetObject.removeEventListener = function (eventName, callback) {
				return whenEventNameIsValid(eventName, 'Cannot remove listener from non-emitted event "' + eventName + '"', function () {
					eventCallbacks[eventName].remove(callback);
				});
			};

			/**
			 * Emit the specified event, optionally with some data. Private mixed into object.
			 *
			 * @private
			 *
			 * @param {String} eventName event to emit
			 *
			 * @param {Object} eventName [optional] data to be passed to each listener callback
			 *
			 * Note: if this argument is not not present or is undefined or null,
			 * listeners will recieve an empty object instead. This is so listeners can do
			 * property checks on the data without having to worry about the data itself being
			 * undefined or null and thus throwing a null ref exception.
			 *
			 *
			 * @return {Object} The object that emitted the event, for chaining.
			 */
			targetObject.emitEvent = function (eventName, eventData) {
				return whenEventNameIsValid(eventName, 'Cannot emit invalid event ' + eventName +
				'. Add to exposed events when mixing in.', function () {
					// Default data to an empty object if it's not provided
					if (eventData === undefined || eventData === null) {
						eventData = {};
					}
					eventCallbacks[eventName].fire(eventData);
				});
			};

			return targetObject;
		}
	};
}]);