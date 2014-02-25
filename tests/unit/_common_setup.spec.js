(function (window) {
	'use strict';


	/**
	 * Fixes template cache lookups to match preprocessed paths.  In your directive test, you should
	 * require the corresponding template module with a path that omits the leading '/' and drops the
	 * cache version suffix, because that's how karma's template precompiler works, like so:
	 *   module('templates/content_editor/permissions/principal.html');
	 * // TODO: transition this to karma's translater
	 */
	angular.module('ngMock').config(function($provide) {
		$provide.decorator('$templateCache', function($delegate) {
			var oldGet = $delegate.get;
			$delegate.get = function(path) {
				//  Strip leading slash and trailing cache version, if present.
				path = path.replace(/^\//, '').replace(/\?\d+$/, '');
				return oldGet(path);
			};
			return $delegate;
		});
	});


	// Some private global variables, used to implement global testing helper functions.
	var _$rootScope;
	var _allMocks, _allSpies;

	// Ignore global redefinition warnings
	/*jshint -W079 */
	/*jshint -W020 */

	/**
	 * Mocks out a target with Sinon, and automatically verifies it when the test ends.  Use instead of
	 * sinon.mock, and don't call verify() on your mocks.  See Sinon mocking docs here:
	 * http://sinonjs.org/docs/#mocks
	 */
	window.mock = function(target) {
		var targetMock = sinon.mock(target);
		_allMocks.push(targetMock);
		return targetMock;
	};

	/**
	 * Stubs out the method and spies on it with Sinon. Same method signatures
	 * as sinon.stub. Automatically auto-removes every spy after every test.
	 * There are likely some issues here that need to be fixed if you use
	 * nested describes.
	 * http://sinonjs.org/docs/#stubs
	 */
	window.autoStub = function (argOne, argTwo, argThree) {
		var targetStub = sinon.stub(argOne, argTwo, argThree);
		_allSpies.push(targetStub);
		return targetStub;
	};

	/**
	 * Spies on the method with Sinon. Same method signatures
	 * as sinon.spy. Automatically auto-removes every spy after every test.
	 * There are likely some issues here that need to be fixed
	 * if you use nested describes.
	 * http://sinonjs.org/docs/#spies
	 */
	window.autoSpy = function (argOne, argTwo) {
		var targetSpy = sinon.stub(argOne, argTwo);
		_allSpies.push(targetSpy);
		return targetSpy;
	};

	(function() {
		var oldDescribe = describe;
		window.describe = function(name, fn) {
			var extendedFn = function() {
				beforeEach(function () {
					_allSpies = [];
				});
				fn();
				beforeEach(inject(function ($rootScope) {
					_$rootScope = $rootScope;
					_allMocks = [];
				}));
				afterEach(function() {
					_.each(_allMocks, function (aMock) {
						aMock.verify();
					});
					_.each(_allSpies, function (aSpy) {
						aSpy.restore();
					});
				});
			};
			return oldDescribe(name, extendedFn);
		};
	}());


	/**
	 * Extracts the resolved value of a promise, or undefined if not yet resolved or rejected.  Example:
	 *   var result = myService.doSomethingLater();
	 *   $underlyingService.flush();
	 *   expect(resolved(result)).toEqual(42);
	 */
	window.resolved = function(promise) {
		var value;
		promise.then(function(result) {
			value = result;
		});
		_$rootScope.$apply();
		return value;
	};

	/**
	 * Extracts the rejected value of a promise, or undefined if resolved or not yet rejected.  Use like
	 * resolved() above, but for promises that you expect to fail.
	 */
	window.rejected = function(promise) {
		var value;
		promise.then(function() {}, function(result) {
			value = result;
		});
		_$rootScope.$apply();
		return value;
	};
}(window));