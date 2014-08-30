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
* include_once("$IP/extensions/VikiSemanticTitle/VikiSemanticTitle.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (!defined('VIKIJS_VERSION')) {
	die("<b>Error:</b> The extension VikiSemanticTitle requires VikiJS to be installed first. Be sure that VikiJS is included on a line ABOVE the line where you've included VikiSemanticTitle.");
}

if (version_compare($wgVersion, '1.22', 'lt')) {
	die('<b>Error:</b> This version of VikiSemanticTitle is only compatible with MediaWiki 1.22 or above.');
}

if ( !defined( 'SMW_VERSION' ) ) {
	die( '<b>Error:</b> You need to have <a href="https://semantic-mediawiki.org/wiki/Semantic_MediaWiki">Semantic MediaWiki</a> installed in order to use VikiSemanticTitle.' );
}

if(version_compare(SMW_VERSION, '1.9', '<')) {
	die('<b>Error:</b> VikiSemanticTitle is only compatible with Semantic MediaWiki 1.9 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'VikiSemanticTitle',
	'version' => '1.1',
	'author' => 'Jason Ji',
	'descriptionmsg' => 'vikisemantictitle-desc'
);

$wgExtensionMessagesFiles['VikiSemanticTitle'] =
	__DIR__ . '/VikiSemanticTitle.i18n.php';

$wgResourceModules['ext.VikiSemanticTitle'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'VikiSemanticTitle',
	'scripts' => array(
		'VikiSemanticTitle.js'
	)
);

global $VikiJS_Function_Hooks;

if(!isset($VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks = array();

if(array_key_exists('AfterVisitNodeHook', $VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks['AfterVisitNodeHook'][] = 'VIKI.VikiSemanticTitle.checkForSemanticTitle';
else
	$VikiJS_Function_Hooks['AfterVisitNodeHook'] = array('VIKI.VikiSemanticTitle.checkForSemanticTitle');

$wgHooks['ParserFirstCallInit'][] = 'efVikiSemanticTitle_AddResource';
$wgAPIModules['getDisplayTitle'] = 'ApiGetDisplayTitle';

function efVikiSemanticTitle_AddResource (& $parser) {
	VikiJS::addResourceModule("ext.VikiSemanticTitle");
	return true;
}


class ApiGetDisplayTitle extends ApiBase {

	public function __construct($main, $action) {
		parent::__construct($main, $action);
	}

	public function execute() {
		global $wgSemanticTitleProperties;

		$pageTitle = $this->getMain()->getVal('pageTitle');
		$displayName = $pageTitle;
		
		// Get namespace for this page title via MW API

		$api = new ApiMain(
			new DerivativeRequest(
				$this->getRequest(),
				array(
					'action' => 'query',
					'prop' => 'info',
					'titles' => $pageTitle
				)
			),
			false
		);
		
		$api->execute();
		$data = $api->getResultData();

		$key = array_shift(array_keys($data["query"]["pages"]));
		$namespace = $data["query"]["pages"][$key]["ns"];

		// If the namespace is in $wgSemanticTitleProperties, extract the title property.

		if(array_key_exists($namespace, $wgSemanticTitleProperties)) {

			$displayNameProperty = $wgSemanticTitleProperties[$namespace];

			// $params = array("[[$pageTitle]]", "?$displayNameProperty=");
			// $result = SMWQueryProcessor::getResultFromFunctionParams( $params, SMW_OUTPUT_WIKI );
			// wfErrorLog(print_r($result, true) . "\n", "/var/www/html/jyj_logs/DEBUG_VikiSemanticTitle.out");

			// Get the semantic title from the title property via SMW API.
			// (Any better way to do this?)

			$api = new ApiMain(
				new DerivativeRequest(
					$this->getRequest(),
					array(
						'action' => 'askargs',
						'conditions' => $pageTitle,
						'printouts' => $displayNameProperty
					)
				),
				false
			);
			
			$api->execute();
			$data = $api->getResultData();

			$displayName = $data["query"]["results"][$pageTitle]["printouts"][$displayNameProperty][0];
			if($displayName == null)
				$displayName = $pageTitle;

		}

		$this->getResult()->addValue(null, $this->getModuleName(), 
			array( 'pageTitle' => $pageTitle,
				'result' => $displayName )
		);

		return true;
	}

	public function getDescription() {
		return 'Returns the semantic display title for a given page name, or empty string if it does not use content free page naming.';
	}
	public function getAllowedParams() {
		return array(
			'pageTitle' => array(
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true
			)
		);
	}
	public function getParamDescription() {
		return array(
			'pageTitle' => 'page name of the page whose semantic title is to be looked up (e.g. Item:1)'
		);
	}

	public function getExamples() {
		return array('api.php?action=getDisplayTitle&pageTitle=Item:1&format=jsonfm');
	}
	public function getHelpUrls() {
		return '';
	}
}
