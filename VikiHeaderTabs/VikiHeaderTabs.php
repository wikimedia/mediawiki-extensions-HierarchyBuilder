<?php
/*
 * Copyright (c) 2014 The MITRE Corporation
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
* include_once("$IP/extensions/VikiHeaderTabs/VikiHeaderTabs.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (!defined('VIKIJS_VERSION')) {
	die("<b>Error:</b> The extension VikiHeaderTabs requires VikiJS to be installed first. Be sure that VikiJS is included on a line ABOVE the line where you've included VikiHeaderTabs.");
}

if (version_compare($wgVersion, '1.22', 'lt')) {
	die('<b>Error:</b> This version of VikiHeaderTabs is only compatible with MediaWiki 1.22 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'VikiHeaderTabs',
	'version' => '1.0',
	'author' => 'Jason Ji',
	'descriptionmsg' => 'vikiheadertabs-desc'
);

$wgExtensionMessagesFiles['VikiHeaderTabs'] =
	__DIR__ . '/VikiHeaderTabs.i18n.php';

$wgResourceModules['ext.VikiHeaderTabs'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'VikiHeaderTabs',
	'scripts' => array(
		'VikiHeaderTabs.js'
	)
);

global $VikiJS_Function_Hooks;

if(!isset($VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks = array();

if(array_key_exists('InitializationCompleteHook', $VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks['InitializationCompleteHook'][] = 'VIKI.VikiHeaderTabs.setupHeaderTabsListener';
else
	$VikiJS_Function_Hooks['InitializationCompleteHook'] = array('VIKI.VikiHeaderTabs.setupHeaderTabsListener');


$wgHooks['ParserFirstCallInit'][] = 'efVikiHeaderTabs_AddResource';

function efVikiHeaderTabs_AddResource (& $parser) {
	VikiJS::addResourceModule("ext.VikiHeaderTabs");
	return true;
}