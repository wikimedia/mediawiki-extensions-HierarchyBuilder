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
* include_once("$IP/extensions/VikiSemanticTitle/VikiSemanticTitle.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of VikiSemanticTitle is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'VikiSemanticTitle',
	'version' => '1.0',
	'author' => 'Jason Ji'
);

$wgResourceModules['ext.VikiSemanticTitle'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'VikiSemanticTitle',
	'scripts' => array(
		'VikiSemanticTitle.js'
	)
);

global $VikiJS_Function_Hooks;

if(!isset($VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks = array();

if(array_key_exists('ExternalNodeHook', $VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks['ExternalNodeHook'][] = 'VIKI.VikiSemanticTitle.checkForSemanticTitle';
else
	$VikiJS_Function_Hooks['ExternalNodeHook'] = array('VIKI.VikiSemanticTitle.checkForSemanticTitle');

if(array_key_exists('IntraInNodeHook', $VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks['IntraInNodeHook'][] = 'VIKI.VikiSemanticTitle.checkForSemanticTitle';
else
	$VikiJS_Function_Hooks['IntraInNodeHook'] = array('VIKI.VikiSemanticTitle.checkForSemanticTitle');

if(array_key_exists('IntraOutNodeHook', $VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks['IntraOutNodeHook'][] = 'VIKI.VikiSemanticTitle.checkForSemanticTitle';
else
	$VikiJS_Function_Hooks['IntraOutNodeHook'] = array('VIKI.VikiSemanticTitle.checkForSemanticTitle');

$wgHooks['ParserFirstCallInit'][] = 'efVikiSemanticTitle_AddResource';

function efVikiSemanticTitle_AddResource (& $parser) {
	VikiJS::addResourceModule("ext.VikiSemanticTitle");
	VikiJS::addPHPHook("efVikiSemanticTitle_Setup");
	return true;
}

function efVikiSemanticTitle_Setup($parser, &$text) {

	wfErrorLog("efVikiSemanticTitle_Setup called \n", "/var/www/html/DEBUG_VikiSemanticTitle.out");

	// // access database and get wikis from interwiki links table

	// $dbr = wfGetDB( DB_SLAVE );
	// $result = $dbr->select(
	// 	'interwiki',
	// 	array('iw_prefix', 'iw_url', 'iw_api', 'logo_url', 'viki_searchable'),
	// 	'viki_searchable = true OR viki_searchable = false'
	// );
	// wfErrorLog("database result:\n", "var/www/html/DEBUG_VikiSemanticTitle.out");


	// // turn into JSON

	// $wikiTestArray = array();

	// foreach($result as $row) {
	// 	wfErrorLog(print_r($row, true) . "\n", "/var/www/html/DEBUG_VikiSemanticTitle.out");		

	// 	$wikiTestArray[] = array(
	// 		"wikiTitle" => $row->iw_prefix,
	// 		"apiURL" => $row->iw_api,
	// 		"contentURL" => $row->iw_url,
	// 		"logoURL" => $row->logo_url,
	// 		"searchableWiki" => ($row->viki_searchable == 1 ? "true" : "false")
	// 	);
	// }

	// wfErrorLog("wikiTestArray:\n", "/var/www/html/DEBUG_VikiSemanticTitle.out");
	// wfErrorLog(print_r($wikiTestArray, true) . "\n", "/var/www/html/DEBUG_VikiSemanticTitle.out");

	// $wikiTestArrayJSON = addslashes(json_encode($wikiTestArray));

	$semanticTitles = addslashes(json_encode($wgSemanticTitles));

	global $wgOut;

	$script = <<<END
mw.loader.using('ext.VikiSemanticTitle', function() {
	VIKI.VikiSemanticTitle.storeSemanticTitles("$wgSemanticTitles");	
});
END;

	$script = '<script type="text/javascript">' . $script . '</script>';
	$wgOut->addScript($script);
}
