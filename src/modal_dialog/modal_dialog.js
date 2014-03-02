angular.module('ingredients')

/**
 * @description modal-dialog component definition directive. Simply
 *   place on a div like so: <div data-modal-dialog="someName">your content here</div>
 *   and then call it via the modal service: modal.activate('someName').
 *   For a detailed example please see the styles page.
 */
.directive('modalDialog', ['modal', function (modal) {
	'use strict';
	return {
		'restrict': 'A',
		'transclude': true,
		'scope': true,
		'template': '<div ng-show="isModalActive(name)" class="modal">' +
			'<div class="modal-backdrop"' +
					'data-ng-click="cancelUnlessBackdropCancelDisabled()"></div>' +
				'<div class="modal-dialog">' +
					'<div class="modal-content" data-ng-transclude>' +
					'</div>' +
				'</div>' +
			'</div>',
		'link': function postLink($scope, $element, $attributes) {
			// Exposed to the template contents but likely only needed
			// for internal template usage, not usage in dialog content.
			$scope.name = $attributes.modalDialog;

			// All just passthroughs to the modal functions, so you
			// don't have to make a controller in order to give basic
			// functionality to your modal
			$scope.isModalActive = function (modalName) {
				return modal.isModalActive(modalName);
			};

			$scope.cancelUnlessBackdropCancelDisabled = function (data) {
				if (!$attributes.disableBackdropCancel) {
					return modal.cancel(data);
				}
			};
		}
	};
}]);