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

$messages = array();

$messages['en'] = array(
	'hierarchybuilder-desc' => 'Renders and allows editing of and selection from page hierarchies',
	'hierarchybuilder-editmessage' =>
'<p>The left-hand list contains the hierarchy that will be preserved when' .
' you save. The right-hand list contains pages in category $1' .
' that are not currently in the hierarchy. You may rearrange the left-hand' .
' list by dragging rows up and down as well as changing their indentation.' .
' You may add pages from the right-hand list to the hierarchy by dragging' .
' and dropping them where you want them in the left-hand list. You may' .
' remove pages from the hierarchy by dragging them from the left-hand list' .
' and dropping them anywhere in the right-hand list.</p>',
	'hierarchybuilder-hierarchyroot' => 'Hierarchy Root',
	'hierarchybuilder-unusedpages' => 'Unused Pages',
	'hierarchybuilder-category-desc' =>
		'category that pages in the hierarchy must belong to',
	'hierarchybuilder-missing-category' =>
		'Missing category argument',
	'hierarchybuilder-displaynameproperty-desc' =>
		'property that contains the value that should be displayed instead of the page name (optional)',
	'hierarchybuilder-pagename-desc' =>
		'page containing the hierarchy',
	'hierarchybuilder-propertyname-desc' =>
		'property containing the hierarchy',
	'hierarchybuilder-collapsed-desc' =>
		'hierarchy should be rendered collapsed when first displayed',
	'hierarchybuilder-missing-page-name' =>
		'Missing page name argument',
	'hierarchybuilder-missing-property-name' =>
		'Missing property name argument',
	'hierarchybuilder-invalid-collapsed' =>
		'Invalid value for collapsed argument'
);

$messages['qqq'] = array(
	'hierarchybuilder-desc' => '{{desc|name=Hierarchy Builder|' .
'url=http://www.mediawiki.org/wiki/Extension/Hierarchy_Builder}}',
	'hierarchybuilder-editmessage' =>
		'Message to be displayed above hierarchy (edit form)',
	'hierarchybuilder-hierarchyroot' =>
		'Text to be displayed as root node of hierarchy (edit form)',
	'hierarchybuilder-unusedpages' =>
		'Text to be displayed as root node of unused page hierarchy (edit form)',
	'hierarchybuilder-category-desc' =>
		'Semantic Form category property description (edit form)',
	'hierarchybuilder-missing-category' =>
		'Semantic Form missing category warning (edit form)',
	'hierarchybuilder-displaynameproperty-desc' =>
		'Semantic Form displaynameproperty property description (edit/select form)',
	'hierarchybuilder-pagename-desc' =>
		'Semantic Form pagename property description (select form)',
	'hierarchybuilder-propertyname-desc' =>
		'Semantic Form propertyname property description (select form)',
	'hierarchybuilder-collapsed-desc' =>
		'Semantic Form collapsed property description (select form)',
	'hierarchybuilder-missing-page-name' =>
		'Semantic Form missing page name warning (select form)',
	'hierarchybuilder-missing-property-name' =>
		'Semantic Form missing property name warning (select form)',
	'hierarchybuilder-invalid-collapsed' =>
		'Semantic Form invalid value for collapsed warning (select form)'
);
