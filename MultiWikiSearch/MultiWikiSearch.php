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

$wgExtensionCredits[ 'specialpage' ][] = array(
	'name' => 'MultiWikiSearch',
	'version' => '0.1',
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

$wgAPIModules['getSearchableWikis'] = 'ApiGetSearchableWikis';

class SpecialMultiWikiSearch extends SpecialPage {
	function __construct() {
		parent::__construct('MultiWikiSearch');
	}
	function execute($par) {
		$request = $this->getRequest();
		$output = $this->getOutput();
		$this->setHeaders();
		$out = <<<EOT
<div id="searchTermsDiv">
	<fieldset>
		<legend>Search Parameters</legend>
		<p>Enter at least one search term and at least one wiki to be included in the search:</p>
		<table><tbody>
			<tr><td id="searchTermsTd">Search terms:</td><td><input type="text" name="searchTerms" id="searchTerms"></td>
			<tr><td>Scope:</td><td>
				<select name="scope" id="scope">
					<option value="title">Title only</option>
					<option value="text">Text only</option>
					<option value="both">Title and text</option>
				</select></td></tr>
			<tr><td id="wikisTd">Wikis:</td><td>
				<table><tbody>
					<tr><td>
						<fieldset>
							<legend>Included Wikis</legend>
							<select name="wikis" id="includedWikis" multiple="multiple"></select>
						</fieldset>
					<td>
						<button type="button" id="moveLeft">Move Left</button>
						<button type="button" id="moveRight">Move Right</button>
					</td>
					</td><td>
						<fieldset>
							<legend>Excluded Wikis</legend>
							<select name="wikis" id="excludedWikis" multiple="multiple"></select>
						</fieldset>
					</td></tr>
				</tbody></table>
			</td></tr>
			<tr><td>Namespaces:</td><td>
				<fieldset>
					<legend>Namespaces</legend>
					<div id="namespacesDiv"></div>
				</fieldset>
			</td></tr>
			<tr><td><button type="button" id="searchButton">Search</button></td></tr>
		</tbody></table>
	</fieldset>
</div>
<div id="searchResultsDiv">
	<fieldset>
		<legend>Search Results</legend>
	</fieldset>
</div>
EOT;

		$output->addHTML($out);

		$output->addModules('ext.MultiWikiSearch');

		global $wgServer, $wgScriptPath;
		$apiurl = $wgServer . $wgScriptPath . "/api.php";

		$script=<<<END
mw.loader.using(['ext.MultiWikiSearch'], function() {
	MultiWikiSearch.initializeMWS("$apiurl");
});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";
		$output->addScript($script);

	}
}

class ApiGetSearchableWikis extends ApiBase {
	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );
	}
 
	public function execute() {
 		wfErrorLog("API called!\n", "/var/www/html/DEBUG_MultiWikiSearch.out");
		$json = file_get_contents("http://gestalt.mitre.org/.mediawiki/index.php?title=Special:Ask&q=[[Category:Gestalt_Communities]][[Gestalt_Community_Searchable::Yes]]&po=?Wiki_API_URL&p[limit]=500&p[format]=json");
		$results = json_decode($json);

		$this->getResult()->addValue(null, $this->getModuleName(), $results);

		return true;
	}
 
	public function getDescription() {
		return 'Get a list of Gestalt Community wikis which are searchable.';
	}
 
	public function getExamples() {
		return array(
			'api.php?action=getSearchableWikis'
		);
	}
 
	public function getHelpUrls() {
		return '';
	}
}
