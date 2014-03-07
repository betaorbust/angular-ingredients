angular-ingredients
===================

A collection of reusable AngularJS modules. Initially developed at Udacity and maintained for the
larger Angular community.

### Requirements
The current libraries expect that the following are running within your project.
- [Angular](http://angularjs.org/) (duh)
- [jQuery](http://jquery.com/)
- [underscore](http://underscorejs.org/)

In the future, we'll be **removing our dependence on underscore**, but for code brevity and reading
ease, it is currently still used.

### Current Libraries
- Ingredients - the main collection of all libraries.
	- [validator](src/services/validator) - A service to validate form fields.
	- [facebook](src/services/facebook) - A service for both authenticating, and sharing on
		Facebook.
	- [google](src/services/google) - A service for authenticating via google.
	- [mixin](src/services/mixin) - A service for adding event mixins to arbitrary objects.
	- [callbackList](src/services/mixin) - A service for maintaining callback lists in Angular.


## Contributing

### Getting Set Up
Once you have the repo forked and cloned onto your local dev environment, you can run the following

* `npm install` - Install all dependencies.
* `npm run test` - Run all of the js tests we have.
* `npm run cleaninstall` - Delete all of the node_modules and reinstall dependencies cleanly.

### Additions

* All additions to the Angular Ingredients project should be well documented (using jsdoc or ngDoc)
and have 100% unit test coverage.
* Each service, directive, etc. should be placed in its own directory, and be accompanied by a
README file (Markdown formatted preferred)


### Bug Fixes

* If proposing a bug fix, please make sure that any added code is accompanied by tests that
maintain coverage and addresses whatever it is that your awesome bug fix fixes.

Thanks!
:heart: The Ingredients Team