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
* include_once("$IP/extensions/MGFWikiBrowser/MGFWikiBrowser.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of MGFWikiBrowser is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits[ 'specialpage' ][] = array(
	'name' => 'MGFWikiBrowser',
	'version' => '1.0',
	'author' => 'Jason Ji',
	'descriptionmsg' => 'mgfwikibrowser-desc'
);

$wgSpecialPages['MGFWikiBrowser'] = 'SpecialMGFWikiBrowser';
$wgSpecialPagesGroups['MGFWikiBrowser'] = 'other';
$wgExtensionMessagesFiles['MGFWikiBrowser'] = __DIR__ . '/MGFWikiBrowser.i18n.php';

$wgResourceModules['ext.MGFWikiBrowser'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'MGFWikiBrowser',
	'styles' => array(
		'MGFWikiBrowser.css'
	),
	'scripts' => array(
		'MGFWikiBrowser.js'
	)
);

class SpecialMGFWikiBrowser extends SpecialPage {
	function __construct() {
		parent::__construct('MGFWikiBrowser');
	}
	function execute($par) {
		$request = $this->getRequest();
		$output = $this->getOutput();
		$this->setHeaders();

		$output->addModules('ext.MGFWikiBrowser');

	// access database and get wikis from interwiki links table

		$dbr = wfGetDB( DB_SLAVE );
		$result = $dbr->select(
			'interwiki',
			array('iw_prefix', 'iw_url', 'iw_api', 'logo_url', 'viki_searchable', 'mgf_wiki', 'server'),
			'mgf_wiki = true'
		);
		wfErrorLog("database result:\n", "/var/www/html/jyj_logs/DEBUG_MGFWikiBrowser.out");


		// turn into JSON

		$databaseResults = array();

		foreach($result as $row) {
			wfErrorLog(print_r($row, true) . "\n", "/var/www/html/jyj_logs/DEBUG_MGFWikiBrowser.out");		

			$databaseResults[] = array(
				"wikiTitle" => $row->iw_prefix,
				"apiURL" => $row->iw_api,
				"contentURL" => $row->iw_url,
				"logoURL" => $row->logo_url,
				"searchableWiki" => $row->viki_searchable,
				"server" => $row->server,
				"mgf_wiki" => $row->mgf_wiki
			);
		}

		wfErrorLog("databaseResults:\n", "/var/www/html/jyj_logs/DEBUG_MGFWikiBrowser.out");
		wfErrorLog(print_r($databaseResults, true) . "\n", "/var/www/html/jyj_logs/DEBUG_MGFWikiBrowser.out");

		$databaseResultsJSON = addslashes(json_encode($databaseResults));
		global $wgOut;

		$output->addHTML("<div id='MGFWikiBrowser'></div>");

		$script=<<<END
mw.loader.using(['ext.MGFWikiBrowser'], function() {
	MGFWikiBrowser.initWithWikiData("$databaseResultsJSON");

});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";
		$output->addScript($script);

	}
}