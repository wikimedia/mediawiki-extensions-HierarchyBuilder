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
* include_once("$IP/extensions/OrgChart/OrgChart.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of OrgChart is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'OrgChart',
	'version' => '0.1',
	'author' => 'Jason Ji',
	'descriptionmsg' => 'orgchart-desc'
);
 
$wgExtensionMessagesFiles['OrgChart'] =
	__DIR__ . '/OrgChart.i18n.php';

$wgResourceModules['ext.OrgChart'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'OrgChart',
	'styles' => array(
		'OrgChart.css'
	),
	'scripts' => array(
		'd3.v3.min.js',
		'OrgChart.js'
	)
);

$wgHooks['LanguageGetMagic'][] = 'wfExtensionOrgChart_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efOrgChartParserFunction_Setup';

$wgAPIModules['getOrgParent'] = 'ApiGetOrgParent';
$wgAPIModules['getOrgChildren'] = 'ApiGetOrgChildren';

function efOrgChartParserFunction_Setup (& $parser) {
	$parser->setFunctionHook('orgchart', 'orgchart');
	return true;
}

function wfExtensionOrgChart_Magic(& $magicWords, $langCode) {
	$magicWords['orgchart'] = array (0, 'orgchart');
	return true;
}

function orgchart($parser) {
	$myparams = func_get_args();
	array_shift($myparams);
	foreach($myparams as $value)
		wfErrorLog("$value\n", "/var/www/html/DEBUG_OrgChart.out");
	wfErrorLog("$value\n", "/var/www/html/DEBUG_OrgChart.out");
	$paramDictionary = orgChart_parseParameters($myparams);

	$orgName = array_key_exists("orgName", $paramDictionary) ? $paramDictionary["orgName"] : null;
	$width = array_key_exists("width", $paramDictionary) ? $paramDictionary["width"] : null;
	$height = array_key_exists("height", $paramDictionary) ? $paramDictionary["height"] : null;
	$alignment = array_key_exists("align", $paramDictionary) ? $paramDictionary["align"] : null;

	$orgChart = new OrgChart;

	if(!$width)
		$width = 1200;
	if(!$height)
		$height = 600;
	if(!$alignment)
		$alignment = "horizontal";

	$output = $orgChart->display($parser, $orgName, $width, $height, $alignment);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}

function orgChart_parseParameters($params) {
	$paramArray = array();
	foreach ($params as $param) {
		$ret = preg_split('/=/', $param, 2);
		if (count($ret) > 1) {
			$paramArray[$ret[0]] = $ret[1];
		}
	}
	return $paramArray;
}

class OrgChart {

	private static $pqnum = 0;

	function display($parser, $orgName, $width, $height, $alignment) {

		$div = "OrgChart_" . self::$pqnum++;
		$graphdiv = $div . "_graph";
		$output = <<<EOT
<table>
<tr><td><div class="orgchart-graph-container" id="$graphdiv">
</div></td></tr>
</table>
EOT;

		global $wgServer;
		global $wgScriptPath;
		$script =<<<END
mw.loader.using('ext.OrgChart', function () {
	$(document).ready(function() {
		var g = new OrgChart();
		g.drawChart("$orgName", "$graphdiv", "$width", "$height", "$alignment");
	});
});
END;
		$script = '<script type="text/javascript">' . $script . "</script>";

		global $wgOut;
		$wgOut->addScript($script);
		return $output;
	}
}

class ApiGetOrgParent extends ApiBase {
	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );
	}

	public function execute() {
		global $wgServer;
		global $wgScriptPath;
		$orgName = $this->getMain()->getVal('orgName');

		$queryURL = $wgServer . $wgScriptPath . "/index.php?title=Special:Ask&q=[[" . $orgName . "]]&po=?Parent&p[format]=json";

		$this->getResult()->addValue(null, $this->getModuleName(),
			array('orgName' =>$orgName,
				'result' => "hello my parents"
			)
		);

		return true;
	}

	public function getDescription() {
		return "Get the parent organization of this organization.

Note that because the returned value is a JSON object, you must specify format=json in this query; the default xml format will return only an error.";
	}
	public function getAllowedParams() {
		return array(
			'orgName' => array(
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true
			)
		);
	}

	public function getParamDescription() {
		return array(
			'orgName' => 'title of the organization whose parent you wish to retrieve'
		);
	}

	public function getExamples() {
		return array(
			'api.php?action=getOrgParent&orgName=USA&format=jsonfm'
		);
	}
	public function getHelpUrls() {
		return '';
	}

}

class ApiGetOrgChildren extends ApiBase {
	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );
	}

	public function execute() {
		global $wgServer;
		global $wgScriptPath;

		$orgName = $this->getMain()->getVal('orgName');

		$queryURL = $wgServer . $wgScriptPath . "/index.php";
		$data = array(
				'title' => 'Special:Ask',
				'q' => '[[' . urlencode($orgName) . ']]',
				'po' => '?Parent
?Short Name
?Long Name
?Website
me?Logo Link',
				'p[format]' => 'json'
			);

		$options = array(
			'http' => array(
				'method' => "POST",
				'content' => http_build_query($data)
				)
			);

		$test = http_build_query($data);

		wfErrorLog("$test\n", "/var/www/html/DEBUG_OrgChart.out");
		
		$context = stream_context_create($options);

		$queryResult = json_decode(file_get_contents($queryURL, false, $context), true);

		$this->getResult()->addValue(null, $this->getModuleName(),
			array('orgName' =>$orgName,
				'result' => $queryResult["results"]
			)
		);

		return true;
	}

	public function getDescription() {
		return "Get the children organizations of this organization.

Note that because the returned value is a JSON object, you must specify format=json in this query; the default xml format will return only an error.";
	}
	public function getAllowedParams() {
		return array(
			'orgName' => array(
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true
			)
		);
	}

	public function getParamDescription() {
		return array(
			'orgName' => 'title of the organization whose children you wish to retrieve'
		);
	}

	public function getExamples() {
		return array(
			'api.php?action=getOrgChildren&orgName=USA&format=jsonfm'
		);
	}
	public function getHelpUrls() {
		return '';
	}

}
