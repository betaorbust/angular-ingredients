
describe('An object with event emission mixed in', function () {
	var testObj1, testObj2;

	beforeEach(function () {
		module('ingredients');
		inject(function (mixin) {
			testObj1 = mixin.eventEmission({}, ['mainEvent', 'otherEvent']);

			testObj2 = {};
		});
	});

	it('should provide the public methods addEventListener, removeEventListener, and emitEvent',
		inject(function () {

		expect(testObj1.addEventListener).toBeTruthy();
		expect(testObj1.removeEventListener).toBeTruthy();
		expect(testObj1.emitEvent).toBeTruthy();
	}));

	// Error Handling

	it('throws an error if a listener is added with no callback', function () {
		expect(function () {
			testObj1.addEventListener('mainEvent');
		}).toThrow(new Error('You must provide a callback to run when the "mainEvent" event is emitted'));
	});

	it('throws an error if a listener is added to an event that isn\'t emitted', function () {
		expect(function () {
			testObj1.addEventListener('nonEmittedEvent', function () {});
		}).toThrow(new Error('Cannot listen for non-emitted event "nonEmittedEvent"'));
	});

	it('throws an error if a listener is removed from an event that isn\'t emitted', function () {
		expect(function () {
			testObj1.removeEventListener('nonEmittedEvent', function () {});
		}).toThrow(new Error('Cannot remove listener from non-emitted event "nonEmittedEvent"'));
	});

	// Listening

	it('can add a listener for an event', function () {
		testObj1.addEventListener('mainEvent', function () {});
	});

	it('will deliver the data emitted with the event to a listener', function () {
		testObj1.addEventListener('mainEvent', function (data) {
			expect(data).toEqual(7);
		});

		testObj1.emitEvent('mainEvent', 7);
	});

	it('will pass the listener an empty object if no data is sent with the event emission', function () {
		testObj1.addEventListener('mainEvent', function (data) {
			expect(data).toEqual({});
		});

		testObj1.emitEvent('mainEvent');
	});

	it('will pass the listener an empty object if null data is sent with the event emission', function () {
		testObj1.addEventListener('mainEvent', function (data) {
			expect(data).toEqual({});
		});

		testObj1.emitEvent('mainEvent', null);
	});

	it('will pass the listener the emitted data even if the emitted data is falsy (but not null or undefined)', function () {
		var called = 0;

		testObj1.addEventListener('mainEvent', function (data) {
			called++;

			if (called === 1) {
				expect(data).toEqual(0);
			} else if (called === 2) {
				expect(data).toEqual(false);
			} else	if (called === 3) {
				expect(data).toEqual('');
			}
		});

		testObj1.emitEvent('mainEvent', 0);
		testObj1.emitEvent('mainEvent', false);
		testObj1.emitEvent('mainEvent', '');

		// Just a sanity check that the listener was called and worked on all 3 pieces of data
		expect(called).toEqual(3);
	});

	it('won\'t trigger a listener callback until the event is emitted', function () {
		var called = 0;

		testObj1.emitEvent('mainEvent');
		testObj1.addEventListener('mainEvent', function () { called++; });

		expect(called).toEqual(0);
	});

	it('will throw if invalid options are passed in when adding a listener', function () {
		var unsupportedOptionsProvided = ['badoption1', 'badoption2'];
		expect(function () {
			testObj1.addEventListener('mainEvent', function () {}, { badoption1: true, badoption2: {} });
		}).toThrow(new Error('Unsupported options ' + unsupportedOptionsProvided + ' when adding event listener'));
	});

	it('can add a listener that is immediately triggered with the most recent event emission', function () {
		var called = 0;

		testObj1.emitEvent('mainEvent');
		testObj1.addEventListener('mainEvent', function () { called++; }, { replayLast: true });

		expect(called).toEqual(1);
	});

	it('won\'t try to replay the last emit on the added listener if the event hasn\'t been emitted yet', function () {
		var called = 0;

		testObj1.addEventListener('mainEvent', function () { called++; }, { replayLast: true });

		expect(called).toEqual(0);
	});

	it('automatically removes a listener if removeOnDestructionOf option is set', inject(function ($rootScope) {
		var called = 0;
		var scope = $rootScope.$new();

		testObj1.addEventListener('mainEvent', function () { called++; }, { 'removeOnDestructionOf': scope });
		testObj1.emitEvent('mainEvent');

		expect(called).toEqual(1);

		scope.$broadcast('$destroy');

		// should have been removed
		testObj1.emitEvent('mainEvent');

		expect(called).toEqual(1);
	}));

	it('automatically removes a listener after it is fired if removeAfterFired option is set', inject(function ($rootScope) {
		var called = 0;

		testObj1.addEventListener('mainEvent', function () { called++; }, { 'removeAfterFired': true });
		testObj1.emitEvent('mainEvent');

		expect(called).toEqual(1);

		// should have been removed
		testObj1.emitEvent('mainEvent');

		expect(called).toEqual(1);
	}));

	it('causes no errors if multiple automatic removal options are used and triggered', inject(function ($rootScope) {
		var called = 0;
		var scope = $rootScope.$new();

		testObj1.addEventListener('mainEvent', function () { called++; }, {
			'removeAfterFired': true, 'removeOnDestructionOf': scope
		});

		testObj1.emitEvent('mainEvent');

		expect(called).toEqual(1);

		// should have been removed
		testObj1.emitEvent('mainEvent');

		expect(called).toEqual(1);

		scope.$broadcast('$destroy');

		// should still be removed, and shouldn't throw or cause errors
		testObj1.emitEvent('mainEvent');

		expect(called).toEqual(1);
	}));

	// Emitting

	it('can emit an event that was declared when mixing in', function () {
		testObj1.emitEvent('mainEvent');
	});

	it('calls the registered callback for an event when it\'s emitted', function () {
		var called = false;
		testObj1.addEventListener('mainEvent', function () { called = true; });
		testObj1.emitEvent('mainEvent');
		expect(called).toEqual(true);
	});

	it('allows method chaining for all public event methods', function () {
		var accumulator1 = 0;
		var accumulator2 = 0;
		var fun1 = function () { accumulator1++; };
		var fun2 = function () { accumulator2++; };

		// Chain-it!
		testObj1
		.addEventListener('mainEvent', fun1)
		.addEventListener('mainEvent', fun2)
		.emitEvent('mainEvent')
		.emitEvent('mainEvent')
		.removeEventListener('mainEvent', fun1)
		.removeEventListener('mainEvent', fun2)
		.emitEvent('mainEvent');

		expect(accumulator1).toEqual(2);
		expect(accumulator2).toEqual(2);
	});

	it('calls the registered callbacks once for each event emit', function () {
		var called1 = 0;
		var called2 = 0;
		testObj1.addEventListener('mainEvent', function () { called1++; });
		testObj1.addEventListener('mainEvent', function () { called2++; });
		testObj1.emitEvent('mainEvent');
		expect(called1).toEqual(1);
		expect(called2).toEqual(1);
		testObj1.emitEvent('mainEvent');
		expect(called1).toEqual(2);
		expect(called2).toEqual(2);
	});

	// Removing

	it('does not call an event listener callback after it\'s removed', function () {
		var called = 0;
		var fun = function () { called++; };
		testObj1.addEventListener('mainEvent', fun);
		testObj1.emitEvent('mainEvent');
		expect(called).toEqual(1);

		testObj1.removeEventListener('mainEvent', fun);
		testObj1.emitEvent('mainEvent');
		expect(called).toEqual(1);
	});

	// TODO: test auto-remove of listener on scope $destroy


	// ==================
	// = Error Handling =
	// ==================

	it('throws an exception if not provided an array of events', inject(function (mixin) {
	  expect(function () {
			mixin.eventEmission({}, null);
		}).toThrow(new Error('eventNames must be an array of strings'));
	  expect(function () {
			mixin.eventEmission({}, {'string': 'value'});
		}).toThrow(new Error('eventNames must be an array of strings'));
	}));

	it('throws an exception if event names are not all strings', inject(function (mixin) {
	  expect(function () {
			mixin.eventEmission({}, ['string', {}]);
		}).toThrow(new Error('eventNames must be an array of strings'));
	}));

	it('throws an exception when no object is passed to mix-in to', inject(function (mixin) {
	  expect(function () {
			mixin.eventEmission(null, []);
		}).toThrow(new Error('targetObject must be an object to mix into'));
	}));

	it('won\'t overwrite already defined properties of an object when mixing in event emission',
			inject(function (mixin) {
		var obj = {};

		angular.forEach(['addEventListener', 'removeEventListener', 'emitEvent'], function (eventMethodName) {
			obj[eventMethodName] = function () {};

			expect(function () {
				mixin.eventEmission(obj, []);
			}).toThrow(new Error('Can\'t add event methods--they already exist!'));

			delete obj[eventMethodName];
		});

		expect(function () {
			mixin.eventEmission(obj, []);
		}).not.toThrow();
	}));
});