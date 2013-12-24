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
* include_once("$IP/extensions/DeferredAsk/DeferredAsk.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of DeferredAsk is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'DeferredAsk',
	'version' => '1.0.1',
	'author' => "Cindy Cicalese",
	'descriptionmsg' => 'deferredask-desc'
);
 
$wgExtensionMessagesFiles['DeferredAsk'] =
	__DIR__ . '/DeferredAsk.i18n.php';

$wgResourceModules['ext.DeferredAsk'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'DeferredAsk',
	'scripts' => 'DeferredAsk.js'
);

$wgHooks['LanguageGetMagic'][] = 'wfExtensionDeferredAsk_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efDeferredAskParserFunction_Setup';

function efDeferredAskParserFunction_Setup (& $parser) {
	$parser->setFunctionHook('deferredask', 'deferredask');
	return true;
}

function wfExtensionDeferredAsk_Magic(& $magicWords, $langCode) {
	$magicWords['deferredask'] = array (0, 'deferredask');
	return true;
}

function deferredask($parser) {
	$params = func_get_args();
	array_shift($params); // first is $parser; strip it
	$paramString = implode("|", $params);
	$deferredask = new DeferredAsk;
	$output = $deferredask->buildDiv($parser, $paramString);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}

$wgAPIModules['deferredask'] = 'ApiDeferredAsk';

class ApiDeferredAsk extends ApiBase{

	public function __construct($main, $action) {
		parent::__construct($main, $action);
	}

	public function execute() {
		$params = $this->extractRequestParams();
		$params = $params['params'];
		$paramArray = explode("|", $params);
		$result = SMWQueryProcessor::getResultFromFunctionParams($paramArray,
			SMW_OUTPUT_WIKI);
		$this->getResult()->addValue(null, 'deferredask', $result);
	}

	public function getAllowedParams() {
		return array(
			'params' => null
		);
	}

	public function getParamDescription() {
		return array(
			'params' => wfMessage('deferredaskapi-params-desc')->text()
		);
	}

	public function getDescription() {
		return wfMessage('deferredaskapi-desc')->text();
	}

	public function getVersion() {
		return __CLASS__ . ": 1.0";
	}
}

class DeferredAsk {

	private static $danum = 0;

	function buildDiv($parser, $params) {

		global $wgOut;
		$wgOut->addModules('ext.DeferredAsk');
 
		global $wgServer, $wgScriptPath;
		$imgpath = $wgServer . $wgScriptPath .
			"/extensions/DeferredAsk/waiting.gif";

		$divName = "DeferredAsk_" . self::$danum++ . '_div';
		$output = "<div id='$divName'>";
		$output .=
			"<p style='text-align:center'><img src='$imgpath' /></p>";
		$output .= "</div>";

		$apiurl = $wgServer . $wgScriptPath . "/api.php";

		$script =<<<END
mw.loader.using(['ext.DeferredAsk'], function () {
	deferredask("$divName", "$params", "$apiurl");
});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";
		$wgOut->addScript($script);
 
		return $output;
	}
}
