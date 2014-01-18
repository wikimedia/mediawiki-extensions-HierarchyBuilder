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

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/LoginNoAutocomplete/LoginNoAutocomplete.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.20', 'lt')) {
	die('<b>Error:</b> This version of LoginNoAutocomplete is only compatible with MediaWiki 1.20 or above.');
}

# credits
$wgExtensionCredits['other'][] = array (
	'name' => 'LoginNoAutocomplete',
	'version' => '1.0',
	'author' => "Cindy Cicalese",
	'description' => 'Forces autocomplete off for login form'
);
 
$wgResourceModules['ext.LoginNoAutocomplete'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'LoginNoAutocomplete',
	'scripts' => 'LoginNoAutocomplete.js',
	'position' => 'top'
);

$wgHooks['ParserFirstCallInit'][] = 'efLoginNoAutocompleteSetup';

function efLoginNoAutocompleteSetup (& $parser) {
	global $wgHooks;
	$wgHooks['BeforePageDisplay'][] = 'LoginNoAutocomplete::setup';
	return true;
}

class LoginNoAutocomplete {
	static function setup(&$out, &$skin) {
		$out->addModules('ext.LoginNoAutocomplete');
		$script = '<script type="text/javascript">' . $script . "</script>";
		$out->addScript($script);
		return true;
	}
}