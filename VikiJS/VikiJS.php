<?php 
/*
 * Copyright (c) 2014 The MITRE Corporation
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
* $wgRegisterInternalExternals = true;
* include_once("$IP/extensions/VikiJS/VikiJS.php");
* 
* If $wgRegisterInternalExternals was not already true, you must run
* refreshLinks.php after setting this flag.
*/

define('VIKIJS_VERSION', '1.2');

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.22', 'lt')) {
	die('<b>Error:</b> This version of VikiJS is only compatible with MediaWiki 1.22 or above.');
}

if ( !defined( 'SMW_VERSION' ) ) {
	die( '<b>Error:</b> You need to have <a href="https://semantic-mediawiki.org/wiki/Semantic_MediaWiki">Semantic MediaWiki</a> installed in order to use VikiJS.' );
}

if(version_compare(SMW_VERSION, '1.9', '<')) {
	die('<b>Error:</b> VikiJS is only compatible with Semantic MediaWiki 1.9 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'VikiJS',
	'version' => '1.3',
	'author' => 'Jason Ji',
	'descriptionmsg' => 'vikijs-desc'
);
 
$wgExtensionMessagesFiles['VikiJS'] =
	__DIR__ . '/VikiJS.i18n.php';

$wgResourceModules['ext.VikiJS'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'VikiJS',
	'styles' => array(
		'VikiJS.css',
		'vex.css',
		'vex-theme-default.css'
	),
	'scripts' => array(
		'd3.v3.min.js',
		'vex.combined.min.js',
		'spin.min.js',
		'contextmenu.js',
		'VikiJS.js'
	)
);

$wgHooks['LanguageGetMagic'][] = 'wfExtensionVikiJS_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efVikiJSParserFunction_Setup';

$wgAPIModules['getSiteLogo'] = 'ApiGetSiteLogo';
// $wgAPIModules['getTitleIcons'] = 'ApiGetTitleIcons';
$wgAPIModules['getContentNamespaces'] = 'ApiGetContentNamespaces';

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
	$paramDictionary = vikiJS_parseParameters($myparams);

	$pageTitles = $paramDictionary["pageTitles"];
	$width = $paramDictionary["width"];
	$height = $paramDictionary["height"];

	$vikiJS = new VikiJS;

	if(!$width)
		$width = 1200;
	if(!$height)
		$height = 600;

	$output = $vikiJS->display($parser, $pageTitles, $width, $height);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}

function vikiJS_parseParameters($params) {
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
	private static $modules = array("ext.VikiJS", "jquery.ui.slider", "jquery.ui.progressbar");
	private static $functionHooks = array();
	private static $functionHookParams = array();

	static function addResourceModule($moduleName) {
		self::$modules[] = $moduleName;
	}

	static function addPHPHook($functionName, $params) {
		self::$functionHooks[] = $functionName;
		self::$functionHookParams[] = $params;
	}

	function display($parser, $pageTitles, $width, $height) {

		global $VikiJS_Function_Hooks;
		global $wgServer;
		global $wgScriptPath;
		global $wgLogo;

		$div = "VikiJS_" . self::$pqnum++;
		$graphdiv = $div . "_graph";
		$detailsdiv = $div . "_details";
		$subdetailsdiv = $div . "_details_data";
		$errorsdiv = $div . "_errors";
		$sliderdiv = $detailsdiv . "_zoom_slider";
		
		$output = <<<EOT
<table>
<tr><td><div class="vikijs-graph-container" id="$graphdiv">
</div></td></tr>
<tr><td><div class="vikijs-detail-panel" id="$detailsdiv">
<div class="vikijs-subdetail-panel" id="$subdetailsdiv"></div>
<div class="vikijs-zoom-slider" id="$sliderdiv"></div>
</div></td></tr>
<tr><td><div class="vikijs-errors-panel" id="$errorsdiv">
</div></td></tr>
</table>
EOT;
		
		$outputObject = $parser->getOutput();

		foreach(self::$modules as $name) {
			wfErrorLog("Adding module name: $name\n", "/var/www/html/DEBUG_VikiJS.out");
			$outputObject->addModules($name);
		}

		$index = 0;
		foreach(self::$functionHooks as $hook) {
			// wfErrorLog("About to call hook: $hook with params: " . print_r(self::$functionHookParams[$index], true) . "\n", "/var/www/html/DEBUG_VikiJS.out");
			call_user_func_array($hook, self::$functionHookParams[$index]);
			$index++;
		}

		$pageTitles_json = addslashes(json_encode(array_map('trim', explode(',', $pageTitles))));
		$modules_json = addslashes(json_encode(self::$modules));
		$divs_json = addslashes(json_encode(array($graphdiv, $subdetailsdiv, $sliderdiv, $errorsdiv)));
		$parameters_json = addslashes(json_encode(array(
															"width" => $width, 
															"height" => $height, 
															"imagePath" => $wgServer . $wgScriptPath .  '/extensions/VikiJS/', 
															"hooks" => $VikiJS_Function_Hooks,
															"logoURL" => $wgLogo)));

		$script =<<<END
modules = jQuery.parseJSON("$modules_json");
mw.loader.using(jQuery.parseJSON("$modules_json"), function () {
	$(document).ready(function() {
		var g = new VIKI.VikiJS();
		g.initialize("$pageTitles_json", "$divs_json", "$parameters_json");
	});
});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";

		global $wgOut;
		$wgOut->addScript($script);

		return $output;
	}
}

class ApiGetSiteLogo extends ApiBase {
	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );
	}
	public function execute() {
		global $wgLogo;
		$this->getResult()->addValue(null, $this->getModuleName(), $wgLogo);

		return true;
	}
	public function getDescription() {
		return "Get the URL of the site logo.";
	}
	public function getExamples() {
		return array(
			'api.php?action=getSiteLogo'
		);
	}
	public function getHelpUrls() {
		return '';
	}
}

class ApiGetContentNamespaces extends ApiBase {
	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );
	}
	public function execute() {
		global $wgContentNamespaces;
		$this->getResult()->addValue(null, $this->getModuleName(), $wgContentNamespaces);

		return true;
	}
	public function getDescription() {
		return "Get the list of content namespaces for this wiki.
			
Note that because the returned value is a JSON object, you must specify format=json in this query; the default xml format will return only an error.";
	}
	public function getExamples() {
		return array(
			'api.php?action=getContentNamespaces'
		);
	}
	public function getHelpUrls() {
		return '';
	}
}

