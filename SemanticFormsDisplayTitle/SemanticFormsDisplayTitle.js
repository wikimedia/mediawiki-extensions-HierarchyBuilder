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

window.SemanticFormsDisplayTitle_init = function (input_id, params) {
	if (params.is_mandatory) {
		jQuery('#' + input_id).SemanticForms_registerInputValidation(
			sfdisplaytitle_validate,
			params
		);
	}

	var qlfield = jQuery("#ql_" + input_id);
	qlfield.change(function () {
		var str = "";
		jQuery("#ql_" + input_id + " option:selected").each(function () {
			if (this.value.length > 0) {
				if (str.length == 0) {
					str += this.value;
				} else {
					str += params.sep + this.value;
				}
			}
		});
		var inputfield = jQuery('#' + input_id);
		inputfield.val(str);
	});

	qlfield.change();
}

window.sfdisplaytitle_validate = function(field_id, params) {
	var field = jQuery('#' + field_id);
	var field_val = field.val();
	if (field_val.replace(/\s+/, '') == '') {
			field.parent().addErrorMessage(
				mw.message('sfdisplaytitle-error-blank').text());
		return false;
	}
	return true;
}
