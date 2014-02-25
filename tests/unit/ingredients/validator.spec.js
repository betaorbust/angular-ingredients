describe('The validator service',  function () {
	'use strict';
	beforeEach(function () {
		module('ingredients');
	});

	it('should initialize the validator with a non-false value', inject(
		function (validator) {
			expect(validator).toBeTruthy();
		}
	));

	it('should be able to check whether a required value is present', inject(
		function (validator) {
			var validDfn = {
				'test': {
					'value': '',
					'validators': [{'type': 'required'}]
				}
			};

			var validation = validator.check(validDfn);
			expect(validation.valid).toEqual(false);
			validDfn.test.value = 'nonempty';
			validation = validator.check(validDfn);
			expect(validation.valid).toEqual(true);
		}
	));

	it('should consider null as an empty value', inject(
		function (validator) {
			var validDfn = {
				'test': {
					'value': null,
					'validators': [{'type': 'required'}]
				}
			};

			var validation = validator.check(validDfn);
			expect(validation.valid).toEqual(false);
		}
	));

	it('should be able to check the validity of email', inject(
		function (validator) {
			var validDfn = {
				'test': {
					'value': 'non@empty',
					'validators': [{'type': 'email'}]
				}
			};
			var validation = validator.check(validDfn);
			expect(validation.valid).toEqual(false);
			validDfn.test.value = 'non@empty.com';
			validation = validator.check(validDfn);
			expect(validation.valid).toEqual(true);
		}
	));

	it('should be able to use javascript functions for validation', inject(
		function (validator) {
			var validDfn = {
				'test': {
					'value': 1,
					'validators': [{
						'type': 'javascript',
						'args': [function (val, arg) { return val+arg < 3; }, 2]
					}]
				}
			};
			var validation = validator.check(validDfn);
			expect(validation.valid).toEqual(false);
			validDfn.test.value = 0;
			validation = validator.check(validDfn);
			expect(validation.valid).toEqual(true);
		}
	));


	it('should be able to chain validations', inject(
		function (validator) {
			var validDfn = {
				'test': {
					'value': '',
					'validators': [{
						'type': 'required',
						'chained': [{'type': 'email'}]
					}]
				}
			};

			var validation = validator.check(validDfn);
			expect(validation.errorText.test).toEqual(['Test is required.']);
			validDfn.test.value = 'non@empty';
			validation = validator.check(validDfn);
			expect(validation.errorText.test).toEqual(['Test has to be a valid email address.']);
			validDfn.test.value = 'non@empty.com';
			validation = validator.check(validDfn);
			expect(validation.errorText.test).toEqual(undefined);
		}
	));
});
