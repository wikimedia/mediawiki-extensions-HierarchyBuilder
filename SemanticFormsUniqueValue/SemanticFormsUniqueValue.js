/*
 * Copyright (c) 2013 The MITRE Corporation
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

window.SemanticFormsUniqueValue_init = function (input_id, params) {
	jQuery('#' + input_id).SemanticForms_registerInputValidation(
		sfuniquevalue_validate,
		params
	);
}

window.sfuniquevalue_validate = function(field_id, params) {
	var field = jQuery('#' + field_id);
	var field_val = field.val();
	if (field_val.replace(/\s+/, '') == '') {
			field.parent().addErrorMessage(
				mw.message('sfuniquevalue-error-blank').text());
		return false;
	} else if (field_val != params.current_value) {
		var ret = sfuniquevalue_countPropertyValueInstances(
			params.property_name, field_val, params.query, params.api_url);
		if (ret != 0) {
			field.parent().addErrorMessage(
				mw.message('sfuniquevalue-error-duplicate').text());
			return false;
		}
		if (sfuniquevalue_containsDisallowed(field_val, params.disallowed)) {
			field.parent().addErrorMessage(
				mw.message('sfuniquevalue-error-disallowed',
				params.disallowed).text());
			return false;
		}
	}
	return true;
}

window.sfuniquevalue_countPropertyValueInstances = function(property_name,
	value, query, api_url) {
	var ret = "";
	jQuery.ajax({
		 type: "POST",
		 url: api_url,
		 async: false,
		 data:	{
			 action: "uniquevalue",
			 format: "json",
			 PropertyName: property_name,
			 Value: value,
			 Query: query
		 },
		 dataType: "json",
		 success: function(data)	{
			 ret = data.uniquevalue;
		 }
	});
	return ret;
}

window.sfuniquevalue_containsDisallowed = function(s, disallowed) {
	if (disallowed.length == 0) {
		return false;
	}
	var disallowedChars = disallowed.split("");
	for (i = 0; i < disallowedChars.length; i++) {
		if (s.indexOf(disallowedChars[i]) != -1) {
			return true;
		}
	}
	return false;
}
