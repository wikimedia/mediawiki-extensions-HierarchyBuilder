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
* include_once("$IP/extensions/WikiUserTool/WikiUserTool.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of WikiUserTool is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'WikiUserTool',
	'version' => '0.1',
	'author' => 'Alex Lyte',
	'descriptionmsg' => 'wikiusertool-desc'
);
 
$wgExtensionMessagesFiles['WikiUserTool'] =
	__DIR__ . '/WikiUserTool.i18n.php';

$wgResourceModules['ext.WikiUserTool'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'WikiUserTool',
	'styles' => array(
		'WikiVersionTool.css'
	),
	'scripts' => array(
		'lib/d3.v3.min.js',
		'lib/d3.tip.v0.6.3.js',
		'lib/es5-shim.min.js',
		'lib/es5-sham.min.js',
		'src/getWikis.js',
	)
);

$wgHooks['LanguageGetMagic'][] = 'wfExtensionWikiUserTool_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efWikiUserToolParserFunction_Setup';

function efWikiUserToolParserFunction_Setup (& $parser) {
	$parser->setFunctionHook('wikiusertool', 'wikiusertool');
	return true;
}

function wfExtensionWikiUserTool_Magic(& $magicWords, $langCode) {
	$magicWords['wikiusertool'] = array (0, 'wikiusertool');
	return true;
}

function wikiusertool($parser, $width, $height, $wiki) {
	$myparams = func_get_args();
	array_shift($myparams);
	foreach($myparams as $value)
		wfErrorLog("$value\n", "/var/www/html/DEBUG_WikiUserTool.out");
	wfErrorLog("$value\n", "/var/www/html/DEBUG_WikiUserTool.out");
	$paramDictionary = wikiUserTool_parseParameters($myparams);

	$width = $paramDictionary["width"];
	$height = $paramDictionary["height"];
	//$wiki = $paramDictionary["wiki"];

	$wikiUserTool = new WikiUserTool;

	if(!$width)
		$width = 1200;
	if(!$height)
		$height = 600;

	$output = $wikiUserTool->display($parser, $width, $height, $wiki);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}




function wikiUserTool_parseParameters($params) {
	$paramArray = array();
	foreach ($params as $param) {
		$ret = preg_split('/=/', $param, 2);
		if (count($ret) > 1) {
			$paramArray[$ret[0]] = $ret[1];
		}
	}
	return $paramArray;
}







class WikiUserTool {

	private static $pqnum = 0;

	function display($parser, $width, $height, $wiki) {

		$div = "WikiUserTool_" . self::$pqnum++;
		$graphdiv = $div . "_graph";
		$output = <<<EOT
<div id="wiki1"></div>
<div id="wiki2"></div>

<div id="wiki1text"></div>
<div id="wiki2text"></div>

<div id="clearButton"></div>


<h1></h1>	
<table>
<tr><td width="100%" ><div class="wikiusertool-graph-container" id="$graphdiv" style="width: $width; height: $height; border-color: #ffffff;">
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
mw.loader.using(['ext.WikiUserTool'], function () {
	$(document).ready(function() {

		var g = new WikiUserTool();
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


