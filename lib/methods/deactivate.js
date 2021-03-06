// Author: Branden Horiuchi <bhoriuchi@gmail.com>
// Description: deactivate method


module.exports = function(config) {
	
	// constants
	var _JTYP            = config.statics.jsTypes;
	var _FOPT            = config.statics.fetchOpts;
	var _STAT            = config.statics.httpStatus;
	var _ERR             = config.statics.errorCodes;
	
	// modules
	var _                = config.lodash;
	var Bookshelf        = config.bookshelf;
	var methodcore       = config.methodcore;
	var utils            = config.utils;
	var u                = utils.util;
	
	// return the function
	return function(idList, fetchOpts, jsonOpts) {

		var _self        = this;
		
		
		// check if model initialization is required
		if (!_self._var) {
			_self.results = null;
			_self._var    = {};
		}
		
		
		// runtime variables
		var models       = config.models(_self.version);
		var schema       = models._schema;
		
		// set defaults and variables
		var _op, err;
		
		
		// check arguments. if there is only 1 argument and
		// that argument is an object it should be interpreted
		// as the options, otherwise 
		if (idList && typeof(idList) === _JTYP.object && !Array.isArray(idList) && !fetchOpts) {
			fetchOpts   = idList;
			idList      = null;
		}
		
		// get the options
		fetchOpts         = fetchOpts || {};
		fetchOpts.force   = (fetchOpts.force === true) ? true : false;
		fetchOpts._reqPub = (fetchOpts._reqPub === true) ? true : false;
		
		// get the id list
		_self.results = u.resolveInput(idList, _self).then(function(results) {
			
			// throw an error if the results are an error
			if (u.isErr(results.results)) {
				throw results.results;
			}
			
			// check that the results are valid and throw an error if they are not
			if (!results.valid) {
				
				// create a new error
				err = u.newErr(
					_STAT.BAD_REQUEST.code,
					_ERR.INVALID_ID.message,
					_ERR.INVALID_ID.code,
					['Invalid or no id specified', 'thrown from deactivate']
				);
				
				// check if errors should be thrown. usually used for
				// a chained transaction
				if (_self._var.throwErrors) {
					throw err;
				}
				return u.wrapPromise(err);
			}
			
			
			// set up the publish options
			var opts = {
				ids: results.ids,
				fetchOpts: fetchOpts,
				_self: _self
			};
			
			
			// look for a transaction and use it or create a new one
			if (_.has(fetchOpts, _FOPT.transacting)) {
				_op = methodcore.activate(opts, false)(fetchOpts.transacting);
			}
			// check for existing transaction
			else if (_self._var.transaction) {
				_op = methodcore.activate(opts, false)(_self._var.transaction);
			}
			// otherwise create a new transaction
			else {
				_op = Bookshelf.transaction(methodcore.activate(opts, false));
			}
			
			// execute the operation and return the results
			return _op.then(function(results) {
				return results;
			});
		})
		// catch any errors and print an error message
		.caught(function(e) {
			
			// create a new error
			err = u.newErr(
				e.errno,
				'An error was thrown during the activate transaction',
				e.code,
				e.message,
				e.stack
			);
			
			// check if the error was thrown by factory or knex/bookshelf
			err = u.isErr(e) ? e : err;
			
			// check if errors should be thrown. usually used for
			// a chained transaction
			if (_self._var.throwErrors) {
				throw err;
			}
			return u.wrapPromise(err);
		});

		
		// update model properties and return the model
		_self._lastChain = {
			method: config.statics.methods.unpublish
		};
		return _self;
	};
};