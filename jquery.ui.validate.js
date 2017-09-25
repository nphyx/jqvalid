/**
 * jquery.ui.validate.js
 *
 * @author Justen Robertson <justen@justenrobertson.com>
 * @version 1.0
 * @copyright 2011 Justen Robertson, some rights reserved.
 * @license GPL
 * A jQuery extension for easy form validation.
 * 
 * jQuery.ui.validate.validators holds a repository of validation objects, which
 * are registered via:
 *
 * jQuery.ui.validate.prototype.register(properties);
 *
 *
 * Basic Use
 *
 * jQuery('form').validate();
 *
 * The following options (listed with their defaults)
 * are available to the validate:
 *	checkSubmit: if true, the form will be validated before submitting (default true)
 *	parentSelector: if supplied, ui-state-error will be applied to this parent instead of the input (default false)
 *	text: display text as "tagname" or as "title" on icon (default "span")
 *	submitSuccess: if checkSubmit, submitSuccess will be called if the form is valid
 *	submitFailure: if checkSubmit, submitFailure will be called if the form is invalid
 *
 *
 * Apply classes to your form fields as you wish. A validation check gets run
 * each time a validate field is blurred (clicked away from), as well as when
 * the form is submitted.
 *
 * Current standard validation classes include:
 *
 * vaild-alphabetical: only letters
 * valid-alpha-spaces: only letters and spaces
 * valid-alpha-numeric: only letters and numbers
 * valid-alpha-num-spaces: only letters, numbers, and spaces
 * valid-verify-password: must be identical to the "validate-password" field
 * valid-integer: must be an integer (whole number) (note, does not validate byte size)
 * valid-float: must be a floating point (decimal) number (note, does not validate byte size)
 * valid-ip-address: must be a valid ip address format (does not do sanity checking)
 * valid-us-phone: must be a U.S. phone number, format (123) 456-7890
 * valid-street-address: tries to validate against all common street address formats (take it or leave it)
 * valid-us-currency: a dollar amount
 * valid-na-postal: valid U.S. / Canada postal code
 * valid-url: validates urls according to the official spec
 * valid-email-address: validates email addresses according to the official spec
 * valid-minimum: mjust meet a min char length according to a rel="minimum:x" attribute
 * valid-select-option: selected option must not have an empty value
 *
 *
 *
 *	To create your own validator, use:
 *
 *	var properties = {
 *		classname:, // the class name for a form field to bind to
 *		regexp:, // a regular expression string to validate for
 *		text:, // help text when the string is invalid
 *		callback:, // a callback function for additional logic
 *	}
 *
 *	jQuery.ui.validate.prototype.register(properties);
 *
 *	Or alternatively, on your already-initialized object,
 *
 *	jQuery(selector).validate("register", properties);
 *
 *	You must have either a regexp or a callback, but you need not supply both.
 *	The callback function accepts a reference to the field to be validated and
 *	returns a boolean - true if validation was successful, false if not.
 *
 *	Note in most circumstances you'll want to make your regexp pass on an empty
 *	field, so that you don't conflict with valid-required. The easiest way to
 *	do that is to surround it with a 0-1 quantified subpattern. For instance
 *
 *	^.*$
 *
 *	becomes
 *
 *	^(.*)?$
 *
 *	This allows your validator to operate as a non-required field while still
 *	strictly validating against your subpattern when there is content.
 *
 *	You can easily specify elements for the validator to skip using the
 *	validate-skip class. The purpose of this class is to allow you to toggle items
 *	on and off without togglign off their validation types (for instance if
 *	certain sections of your form may be hidden or irrelevant and don't always
 *	need to be validated).
 */

