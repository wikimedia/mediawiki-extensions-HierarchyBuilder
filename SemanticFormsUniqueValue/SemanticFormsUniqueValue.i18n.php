<?php

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

$messages['en'] = array(
	'sfuniquevalue-desc' =>
		'Enter a property value in a form with error checking to make sure ' .
		'it is unique on save',
	'sfuniquevalue-error-missingpropertyname' =>
		'<b>Missing property name argument</b>',
	'sfuniquevalue-param-propertyname-desc' =>
		'the name of the property that the value must be unique across',
	'sfuniquevalue-param-query-desc' =>
		'semantic query to limit the set of pages that the value must be unique across (optional)',
	'sfuniquevalue-param-disallowed-desc' =>
		'set of characters disallowed in the input',
	'sfuniquevalue-error-blank' => 'cannot be blank',
	'sfuniquevalue-error-duplicate' => 'duplicate value',
	'sfuniquevalue-error-disallowed' => 'cannot contain $1',
	'sfuniquevalueapi-param-propertyname-desc' =>
		'the name of the semantic property that the value must be unique ' .
		'across',
	'sfuniquevalueapi-param-value-desc' =>
		'the value to query for uniqueness',
	'sfuniquevalueapi-param-query-desc' =>
		'a query that is appended to the property portion of the query to ' .
		'limit the pages over which the property search is conducted with ' .
		'all square brackets ([]) replaced by parentheses (())',
	'sfuniquevalueapi-desc' =>
		'check a property value checking to make sure it is unique'
);
