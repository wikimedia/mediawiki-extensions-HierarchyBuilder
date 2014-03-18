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
* include_once("$IP/extensions/MITRE_VIKI/MITRE_VIKI.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of MITRE_VIKI is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'MITRE_VIKI',
	'version' => '0.1',
	'author' => 'Jason Ji'
);

$wgResourceModules['ext.MITRE_VIKI'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'MITRE_VIKI',
	'scripts' => array(
		'MITRE_VIKI.js'
	)
);

global $VikiJS_Function_Hooks;

$VikiJS_Function_Hooks = array();
$VikiJS_Function_Hooks['GetSearchableWikisHook'] = array('mitre_getSearchableWikis');

$wgHooks['ParserFirstCallInit'][] = 'efMITRE_VIKI_Setup';

function efMITRE_VIKI_Setup (& $parser) {

	VikiJS::addResourceModule("ext.MITRE_VIKI");
	return true;

}
