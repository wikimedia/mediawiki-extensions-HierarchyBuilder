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

class ApiGetAllWikis extends ApiBase {
	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );
	}
 
	public function execute() {
 	// 	wfErrorLog("API called!\n", "/var/www/html/DEBUG_MultiWikiSearch.out");
		// $json = file_get_contents("http://gestalt.mitre.org/gestalt/index.php?title=Special:Ask&q=[[Category:Gestalt_Communities]]&po=?Wiki_API_URL%0D%0A?Wiki_Content_URL%0D%0A?Small_Wiki_Logo%0D%0A?Gestalt_Community_Searchable&p[limit]=500&p[format]=json");
		// $results = json_decode($json);
		// wfErrorLog("file contains:\n$json\n", "/var/www/html/DEBUG_MultiWikiSearch.out");
		// $this->getResult()->addValue(null, $this->getModuleName(), $results);

		// access database and get wikis from shared interwiki table

		$dbr = wfGetDB( DB_SLAVE );
		$result = $dbr->select(
			'interwiki',
			array('iw_prefix', 'mgf_title', 'iw_url', 'iw_api', 'logo_url', 'viki_searchable', 'mgf_wiki', 'server'),
			'mgf_wiki = true',
			__METHOD__,
			array('ORDER BY' => 'server ASC, mgf_title ASC')
		);

		$databaseResults = array();

		foreach($result as $row) {
			$wikiTitle = $row->mgf_title;
			$server = $row->server;
			if(!($server == "gestalt" || $server == "gestalt-m" || $server == "gestalt-cts"))
				$wikiTitle = $wikiTitle . " (" . $server . ")";

			$databaseResults[] = array(
				"iw_prefix" => $row->iw_prefix,
				"wikiName" => $wikiTitle,
				"apiURL" => $row->iw_api,
				"contentURL" => $row->iw_url,
				"logoURL" => $row->logo_url,
				"searchableWiki" => $row->viki_searchable,
				"server" => $server,
				"mgf_wiki" => $row->mgf_wiki
			);
		}

		$this->getResult()->addValue(null, $this->getModuleName(), $databaseResults);

		return true;
	}
 
	public function getDescription() {
		return 'Get a list of Gestalt Community wikis which are searchable.

Note that because the returned value is a JSON object, you must specify format=json in this query; the default xml format will return only an error.';
	}
 
	public function getExamples() {
		return array(
			'api.php?action=getAllWikis&format=json'
		);
	}
 
	public function getHelpUrls() {
		return '';
	}
}
