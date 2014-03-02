angular.module('ingredients')

// This directive is applied to the <body> tag to facilitate
// conditional application of the .modal-open class that prevents
// scrolling when a modal is open. It should not be used anywhere else.
.directive('modalAntiScrollHelper', ['modal', function (modal) {
	'use strict';
	return {
		'restrict': 'A',
		'link': function postLink($scope, $element, $attributes) {
			$scope.isModalActive = modal.isActive;
		}
	};
}]);