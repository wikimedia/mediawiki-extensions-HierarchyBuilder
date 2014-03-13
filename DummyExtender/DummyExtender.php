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
* include_once("$IP/extensions/DummyExtender/DummyExtender.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of DummyBase is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'DummyExtender',
	'version' => '0.1',
	'author' => 'Jason Ji'
);

$wgResourceModules['ext.DummyExtender'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'DummyExtender',
	'scripts' => array(
		'DummyExtenderScripts.js'
	)
);

global $DummyBase_Function_Hooks;

$DummyBase_Function_Hooks = array();
$DummyBase_Function_Hooks['Location 1'] = array('function1', 'function2');
$DummyBase_Function_Hooks['Location 2'] = array('function3', 'function4');

$wgHooks['ParserFirstCallInit'][] = 'efDummyExtenderParserFunction_Setup';

function efDummyExtenderParserFunction_Setup (& $parser) {

	DummyBase::addResourceModule("ext.DummyExtender");
	return true;

}
