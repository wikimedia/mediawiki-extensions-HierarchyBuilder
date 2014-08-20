<?php
class IWAPI extends ApiBase {
    public function execute() {
        // Get specific parameters
        // Using ApiMain::getVal makes a record of the fact that we've
        // used all the allowed parameters. Not doing this would add a
        // warning ("Unrecognized parameter") to the returned data.
        // If the warning doesn't bother you, you can use 
        // $params = $this->extractRequestParams();
        // to get all parameters as an associative array (e. g. $params[ 'face' ])


	$dbr = wfGetDB( DB_SLAVE );
	$result = $dbr->select(
		'interwiki',
		array('iw_prefix', 'iw_url', 'iw_api', 'logo_url', 'viki_searchable'),
		'viki_searchable = true OR viki_searchable = false'
	);
	wfErrorLog("database result:\n", "var/www/html/DEBUG_VikiIWLinks.out");


	// turn into JSON

	$wikiTestArray = array();

	foreach($result as $row) {
		wfErrorLog(print_r($row, true) . "\n", "/var/www/html/DEBUG_VikiIWLinks.out");		

		$wikiTestArray[] = array(
			"wikiTitle" => $row->iw_prefix,
			"apiURL" => $row->iw_api,
			"contentURL" => $row->iw_url,
			"logoURL" => $row->logo_url,
			"searchableWiki" => ($row->viki_searchable == 1 ? "true" : "false")
		);
	}

        // Top level
        $this->getResult()->addValue( null, $this->getModuleName(), array ( 'wikiIWArray' => $wikiTestArray ) );


       return true;
    }
 }