(function(jQuery) {
	var Validate = {
		options: {
			checkSubmit:true,
			parentSelector:false,
			text:"span",

			// callbacks for these two events because they want to be able to
			// interrupt the process before it completes
			submitSuccess:function(e){},
			submitFailure:function(e){}
		},




		submit:function(e) {
			var $valid = this;
			var $this = this.element;
			var items = $this.find('input, button');
			this.check(items);
			if ($this.find('.validate-invalid').size() > 0) {
				e.preventDefault();
				jQuery("<div><span class='ui-icon ui-icon-alert' style='float:left'>!</span>&nbsp;You have submitted invalid information! Please review the form and try again.</div>")
					.dialog({
						title:"Validation Error",
						minWidth:0,
						minHeight:0,
						modal:true,
						buttons: {
							"Ok": function() {jQuery(this).dialog("close"); $valid.options.submitFailure.apply(this, [e]);}
						}
					}).dialog("widget").find('.ui-widget-header').addClass('ui-state-error');
				return $this;
			}
			else {
				this.options.submitSuccess.apply(this, [e]);
				return $this;
			}
		},




		check:function(el) {
			var $valid = this;
			el.each(function() {
				var $this = jQuery(this);
				if($this.tagName == "input") switch($this.attr('type')) {
					// Don't validate hidden attributes
					case'hidden':
					// nothing to do on a button
					case 'button':
						return $this;
					break;
				}
				
				// first mark it clean, we want to do this in case all validation
				// classes were removed after the last time it was marked invalid
				$valid.markValid($this);

				for(var validator in $valid.validators) {
					if ($this.hasClass(validator) && !$this.hasClass('validate-skip')) {
						if(
								!$this.attr('value').match($valid.validators[validator].regexp)
								|| !$valid.validators[validator].callback($this)
							) {
							$valid.markInvalid($this, $valid.validators[validator].text);
							break;
						}
						else {
							$valid.markValid($this);
						}
					}
				}
				return $this;
			});
		},




		markInvalid:function(item, text) {
			// clean up old invalid markers
			this.markValid(item); 
			// we want to select all radio boxes by name, but otherwise just the one item
			$item = jQuery(item).attr('type')=="radio"?jQuery(this.element.selector+' input[type=radio][name="'+jQuery(item).attr('name')+'"]'):jQuery(item);
			jQuery($item.selector+" + span.validate-help-text").remove();
			if(this.options.text != "title") helpText = jQuery("<"+this.options.text+" class='validate-help-text'><span class='validate-help-icon ui-icon ui-icon-alert'>!</span>"+text+"</"+this.options.text+">");
			else helpText = jQuery("<span class='validate-help-icon ui-icon ui-icon-alert' title='"+text+"'>!</span>");
			$item.after(helpText);
			if(this.options.parentSelector) $item.closest(this.options.parentSelector).addClass('ui-state-error');
			$item.removeClass('validate-valid');
			$item.addClass('validate-invalid');
			$item.trigger('markInvalid');
			return this;
		},




		markValid:function(item) {
			// we want to select all radio boxes by name, but otherwise just the one item
			$item = jQuery(item).attr('type')=="radio"?jQuery(this.element.selector+' input[type=radio][name="'+jQuery(item).attr('name')+'"]'):jQuery(item);
			$item.removeClass('validate-invalid');
			if(this.options.parentSelector) $item.closest(this.options.parentSelector).removeClass('ui-state-error');
			$item.addClass('validate-valid');
			$item.next('span.validate-help-text, span.validate-help-icon').remove();
			$item.trigger('markValid');
			return this;
		},




		_init:function() {
			var $valid = this;
			$this = this;
			this.element.addClass('ui-validate');

			// radios & checkboxes don't blur
			var items = this.element.find('input[type=radio], input[type=checkbox]');
			items.unbind('change.validate');

			this.element.unbind('submit.validate');

			items = this.element.find('input, select');
			items.unbind('blur.validate');
			
			items.each(function() {
				$item = jQuery(this);
				switch($item.attr('type')) {
					// Don't validate hidden inputs (that could get hairy: how does the user fix the problem?)
					case 'hidden': 
					return; 
					break;
					// radios & checkboxes don't blur
					case 'radio':
					case 'checkbox':
						$item.bind('change.validate', function(){jQuery(this).closest('.ui-validate').validate('check', jQuery(this));});
					break;
					default:
						$item.bind('blur.validate', function(){jQuery(this).closest('.ui-validate').validate('check', jQuery(this));});
					break;
				}
			});
			
			if($valid.options.checkSubmit) {
				this.element.bind('submit.validate', function(e){jQuery(this).closest('.ui-validate').validate('submit', e);});
			}

			return this;
		},

		destroy: function() {
			this.element.removeClass('ui-validate');
			var items = this.element.find('input, select');
			items.unbind('blur.validate');
			// radios & checkboxes don't blur
			items = this.element.find('input[type=radio], input[type=checkbox]');

			items.unbind('change.validate');
			$this.element.unbind('submit.validate');
			jQuery.Widget.prototype.destroy.call( this );
		},




		// Public method to add a new validation class.
		register:function(validator) {
			if(!validator.classname) return this;

			validator = jQuery.extend({
				text:'Invalid Entry',
				regexp:/.*/,
				callback:function() {return true;}
			}, validator);
			var classname = validator.classname;
			jQuery.ui.validate.prototype.validators[classname] = validator;
			return this;
		},




		// Set up all the default validators on document load.
		// this will be filled with a bunch of validator objects, and may store
		// more attatched by the developer
		validators:{
		}
	}; // end Validate prototype



	jQuery.widget("ui.validate", Validate);



	jQuery.extend(jQuery.ui.validate, {
		version: '1.8'
	});




	// The following are preset validates. Hopefully they cover common needs,
	// but they can always be overridden or extended. Just make calls to
	// jQuery.ui.validate.prototype.register(properties) or
	// jQuery(myform).validate("register", properties) as necessary.

	jQuery.ui.validate.prototype.register({
		classname:"valid-required",
		text:"This field is required.",
		regexp: /.+/
	});

	jQuery.ui.validate.prototype.register({
		classname:"valid-alphabetical",
		text:	'Must contain only letters.',
		regexp:		/^([a-zA-Z]*)?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-alpha-spaces",
		text:'Must contain only letters and spaces.',
		regexp:  /^([a-zA-Z ]*)?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-alpha-numeric",
		text:"Must contain only letters and numbers.",
		regexp: /^([a-zA-Z0-9]*)?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-alpha-num-spaces",
		text:'Must contain only letters, numbers, and spaces.',
		regexp:/^([a-zA-Z0-9 ]*)?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-verify-password",
		text:'Passwords do not match!',
		callback:function(item){
			var value = jQuery(item).val();
			var selected = jQuery('form :has(input[name="'+item.attr('name')+'"])');
			var first = selected.has('.valid-password').find('input.valid-password').val();
			if (value != first) return false;
			else return true;
		}
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-integer",
		text:'Must contain only whole numbers.',
		regexp:/^([0-9]*)?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-float",
		text:'Must contain only numbers.',
		regexp:/^([0-9\.]*)?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-ip-address",
		text:'Please enter a valid IP address.',
		regexp:/^((\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3}))?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-us-phone",
		text:'Please enter a phone number in the format: (123) 456-7890.',
		regexp:/^((\+\d)*\s*(\(\d{3}\)\s*)*\d{3}(-{0,1}|\s{0,1})\d{2}(-{0,1}|\s{0,1})\d{2})?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-us-currency",
		text:'Please enter a valid dollar amount.',
		regexp:/^(\d+\.\d{2})?$/
	});




	// Checks that the selected option on a selction box is not empty.
	jQuery.ui.validate.prototype.register({
		classname:"valid-select-option",
		text:"Please make a valid selection.",
		callback:function(item){
			if(jQuery(item).children(":selected").val()=="") return false;
			return true;
		}
	});




	// Checks that at least one radio option from a radio list is selected.
	jQuery.ui.validate.prototype.register({
		classname:"valid-radio-selected",
		text:"Please make a valid selection.",
		callback:function(item){
			if(!jQuery('input[type=radio][name="'+jQuery(item).attr('name')+'"]:checked').val()) return false;
			return true;
		}
	});



	jQuery.ui.validate.prototype.register({
		classname:"valid-url",
		text:'Please enter a full, valid URL.',
		regexp:/^((http|https|ftp)\:\/\/([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|localhost|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(\/($|[a-zA-Z0-9\.\,\?\'\\\+&amp;%\$#\=~_\-]+))*)?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-street-address",
		text:'Please enter a valid street address.',
		regexp:/^([a-zA-Z\d]*(([\'\,\.\- #][a-zA-Z\d ])?[a-zA-Z\d]*[\.]*)*)?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-na-postal-code",
		text:'Please enter a valid US/Canada postal code.',
		regexp:/^(((\d{5}-\d{4})|(\d{5})|([AaBbCcEeGgHhJjKkLlMmNnPpRrSsTtVvXxYy]\d[A-Za-z]\s?\d[A-Za-z]\d)))?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-email-address",
		text:'Please enter a valid email address.',
		regexp:/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-verify-email",
		text:'Email address does not match!',
		callback:function(item){
			var value = jQuery(item).val();
			var selected = jQuery('form :has(input[name="'+item.attr('name')+'"])');
			var first = selected.has('.valid-email-address').find('input.valid-email-address').val();
			// don't complain yet if you don't have anything to compare to
			if (first.length && value != first) return false;
			else return true;
		}
	});




	jQuery.ui.validate.prototype.register({
		classname:"valid-compare-to",
		text:'Values do not match.',
		callback:function(item){
			var $item = jQuery(item);
			var other = jQuery.parseJSON($item.attr('rel')).el;
			var value = $item.val();
			var selected = jQuery('form :has(input[name="'+item.attr('name')+'"])');
			var first = jQuery(other).val();
			if (value != first) return false;
			else return true;
		}
	});




	// For minimum values, you'll need to set the rel attribute to include
	// "minimum:x" where x is the min value.
	jQuery.ui.validate.prototype.register({
		classname:"valid-minimum",
		text:'Minimum length not met.',
		callback:function(item){
			var val = item.attr('rel').match(/(?:minimum\:)[0-9]*/);
			if(item.val().length < val[1]) return false;
			return true;
		}
	});
})(jQuery);
