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
* include_once("$IP/extensions/DummyBase/DummyBase.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of DummyBase is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'DummyBase',
	'version' => '0.1',
	'author' => 'Jason Ji'
);

if(array_key_exists("ext.DummyBase", $wgResourceModules)) {

	$wgResourceModules['ext.DummyBase']['localBasePath'] = dirname(__FILE__);
	$wgResourceModules['ext.DummyBase']['remoteExtPath'] = 'DummyBase';
	$wgResourceModules['ext.DummyBase']['styles'][] = 'DummyBase.css';
	$wgResourceModules['ext.DummyBase']['scripts'][] = 'DummyBase.js';

}
else {
	$wgResourceModules['ext.DummyBase'] = array(
		'localBasePath' => dirname(__FILE__),
		'remoteExtPath' => 'DummyBase',
		'styles' => array(
			'DummyBase.css'
		),
		'scripts' => array(
			'DummyBase.js'
		),
		'group' => 'DummyBaseHooks'
	);
}

$wgHooks['LanguageGetMagic'][] = 'wfExtensionDummyBase_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efDummyBaseParserFunction_Setup';

function efDummyBaseParserFunction_Setup (& $parser) {

	$parser->setFunctionHook('dummybase', 'dummybase');
	return true;
}

function wfExtensionDummyBase_Magic(& $magicWords, $langCode) {
	$magicWords['dummybase'] = array (0, 'dummybase');
	return true;
}

function dummybase($parser) {

	$dummybase = new DummyBase;
	$output = $dummybase->display($parser);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState), 'noparse' => false);

}


class DummyBase {

	function display($parser) {
//		$hooks = addslashes(json_encode( array("Location 1", array("function1", "function2", "function3"),
//				"Location 2", array("function4", "function5", "function6"),
//				"Location 3", array("function 7")) ));

		global $DummyBase_Function_Hooks;
	
		$hooks = addslashes(json_encode($DummyBase_Function_Hooks));

		global $wgOut;

		$output = $parser->getOutput();	// note: $parser->getOutput() is not the same as $wgOut

		$myLoader = $wgOut->getResourceLoader();
		$moduleNames = $myLoader->getModuleNames();
		$modulesToLoad = array();

		foreach($moduleNames as $name) {
			$module = $myLoader->getModule($name);
			$group = $module->getGroup();
			wfErrorLog("module name: $name - group: $group\n", "/var/www/html/DEBUG_DummyBase.out");
			if($group == "DummyBaseHooks") {
				$modulesToLoad[] = $name;
			}
		}
		$output->addModules($modulesToLoad);

		$modulesToLoad_json = addslashes(json_encode($modulesToLoad));

		$output = <<<EOT
<div id="DummyBase_MainDiv"></div>
EOT;

		$script = <<<END
var dummyExtensions = mw.loader.getModuleNames();
for(var i = 0; i < dummyExtensions.length; i++)
	console.log(dummyExtensions[i]);
mw.loader.using(jQuery.parseJSON("$modulesToLoad_json"), function() {
	$(document).ready(function() {
		DummyBase.initialize( "$hooks" );
	});
});
END;

		$script = '<script type="text/javascript">' . $script . "</script";
		$wgOut->addScript($script);
		return $output;

	}

}
