angular.module('ingredients')

/**
 * @description A set of functions for easy access to common
 *   actions a modal may want to take. Includes cancel, confirm,
 *   and getData to get the data passed along to activate
 *   when the modal was launched.
 */
.controller('modalUtility', ['$scope', 'modal', function ($scope, modal) {
	'use strict';
	// Utility accessor to get any optional data that
	// the activator of the current modal provided.
	$scope.getData = function () {
		return modal.getActiveModalData();
	};

	$scope.cancel = function (data) {
		return modal.cancel(data);
	};

	$scope.confirm = function (data) {
		return modal.confirm(data);
	};
	
}]);