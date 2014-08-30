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
* include_once("$IP/extensions/VikiIWLinks/VikiIWLinks.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (!defined('VIKIJS_VERSION')) {
	die("<b>Error:</b> The extension VikiIWLinks requires VikiJS to be installed first. Be sure that VikiJS is included on a line ABOVE the line where you've included VikiIWLinks.");
}

if (version_compare($wgVersion, '1.22', 'lt')) {
	die('<b>Error:</b> This version of VikiIWLinks is only compatible with MediaWiki 1.22 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'VikiIWLinks',
	'version' => '1.0.3',
	'author' => 'Jason Ji',
	'descriptionmsg' => 'vikiiwlinks-desc'
);

$wgExtensionMessagesFiles['VikiIWLinks'] =
	__DIR__ . '/VikiIWLinks.i18n.php';

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
	$VikiJS_Function_Hooks['GetAllWikisHook'][] = 'VIKI.VikiIWLinks.viki_getAllWikisFromIWLinks';
else
	$VikiJS_Function_Hooks['GetAllWikisHook'] = array('VIKI.VikiIWLinks.viki_getAllWikisFromIWLinks');


$wgHooks['ParserFirstCallInit'][] = 'efVikiIWLinks_AddResource';
$wgHooks['LoadExtensionSchemaUpdates'][] = 'addVikiTablesToDatabase';

function efVikiIWLinks_AddResource (& $parser) {
	VikiJS::addResourceModule("ext.VikiIWLinks");
	VikiJS::addPHPHook("efVikiIWLinks_Setup", array($parser));
	return true;
}

function addVikiTablesToDatabase($updater) {
	wfErrorLog("addVikiTablesToDatabase called.\n", "/var/www/html/jyj_logs/DEBUG_VikiIWLinks.out");
	$updater->addExtensionField('interwiki', 'logo_url',
			__DIR__ . '/AddLogoURL.sql', true);
	$updater->addExtensionField('interwiki', 'viki_searchable',
			__DIR__ . '/AddVikiSearchable.sql', true);

	return true;
}

function efVikiIWLinks_Setup($params) {

	wfErrorLog("efVikiIWLinks_Setup called \n", "/var/www/html/jyj_logs/DEBUG_VikiIWLinks.out");

	// access database and get wikis from interwiki links table

	$dbr = wfGetDB( DB_SLAVE );
	$result = $dbr->select(
		'interwiki',
		array('iw_prefix', 'iw_url', 'iw_api', 'logo_url', 'viki_searchable', 'mgf_wiki', 'server'),
		'mgf_wiki = true'
	);
	wfErrorLog("database result:\n", "/var/www/html/jyj_logs/DEBUG_VikiIWLinks.out");


	// turn into JSON

	$databaseResults = array();

	foreach($result as $row) {
		wfErrorLog(print_r($row, true) . "\n", "/var/www/html/jyj_logs/DEBUG_VikiIWLinks.out");		

		$databaseResults[] = array(
			"wikiTitle" => $row->iw_prefix,
			"apiURL" => $row->iw_api,
			"contentURL" => $row->iw_url,
			"logoURL" => $row->logo_url,
			"searchableWiki" => ($row->viki_searchable == 1 ? "true" : "false"),
			"server" => $row->server
		);
	}

	wfErrorLog("wikiTestArray:\n", "/var/www/html/jyj_logs/DEBUG_VikiIWLinks.out");
	wfErrorLog(print_r($databaseResults, true) . "\n", "/var/www/html/jyj_logs/DEBUG_VikiIWLinks.out");

	$databaseResultsJSON = addslashes(json_encode($databaseResults));
	global $wgOut;

	$script = <<<END
mw.loader.using('ext.VikiIWLinks', function() {
	VIKI.VikiIWLinks.viki_parseWikiData("$databaseResultsJSON");	
});
END;

	$script = '<script type="text/javascript">' . $script . '</script>';
	$wgOut->addScript($script);
}
