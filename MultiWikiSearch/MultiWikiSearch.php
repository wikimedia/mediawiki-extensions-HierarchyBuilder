<?php
/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/MultiWikiSearch/MultiWikiSearch.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of Collection is only compatible with MediaWiki 1.21 or above.');
}

if(!defined('GET_ALL_WIKIS_VERSION')) {
	die('<b>Error:</b> This extension requires the extension GetAllWikis to be included first.');
}

$wgExtensionCredits[ 'specialpage' ][] = array(
	'name' => 'MultiWikiSearch',
	'version' => '1.2',
	'author' => 'Jason Ji',
	'descriptionmsg' => 'multiwikisearch-desc'
);

$wgSpecialPages['MultiWikiSearch'] = 'SpecialMultiWikiSearch';
$wgSpecialPagesGroups['MultiWikiSearch'] = 'other';
$wgExtensionMessagesFiles['MultiWikiSearch'] = __DIR__ . '/MultiWikiSearch.i18n.php';

$wgResourceModules['ext.MultiWikiSearch'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'MultiWikiSearch',
	'styles' => array(
		'MultiWikiSearch.css'
	),
	'scripts' => array(
		'MultiWikiSearch.js'
	)
);

$wgAPIModules['compareDifferentWikiPages'] = 'ApiCompareDifferentWikiPages';

class SpecialMultiWikiSearch extends SpecialPage {
	function __construct() {
		parent::__construct('MultiWikiSearch');
	}
	function execute($par) {
		$request = $this->getRequest();
		$output = $this->getOutput();
		$this->setHeaders();

		$output->addModules('ext.MultiWikiSearch');

		global $wgServer, $wgScriptPath;
		$apiurl = $wgServer . $wgScriptPath . "/api.php";

		$script=<<<END
mw.loader.using(['jquery.ui.progressbar', 'ext.MultiWikiSearch'], function() {

	$(document).ready(function() {
		var g = new MultiWikiSearch("diff", "$apiurl");
		g.initializeMWS("#mw-content-text");
	});
});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";
		$output->addScript($script);

	}
}

class ApiCompareDifferentWikiPages extends ApiBase {
	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );
	}
 
	public function execute() {
 		wfErrorLog("API compare different wikis called!\n", "/var/www/html/DEBUG_MultiWikiSearch.out");
		$url1 = $this->getMain()->getVal('url1');
		$url2 = $this->getMain()->getVal('url2');
		wfErrorLog("URL1: $url1\n", "/var/www/html/DEBUG_MultiWikiSearch.out");
		wfErrorLog("URL2: $url2\n", "/var/www/html/DEBUG_MultiWikiSearch.out");

		$text1 = file_get_contents(urldecode($url1));
		$text2 = file_get_contents(urldecode($url2));

		wfErrorLog("URL1's wikitext:\n$text1\n", "/var/www/html/DEBUG_MultiWikiSearch.out");
		wfErrorLog("URL2's wikitext:\n$text2\n", "/var/www/html/DEBUG_MultiWikiSearch.out");

		$engine = new DifferenceEngine;
		$diff = $engine->generateTextDiffBody($text1, $text2);

		wfErrorLog("Here is the diff:\n$diff\n", "/var/www/html/DEBUG_MultiWikiSearch.out");

		

		$this->getResult()->addValue(null, $this->getModuleName(), 
			array('URL1' => $url1,
				'URL2' => $url2,
				'diff' => $diff));

		return true;
	}
 
	public function getDescription() {
		return 'Similar to action=compare, but allows you to get the diff between two wiki pages on different wikis.';
	}
 
	public function getAllowedParams() {
		return array(
			'url1' => array(
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true
			),
			'url2' => array(
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true
			)
		);
	}

	public function getParamDescription() {
		return array(
			'url1' => 'encoded URL to the raw wikitext of the first page. Most likely of the form index.php?action=raw&title=<title>',
			'url2' => 'encoded URL to the raw wikitext of the second page. Most likely of the form index.php?action=raw&title=<title>'
		);
	}

	public function getExamples() {
		return array(
			'api.php?action=compareDifferentWikiPages&url1=http%3A%2F%2Frobopedia.mitre.org%2F.mediawiki%2Findex.php%3Faction%3Draw%26title%3DHard_Impact_CoT_Prototype&url2=http%3A%2F%2Fdarpapedia.mitre.org%2F.mediawiki%2Findex.php%3Faction%3Draw%26title%3DTemplate%3AFancyBusinessCard'
		);
	}
 
	public function getHelpUrls() {
		return '';
	}





}
