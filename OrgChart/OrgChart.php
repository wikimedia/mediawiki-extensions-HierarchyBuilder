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

function efOrgChartParserFunction_Setup (& $parser) {
	$parser->setFunctionHook('orgchart', 'orgchart');
	return true;
}

function wfExtensionOrgChart_Magic(& $magicWords, $langCode) {
	$magicWords['orgchart'] = array (0, 'orgchart');
	return true;
}

function orgchart($parser, $orgName, $width, $height) {
	$myparams = func_get_args();
	array_shift($myparams);
	foreach($myparams as $value)
		wfErrorLog("$value\n", "/var/www/html/DEBUG_OrgChart.out");
	wfErrorLog("$value\n", "/var/www/html/DEBUG_OrgChart.out");
	$paramDictionary = orgChart_parseParameters($myparams);

	$orgName = $paramDictionary["orgName"];
	$width = $paramDictionary["width"];
	$height = $paramDictionary["height"];

	$orgChart = new OrgChart;

	if(!$width)
		$width = 1200;
	if(!$height)
		$height = 600;

	$output = $orgChart->display($parser, $orgName, $width, $height);
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

	function display($parser, $orgName, $width, $height) {

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
		g.drawChart("$orgName", "$graphdiv", "$width", "$height");
	});
});
END;
		$script = '<script type="text/javascript">' . $script . "</script>";

		global $wgOut;
		$wgOut->addScript($script);
		return $output;
	}
}
