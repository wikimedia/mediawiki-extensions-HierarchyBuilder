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
* include_once("$IP/extensions/VikiJS/VikiJS.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of VikiJS is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'VikiJS',
	'version' => '1.0',
	'author' => array("Jason Ji"),
	'descriptionmsg' => 'vikijs-desc'
);
 
$wgExtensionMessagesFiles['VikiJS'] =
	__DIR__ . '/VikiJS.i18n.php';

$wgResourceModules['ext.VikiJS'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'VikiJS',
	'styles' => array(
		'VikiJS.css'
	),
	'scripts' => array(
		'd3.v3.min.js',
		'VikiJS.js'
	)
);

$wgHooks['LanguageGetMagic'][] = 'wfExtensionVikiJS_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efVikiJSParserFunction_Setup';

function efVikiJSParserFunction_Setup (& $parser) {
	$parser->setFunctionHook('vikijs', 'vikijs');
	return true;
}

function wfExtensionVikiJS_Magic(& $magicWords, $langCode) {
	$magicWords['vikijs'] = array (0, 'vikijs');
	return true;
}

function vikijs($parser, $pageTitles, $width, $height) {
	$myparams = func_get_args();
	array_shift($myparams);
	foreach($myparams as $value)
		wfErrorLog("$value\n", "/var/www/html/DEBUG_VikiJS.out");
	wfErrorLog("$value\n", "/var/www/html/DEBUG_VikiJS.out");
	$paramDictionary = parseParameters($myparams);

	$pageTitles = $paramDictionary["pageTitle"];
	$width = $paramDictionary["width"];
	$height = $paramDictionary["height"];

	$vikiJS = new VikiJS;

	if(!$width)
		$width = 1200;
	if(!$height)
		$height = 600;

	$output = $vikiJS->display($parser, $pageTitles, $years, $width, $height);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}

function parseParameters($params) {
	$paramArray = array();
	foreach ($params as $param) {
		$ret = preg_split('/=/', $param, 2);
		if (count($ret) > 1) {
			$paramArray[$ret[0]] = $ret[1];
		}
	}
	return $paramArray;
}

class VikiJS {

	private static $pqnum = 0;

	function display($parser, $pageTitles, $years, $width, $height) {

		global $wgOut;

		$parser->getOutput()->addModules('ext.VikiJS');
		$parser->getOutput()->addModules('jquery.ui.slider');
		$div = "VikiJS_" . self::$pqnum++;
		$graphdiv = $div . "_graph";
		$detailsdiv = $div . "_details";
		$detailssubdiv = $detailsdiv . "_data";
		$output = <<<EOT
<table>
<tr><td><div class="vikijs-graph-container" id="$graphdiv">
</div></td></tr>
<tr><td><div class="vikijs-detail-panel" id="$detailsdiv">
<div id="$detailssubdiv"></div>
<div id="vikijs-zoom-slider"></div>
</div></td></tr>
<tr><td><div id="vikijs-errors-panel">
</div></td></tr>
</table>
EOT;

		global $wgServer;
		global $wgScriptPath;
		$imagePath = $wgServer . $wgScriptPath .  '/extensions/VikiJS/';
		$script =<<<END
mw.loader.using(['jquery.ui.slider', 'ext.VikiJS'], function () {
	$(document).ready(function() {
		VikiJS.drawGraph("$pageTitles", "$graphdiv", "$detailssubdiv", "$imagePath", "$names_json", "$width", "$height");
	});
});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";
		$wgOut->addScript($script);
		return $output;
	}
}