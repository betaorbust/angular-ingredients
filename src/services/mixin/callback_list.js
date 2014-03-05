/**
 * @ngdoc overview
 * @name ingredients.callbackListProvider
 * @description
 *
 * # ingredients.callbackListProvider
 *
 * The `callbackList` is a service to creat... a list of callbacks. Each list can have functions
 * added to it and removed from it. The list can be fired, which synchronously invokes each
 * callback in the order added, optionally passing it some data.
 *
 */
angular.module('ingredients')

.factory('callbackList', function () {
	/**
	 * @ngdoc object
	 * @name ingredients.callbackList
	 * @description Each `callbackList` can have functions added to it and removed from it. The list can be
	 * fired, which synchronously invokes each callback in the order added, optionally passing it
	 * some data.
	 */
	var self = {
		/**
		 * ngdoc function
		 * @name ingredients.callbackListProvider#create
		 * @methodOf ingredients.callbackListProvider
		 * @function
		 *
		 * @description
		 * Create a new callback list and return it
		 *
		 * @return {Object} the callback object, exposing add, remove, and fire methods.
		 */
		create: function () {
			var callbacks = [];
			var mostRecentFireData;
			// Set once the list has been fired once, to then allow autofiring newly added callbacks
			var hasBeenFired = false;

			// Return the list itself from all public functions, so calls can be chained
			var thisList = {

				/**
				 * @ngdoc function
				 * @name ingredients.callbackList#create
				 * @function
				 *
				 * @description
				 * Add a new callback to the end of the list, optionally auto-firing the most
				 * recent fire event and its data on ONLY the callback being added.
				 *
				 * Works just like jquery.callbacks' memory option, only this can be specified
				 * for each callback as it is added to the list.
				 *
				 * @param {Function} callback           The callback method to be fired when the
				 *                                      event occurs
				 * @param {Boolean}  autoFireMostRecent If this is `true` and the callback list has
				 *                                      been fired, the most recent event will be
				 *                                      fired to new listeners as they join.
				 * @param {Boolean}  removeAfterFired   Removes the callback after it has been triggered.
				 */
				add: function(callback, autoFireMostRecent, removeAfterFired) {
					callbacks.push(callback);

					// Autofire will NOT occur on this callback if the list has never been fired yet.
					if (hasBeenFired && autoFireMostRecent) {
						callback(mostRecentFireData);

						// since this just auto-fired the callback, remove it immediately
						if (removeAfterFired) {
							thisList.remove(callback);
						}
					} else if (removeAfterFired) {
						// add a property to it so fire() will auto-remove it
						callback._removeOnFire = true;
					}

					return thisList;
				},

				/**
				 * @ngdoc function
				 * @name ingredients.callbackList#remove
				 * @function
				 * @description
				 * Remove *every* instance of the provided callback from the list
				 *
				 * @param  {Function} callback The callback function to be called when the event
				 *                             happens.
				 * @return {Object}            The callbackList object
				 */
				remove: function(callback) {
					var callbackListLength = callbacks.length;

					for (var i = 0; i < callbackListLength; i++) {
						if (callbacks[i] === callback) {
							callbacks.splice(i, 1);
							i -= 1;
						}
					}

					return thisList;
				},

				/**
				 * @ngdoc function
				 * @name ingredients.callbackList#fire
				 * @function
				 *
				 * @description
				 *
				 * Invoke each callback in the list in the order they were added, passing the data argument to each
				 *
				 * @param  {*} data The data to be passed to each listener's callback.
				 * @return {Object} The callbackList object.
				 */
				fire: function(data) {
					var i;
					// Copy the list before firing in case one of the callbacks
					// removes another one. In that case, the removed one should
					// fire during this call but no subsequent ones.
					var callbacksToFire = angular.copy(callbacks);
					var callbackListLength = callbacksToFire.length;

					for (i = 0; i < callbackListLength; i++) {
						// invoke the callback with the given data, if any
						try {
							callbacksToFire[i](data);
						} catch (exception) {
							console.error('Exception encountered in callback:' + exception.message);
							console.error(callbacksToFire[i]);
						}
					}

					mostRecentFireData = data;
					hasBeenFired = true;

					// Remove any callbacks marked for removal-after-firing
					for (i = 0; i < callbacks.length; i++) {
						if (callbacks[i]._removeOnFire === true) {
							// Remove the callback, then back up one so we don't skip anything
							// This shouldn't miss anything, even if multiple callbacks are removed,
							// because the current index is the first occurrence of this specific callback,
							// so the other occurrences must be after this one and thus won't be missed.
							thisList.remove(callbacks[i]);
							i -= 1;
						}
					}


					return thisList;
				},

				// Private: return the internal list of callbacks for debugging/testing
				_getCallbacks: function() {
					return callbacks;
				}
			};

			return thisList;
		}
	};

	return self;
});

