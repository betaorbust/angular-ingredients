angular.module('ingredients')

/**
 * @description A service for launching modal dialogs. Use Activate to
 * trigger the modal on the page with the given name created by the
 * modal-dialog directive, then attach resolution handlers to the promise
 * activate returns to act on the result of the modal.
 */
.factory('modal', ['$q', function ($q) {
	'use strict';
	var activeModalName = null;
	var activeModalDeferred = null;
	var activeModalData = null;

	var self = {
		/**
		 * @description Whether or not the given modal is currently showing to the user
		 *
		 * @param {String} modalName The name of the modal to check. Name is specified
		 * on the element the modal-dialog directive is on.
		 */
		isModalActive: function (modalName) {
			return modalName === activeModalName;
		},

		/**
		 * @description The additional optional data passed in to expose to the
		 *   currently active modal.
		 *
		 * @returns {*} The data - likely an object, though it could be anything.
		 */
		getActiveModalData: function () {
			return activeModalData;
		},

		/**
		 * @description Show the modal with the given name. The modal must have
		 *   an instance of the modal-dialog directive already on the page with
		 *   the given name for this to work. Any existing active modals will be
		 *   canceled before activating the new one.
		 *
		 * @param {String} modalName The name of the modal to present to the user.
		 * @param {Object} modalData Optional: an extra data object that is exposed
		 *   to the modal template through a getData() convenience method. This
		 *   is intended to allow very basic customization of the modal--any
		 *   additional behavior desired for the modal should instead be
		 *   provided by a custom controller.
		 * @returns {Promise} A promise that resolves or rejects, optionally with
		 *   some data provided by the modal to indicate the user's action in the modal.
		 *   If the modal was cancelled via the close button or clicking outside it,
		 *   this promise will be rejected with no additional data.
		 */
		activate: function (modalName, modalData) {
			if (activeModalName) { self.cancel();	}
			activeModalName = modalName;
			activeModalData = modalData;
			activeModalDeferred = $q.defer();
			return activeModalDeferred.promise;
		},

		/**
		 * @description Returns whether or not there is any active modal on the page.
		 */
		isActive: function () {
			return !!activeModalName;
		},

		/**
		 * @description Close the modal as a success.
		 *
		 * @param {*} data Optional data to pass to the resolution
		 * handler for the promise activate returned.
		*/
		confirm: function (data) {
			var deferred = activeModalDeferred;
			activeModalName = null;
			activeModalDeferred = null;
			deferred.resolve(data);
		},

		/**
		 * @description Close the modal as a non-success.
		 *
		 * @param {*} data Optional data to pass to the rejection
		 * handler for the promise activate returned.
		*/
		cancel: function (data) {
			var deferred = activeModalDeferred;
			activeModalName = null;
			activeModalDeferred = null;
			deferred.reject(data);
		}
	};
	return self;
}]);