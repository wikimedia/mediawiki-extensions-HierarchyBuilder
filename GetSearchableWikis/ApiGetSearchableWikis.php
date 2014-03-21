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

class ApiGetSearchableWikis extends ApiBase {
	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );
	}
 
	public function execute() {
 		wfErrorLog("API called!\n", "/var/www/html/DEBUG_MultiWikiSearch.out");
		$json = file_get_contents("http://gestalt.mitre.org/.mediawiki/index.php?title=Special:Ask&q=[[Category:Gestalt_Communities]][[Gestalt_Community_Searchable::Yes]]&po=?Wiki_API_URL%0D%0A?Wiki_Content_URL%0D%0A?Small_Wiki_Logo&p[limit]=500&p[format]=json");
		$results = json_decode($json);
		wfErrorLog("file contains:\n$json\n", "/var/www/html/DEBUG_MultiWikiSearch.out");
		$this->getResult()->addValue(null, $this->getModuleName(), $results);

		return true;
	}
 
	public function getDescription() {
		return 'Get a list of Gestalt Community wikis which are searchable.';
	}
 
	public function getExamples() {
		return array(
			'api.php?action=getSearchableWikis&format=json'
		);
	}
 
	public function getHelpUrls() {
		return '';
	}
}