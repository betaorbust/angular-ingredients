Validator
===================

A validation service that offers a generic and extensible way to check forms.

Example
------------------

- The field first_name is required 
- The field password is required, and if that passes, it should be checked if it is between 6 and 20 characters.
- testName and testPass are in the current scope and are the values of the form elements 'first_name' and 'password'.

<pre>
var validTest = {
    'first_name': {
        'pretty': 'first name',
        'value': testName,
        'validators': [
            {
                'type': 'required',
                'failMsg': 'your first name was a complete failure'
            }
        ]
    },
    'password': {
        'pretty': 'password',
        'value': testPass,
        'validators': [
            {
                'type': 'required',
                'chained':[{
                    'type': 'strLen',
                    'args': [6, 20],
                }]
            },
        ]
    }
};
</pre>

To use this test, you would inject the validator service into your scope, build the validTest object (above) and issue the following:

<pre>
var retVal = validator.check(validTest);
</pre>

What would come back if everything failed. Note the chained validator on password's 'require' validator was not checked because 'require' failed.
<pre>
{
    'valid': false,
    'errorText': {
        'first_name': ['first name is required.', 'your first name was a complete failure.'],
        'password': ['password is required.]
    }
};
</pre>

What would come back if everything passed.

<pre>
{'valid': true, 'errorTest':[]}
</pre>


In essence, you would end up injecting 'validator' into your controller, service, directive,
etc. and define what your form should validate to, bind your data in (in the above example this would
be the testName and testPass variables) and then call validator.check(validTest) where validTest
is a validationCollection object.

See documentation within the file for more info.