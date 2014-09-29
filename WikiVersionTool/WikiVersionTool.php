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
* include_once("$IP/extensions/WikiVersionTool/WikiVersionTool.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of WikiVersionTool is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'WikiVersionTool',
	'version' => '1.0',
	'author' => 'Alex Lyte',
	'descriptionmsg' => 'wikiversiontool-desc'
);
 
$wgExtensionMessagesFiles['WikiVersionTool'] =
	__DIR__ . '/WikiVersionTool.i18n.php';

$wgResourceModules['ext.WikiVersionTool'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'WikiVersionTool',
	'styles' => array(
		'WikiVersionTool.css'
	),
	'scripts' => array(
		'lib/d3.js',
		'lib/d3.tip.v0.6.3.js',
		'lib/es5-shim.min.js',
		'lib/es5-sham.min.js',
		'src/getVersions.js',
		'src/getVersionData.js',
		'src/makeDiffTables.js'
	)
);

$wgHooks['LanguageGetMagic'][] = 'wfExtensionWikiVersionTool_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efWikiVersionToolParserFunction_Setup';

function efWikiVersionToolParserFunction_Setup (& $parser) {
	$parser->setFunctionHook('wikiversiontool', 'wikiversiontool');
	return true;
}

function wfExtensionWikiVersionTool_Magic(& $magicWords, $langCode) {
	$magicWords['wikiversiontool'] = array (0, 'wikiversiontool');
	return true;
}

function wikiversiontool($parser, $width, $height, $wiki) {
	$myparams = func_get_args();
	array_shift($myparams);
	foreach($myparams as $value)
		wfErrorLog("$value\n", "/var/www/html/DEBUG_WikiVersionTool.out");
	wfErrorLog("$value\n", "/var/www/html/DEBUG_WikiVersionTool.out");
	$paramDictionary = wikiVersionTool_parseParameters($myparams);

	$width = $paramDictionary["width"];
	$height = $paramDictionary["height"];
	//$wiki = $paramDictionary["wiki"];

	$wikiVersionTool = new WikiVersionTool;

	if(!$width)
		$width = 1200;
	if(!$height)
		$height = 600;

	$output = $wikiVersionTool->display($parser, $width, $height, $wiki);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}




function wikiVersionTool_parseParameters($params) {
	$paramArray = array();
	foreach ($params as $param) {
		$ret = preg_split('/=/', $param, 2);
		if (count($ret) > 1) {
			$paramArray[$ret[0]] = $ret[1];
		}
	}
	return $paramArray;
}







class WikiVersionTool {

	private static $pqnum = 0;

	function display($parser, $width, $height, $wiki) {

		$div = "WikiVersionTool_" . self::$pqnum++;
		$graphdiv = $div . "_graph";
		$output = <<<EOT
<div id="wiki1"></div>
<div id="wiki2"></div>

<div id="wiki1text"></div>
<div id="wiki2text"></div>

<div id="clearButton"></div>


<h1></h1>	
<table>
<tr><td width="100%" ><div class="wikiversiontool-graph-container" id="$graphdiv" style="width: $width; height: $height; border-color: #ffffff;">
</div>
</td></tr>
</table>
<div id="tooltip" class="hidden">
  <p><strong id="category"></strong></p>
  <p><span id="subcategory"></span></p>
  <p><span id="pages"></span></p>
</div>
<div id="fullTable">
</div>
EOT;

		global $wgServer;
		global $wgScriptPath;
		$script =<<<END
mw.loader.using(['ext.WikiVersionTool'], function () {
	$(document).ready(function() {

		var g = new WikiVersionTool();
		g.drawChart("$graphdiv", "$width", "$height", "$wiki");
	});
});
END;
		$script = '<script type="text/javascript">' . $script . "</script>";

		global $wgOut;
		$wgOut->addScript($script);
		return $output;
	}
}


