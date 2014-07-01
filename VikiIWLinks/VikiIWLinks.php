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
* include_once("$IP/extensions/VikiIWLinks/VikiIWLinks.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of VikiIWLinks is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'VikiIWLinks',
	'version' => '0.1',
	'author' => 'Jason Ji'
);

$wgResourceModules['ext.VikiIWLinks'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'VikiIWLinks',
	'scripts' => array(
		'VikiIWLinks.js'
	)
);

global $VikiJS_Function_Hooks;

if(!isset($VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks = array();

if(array_key_exists('GetAllWikisHook', $VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks['GetAllWikisHook'][] = 'viki_getAllWikisFromIWLinks';
else
	$VikiJS_Function_Hooks['GetAllWikisHook'] = array('viki_getAllWikisFromIWLinks');


$wgHooks['ParserFirstCallInit'][] = 'efVikiIWLinks_AddResource';
$wgHooks['LoadExtensionSchemaUpdates'][] = 'addVikiTablesToDatabase';

function efVikiIWLinks_AddResource (& $parser) {
	VikiJS::addResourceModule("ext.VikiIWLinks");
	VikiJS::addPHPHook("efVikiIWLinks_Setup");
	return true;

}

function addVikiTablesToDatabase($updater) {
	wfErrorLog("addVikiTablesToDatabase called.\n", "/var/www/html/DEBUG_VikiIWLinks.out");
	$updater->addExtensionField('interwiki', 'logo_url',
			__DIR__ . '/AddLogoURL.sql');
	$updater->addExtensionField('interwiki', 'viki_searchable',
			__DIR__ . '/AddVikiSearchable.sql');
	return true;
}

function efVikiIWLinks_Setup($parser, &$text) {

	wfErrorLog("efVikiIWLinks_Setup called \n", "/var/www/html/DEBUG_VikiIWLinks.out");

	// access database and get wikis from interwiki links table

	// $dbr = wfGetDB( DB_SLAVE );
	// $result = $dbr->select(
	// 	'interwiki',
	// 	array('iw_prefix', 'iw_url', 'iw_api', 'logo_url', 'viki_searchable')

	// );
	// wfErrorLog("database result:\n", "var/www/html/DEBUG_VikiIWLinks.out");
	// wfErrorLog(print_r($result, true) . "\n", "/var/www/html/DEBUG_VikiIWLinks.out");
	// foreach($result as $row) {
	// 	// wfErrorLog(print_r($row, true) . "\n", "/var/www/html/DEBUG_VikiIWLinks.out");		
	// 	// wfErrorLog("iw_prefix: " . $row->iw_prefix . ", iw_url: " . $row->iw_url ."\n", "/var/www/html/DEBUG_VikiIWLinks.out");
	// }


	// turn into JSON


	$wikiTestArray = array(
		array(
			"wikiTitle" => "mobilepedia", 
			"apiURL" => "http://gestalt.mitre.org/mobilepedia/api.php", 
			"contentURL" => "http://gestalt.mitre.org/mobilepedia/index.php/", 
			"logoURL" => "http://gestalt.mitre.org/mobilepedia/branding/logo_small.png",
			"searchableWiki" => "true"
			),
		array(
			"wikiTitle" => "gestaltd", 
			"apiURL" => "http://gestalt.mitre.org/gestaltd/api.php", 
			"contentURL" => "http://gestalt.mitre.org/gestaltd/index.php/", 
			"logoURL" => "http://gestalt.mitre.org/gestaltd/branding/logo_small.png",
			"searchableWiki" => "true"
			)
	);

	$wikiTestArrayJSON = addslashes(json_encode($wikiTestArray));
	global $wgOut;

	$script = <<<END
mw.loader.using('ext.VikiIWLinks', function() {
	vikiIWLinks_parseWikiData("$wikiTestArrayJSON");	
});
END;

	$script = '<script type="text/javascript">' . $script . '</script>';
	$wgOut->addScript($script);
}
