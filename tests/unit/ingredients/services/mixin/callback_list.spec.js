describe('The Callback List Service', function () {
	'use strict';
	beforeEach(function () {
		// This somehow magically adds the services to some
		// global namespace so they can be injected
		module('ingredients');
	});

	it('should be injectable', inject(function (callbackList) {
	  expect(callbackList).toBeTruthy();
	}));

	it('should be able to create a callback list', inject(function (callbackList) {
	  expect(callbackList.create()).toBeTruthy();
	}));

	// The callback list itself

	describe('| A callback list', function () {
		var list;
		// Some dummy functions
		var fun;
		var fun2;

	  beforeEach(inject(function (callbackList) {
	    list = callbackList.create();
			fun = function () { return 1; };
			fun2 = function () { return 2; };
	  }));

		it('should be able to return its internal callback list for debugging', inject(function () {
		  expect(list._getCallbacks()).toEqual([]);
		}));

		// Adding callbacks

		it('should be able to add a new callback to an empty callback list', function () {
			list.add(fun);
		  expect(list._getCallbacks()).toEqual([fun]);
		});

		it('should be able to add a new callback to a nonempty callback list', function () {
			list.add(fun);
			list.add(fun2);

			expect(list._getCallbacks()).toEqual([fun, fun2]);
		});

		it('should be able to add the same function to the list twice', function () {
		  list.add(fun);
			list.add(fun);

			expect(list._getCallbacks()).toEqual([fun, fun]);
		});


		// Firing the callback list

		it('shouldn\'t error when firing an empty list of callbacks with no arg', function () {
		  list.fire();
		});

		it('shouldn\'t error when firing an empty list of callbacks with an arg', function () {
		  list.fire({});
		});

		it('should be able to fire each callback in the list', function () {
		  var testValue = 0;
			var fun1 = function () { testValue += 1; };
			var fun2 = function () { testValue += 10; };
			var fun3 = function () { testValue += 100; };

			list.add(fun1).add(fun2).add(fun3);

			list.fire();

			expect(testValue).toEqual(111);
		});

		it('should be able to fire each callback in the list, passing along a single data argument', function () {
		  var testValue = 0;
			var fun1 = function (val) { testValue += val; };
			var fun2 = function (val) { testValue += val; };
			var fun3 = function (val) { testValue += val; };

			list.add(fun1).add(fun2).add(fun3);

			list.fire(10);

			expect(testValue).toEqual(30);
		});

		it('should be able to fire the list multiple times', function () {
		  var testValue = 0;
			var fun1 = function () { testValue += 1; };
			var fun2 = function () { testValue += 10; };
			var fun3 = function () { testValue += 100; };

			list.add(fun1).add(fun2).add(fun3);

			list.fire();
			list.fire();

			expect(testValue).toEqual(222);
		});

		// Add Callback with Memory / Auto-Fire Option

		it('should be able to add a callback with the memory flag set, causing it to' +
			 'immediately invoke with most recently fired data', function () {
			var message = 'nofun';

			var fun1 = function () { message += ' fun1 called'; };
			var fun2 = function () { message += ' fun2 called'; };

			list.add(fun1, true);
			list.fire();
			expect(message).toEqual('nofun fun1 called');

			list.add(fun2, true);

			// We expect fun1 and fun2 to only have been called once -- adding fun2 with autofire should
			// not cause fun1 to fire again.
			expect(message).toEqual('nofun fun1 called fun2 called');
		});

		it('doesn\'t auto-fire an added event if the list has never been fired', function () {
		  var epicFail = false;
			var fun1 = function () { epicFail = true; };

			list.add(fun1, true);

			expect(epicFail).toEqual(false);
		});

		it('auto-fires an added callback with the data from the most recent firing', function () {
			var message = '';

			var fun1 = function (data) { message += 'fun1 says ' + data; };
			var fun2 = function (data) { message += ' fun2 says ' + data; };

			list.add(fun1);
			list.fire('hi');
			expect(message).toEqual('fun1 says hi');

			list.add(fun2, true);
			expect(message).toEqual('fun1 says hi fun2 says hi');
		});

		it('auto-fires an added callback with the data from the most recent firing only', function () {
			var message = '';

			var fun1 = function () { message = 'fun1 fired and'; };
			var fun2 = function (data) { message += ' fun2 says ' + data; };

			list.add(fun1);
			list.fire('hi');
			list.fire('HEYO!');
			list.add(fun2, true);
			expect(message).toEqual('fun1 fired and fun2 says HEYO!');
		});

		// Add callback with auto remove on fire (invoke only once) option

		it('can auto-remove a callback after it has been fired', function () {
			var message = '';

			var fun1 = function () { message = 'fun1 fired once'; };

		  list.add(fun1, false, true);
			expect(message).toEqual('');

			list.fire();
			expect(message).toEqual('fun1 fired once');

			list.fire();
			expect(message).toEqual('fun1 fired once');
		});

		it('can auto-remove two callbacks, each after it has been fired', function () {
			var message = '';

			var fun1 = function () { message += 'fun1'; };
			var fun2 = function () { message += 'fun2'; };

		  list.add(fun1, false, true);
		  list.add(fun2, false, true);
			expect(message).toEqual('');

			list.fire();
			// should fire fun1, remove it, leaving message === 'fun1'
			// should then fire fun2, remove it, leaving mesage === 'fun1fun2'
			expect(message).toEqual('fun1fun2');

			// this fire shouldn't cause anything to change, because both should have already been
			// removed
			list.fire();
			expect(message).toEqual('fun1fun2');
		});

		it('can auto-remove a callback after it has been auto-fired', function () {
			var message = '';

			var fun1 = function () { message = 'fun1 fired once'; };

			list.fire();
		  list.add(fun1, true, true);
			expect(message).toEqual('fun1 fired once');

			list.fire();
			expect(message).toEqual('fun1 fired once');
		});

		it('does not auto-remove a callback with auto-fire enabled until the list has been fired at least once', function () {
			var message = '';

			var fun1 = function () { message = 'fun1 fired once'; };

		  list.add(fun1, true, true);
			expect(message).toEqual('');

			list.fire();
			expect(message).toEqual('fun1 fired once');
		});

		it('is empty after adding a function that listens once, then firing it', function () {
			var fun1 = function () {};

		  list.add(fun1, true, true);
			expect(list._getCallbacks().length).toEqual(1);

			list.fire();
			expect(list._getCallbacks().length).toEqual(0);
		});

		it('removes all exact copies of a function when auto-removing, but each still fires', function () {
			var count = 0;

			var fun1 = function () { count += 1; };
			var fun2 = function () { count += 10; };

		  list.add(fun1, true, true);
		  list.add(fun2, true, true);
		  list.add(fun1, true, true);
		  list.add(fun1, true, true);
			list.fire();

			// Fun1 should have been fired all three times, and only then should each of the copies have
			// been removed
			expect(count).toEqual(13);

			// The list should now be devoid of both fun1 and fun2
			expect(list._getCallbacks().length).toEqual(0);
		});

		// Ensure this happens because this is the documented behavior for now, even if it does seem a bit odd.
		// But seriously, who needs to add the same listener function multiple times with different options?
		// Just use an anonymous function then and this won't happen!
		it('removes all exact copies of a function when auto-removing one, even if the others didn\'t request auto-remove', function () {
			var count = 0;

			var fun1 = function () { count += 1; };
			var fun2 = function () { count += 10; };

			list.add(fun1, true, true);
			list.add(fun2, true, true);
			// This one will be auto-removed despite not requesting it. I don't feel one bit sorry for it.
			list.add(fun1, true, false);
			list.add(fun1, true, true);
			list.fire();

			// Fun1 should have been fired all three times, and only then should each of the copies have
			// been removed
			expect(count).toEqual(13);

			// The list should now be devoid of both fun1 and fun2. No fun for you!
			expect(list._getCallbacks().length).toEqual(0);
		});

		// Removing callbacks

		it('doesn\'t error when remove is called on an empty callback list', function () {
		  var fun1 = function () { return 7; };

			try {
				list.remove(fun1);
			} catch (e) {
				// TODO: find a fail() method
				this.fail('Exception: ' + e.message);
			}
		});

		it('should be able to remove a callback from the list', function () {
			var fun1 = function () { return 7; };

			list.add(fun1);
			expect(list._getCallbacks()).toEqual([fun1]);
			list.remove(fun1);
			expect(list._getCallbacks()).toEqual([]);
		});

		it('should remove only the exact specified callback from the list', function () {
			var fun1 = function () { return 7; };
			var fun2 = function () { return 7; };

			list.add(fun1);
			list.add(fun2);
			list.remove(fun1);
			expect(list._getCallbacks()).toContain(fun2);
			expect(list._getCallbacks()).not.toContain(fun1);
		});

		it('should remove duplicate refs to the exact specified callback from the list', function () {
			var fun1 = function () { return 7; };
			var fun2 = function () { return 7; };

			list.add(fun1);
			list.add(fun2);
			list.add(fun1);
			expect(list._getCallbacks().length).toEqual(3);
			list.remove(fun1);
			expect(list._getCallbacks()).toContain(fun2);
			expect(list._getCallbacks()).not.toContain(fun1);
		});

		it('should be able to remove and readd the same function to the list', function () {
			var fun1 = function () { return 7; };

		  list.add(fun1);
			expect(list._getCallbacks()).toEqual([fun1]);
			list.remove(fun1);
			expect(list._getCallbacks()).toEqual([]);
		  list.add(fun1);
			expect(list._getCallbacks()).toEqual([fun1]);
		});

		// This ensures the case does not occur where a callback removes itself or other callbacks
		// during firing and then tries to fire its removed-self. Instead, the list should fire all
		// registered callbacks, even if some are removed by other callbacks, and only manifest the
		// removal after the firing is done.
		it('should ensure mid-fire removals are processed after the current round of firings',
				function () {
			var count = 0;
			// Removes itself
			var fun1 = function () { list.remove(fun1); count += 1; };
			var fun2 = function () { count += 10; };
			var fun4 = function () { count += 1000; };
			// Removes another callback
			var fun3 = function () { list.remove(fun4); count += 100; };

			spyOn(window.console, 'error');

			list.add(fun1);
			list.add(fun2);
			list.add(fun3);
			list.add(fun4);
			list.fire();
			expect(window.console.error).not.toHaveBeenCalled();
			expect(count).toEqual(1111);
		});

		// ==================
		// = Error Handling =
		// ==================

		it('catches exceptions thrown by callbacks', function () {
		  var badfun = function () { throw new Error('Sadface'); };

			// To shut up console.error
			spyOn(window.console, 'error');

			list.add(badfun);
			expect(function () {
				list.fire();
			}).not.toThrow();
		});

		it('prints an error to the console and the callback body when catching' +
				' an exception thrown by a callback', function () {

		  var badfun = function () { throw new Error('Sadface'); };

			spyOn(window.console, 'error');

			list.add(badfun);
			list.fire();

			expect(window.console.error).toHaveBeenCalledWith('Exception encountered in callback:Sadface');
			expect(window.console.error).toHaveBeenCalledWith(badfun);
		});
	});
});

