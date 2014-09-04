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

class SpecialMGFWikiBrowser extends SpecialPage {
	function __construct() {
		parent::__construct('MGFWikiBrowser');
	}
	function execute($par) {
		$request = $this->getRequest();
		$output = $this->getOutput();
		$this->setHeaders();

	// access database and get wikis from shared interwiki table

		$dbr = wfGetDB( DB_SLAVE );
		$result = $dbr->select(
			'interwiki',
			array('iw_prefix', 'iw_url', 'iw_api', 'logo_url', 'viki_searchable', 'mgf_wiki', 'server'),
			'mgf_wiki = true'
		);

		$databaseResults = array();

		foreach($result as $row) {
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

		$wikitext =<<<END
{| class="wikitable sortable" border="1"
|+ Shared Interwiki Table
|-
! scope="col" | Wiki Title
! scope="col" | Server
! scope="col" | Content URL
! scope="col" | API URL
! scope="col" | Logo
! scope="col" | VIKI Searchable

END;

		foreach($databaseResults as $wiki) {
			$wikitext .= "|-\n|";
			$wikitext .= $wiki["wikiTitle"];
			$wikitext .= " || ";
			$wikitext .= $wiki["server"];
			$wikitext .= " || ";
			$wikitext .= $wiki["contentURL"];
			$wikitext .= " || ";
			$wikitext .= $wiki["apiURL"];
			$wikitext .= " || ";
			$wikitext .= $wiki["logoURL"];
			$wikitext .= " || ";
			$wikitext .= ($wiki["searchableWiki"] == 1 ? "YES" : "NO");
			$wikitext .= "\n";
		}

		$wikitext .= "|}";
		$output->addWikitext($wikitext);

	}
}