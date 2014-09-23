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
* include_once("$IP/extensions/VikiTitleIcon/VikiTitleIcon.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (!defined('VIKIJS_VERSION')) {
	die("<b>Error:</b> The extension VikiTitleIcon requires VikiJS to be installed first. Be sure that VikiJS is included on a line ABOVE the line where you've included VikiTitleIcon.");
}

if (version_compare($wgVersion, '1.22', 'lt')) {
	die('<b>Error:</b> This version of VikiTitleIcon is only compatible with MediaWiki 1.22 or above.');
}

if ( !defined( 'SMW_VERSION' ) ) {
	die( '<b>Error:</b> You need to have <a href="https://semantic-mediawiki.org/wiki/Semantic_MediaWiki">Semantic MediaWiki</a> installed in order to use VikiTitleIcon.' );
}

if(version_compare(SMW_VERSION, '1.9', '<')) {
	die('<b>Error:</b> VikiTitleIcon is only compatible with Semantic MediaWiki 1.9 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'VikiTitleIcon',
	'version' => '1.1.1',
	'author' => 'Jason Ji',
	'descriptionmsg' => 'vikititleicon-desc'
);

$wgExtensionMessagesFiles['VikiTitleIcon'] =
	__DIR__ . '/VikiTitleIcon.i18n.php';

$wgResourceModules['ext.VikiTitleIcon'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'VikiTitleIcon',
	'scripts' => array(
		'VikiTitleIcon.js'
	)
);

global $VikiJS_Function_Hooks;

if(!isset($VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks = array();

if(array_key_exists('AfterVisitNodeHook', $VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks['AfterVisitNodeHook'][] = 'VIKI.VikiTitleIcon.checkForTitleIcon';
else
	$VikiJS_Function_Hooks['AfterVisitNodeHook'] = array('VIKI.VikiTitleIcon.checkForTitleIcon');

$wgHooks['ParserFirstCallInit'][] = 'efVikiTitleIcon_AddResource';
$wgAPIModules['getTitleIcons'] = 'ApiGetTitleIcons';

function efVikiTitleIcon_AddResource (& $parser) {
	VikiJS::addResourceModule("ext.VikiTitleIcon");
	return true;
}

class ApiGetTitleIcons extends ApiBase {
	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );
	}
	
	public function execute() {
		$pageTitle = $this->getMain()->getVal('pageTitle');

		global $TitleIcon_TitleIconPropertyName;
 		$myTitleIconName = $TitleIcon_TitleIconPropertyName;

		$pageNameWithSpaces = str_replace('_', ' ', $pageTitle);
		$titleIconWithSpaces = str_replace('+', ' ', $myTitleIconName);
		
		$api = new ApiMain(
			new DerivativeRequest(
				$this->getRequest(),
				array(
					'action' => 'askargs',
					'conditions' => $pageTitle,
					'printouts' => $titleIconWithSpaces
				)
			),
			false
		);
		
		$api->execute();
		$data = $api->getResultData();

		if(is_array($data["query"]["results"]) && count($data["query"]["results"]) == 0) {
			$this->getResult()->addValue(null, $this->getModuleName(),
				array('pageTitle' => $pageTitle,
					'titleIcons' => array()
						));

			return true;
		}

		if(array_key_exists($pageNameWithSpaces, $data["query"]["results"]))
			$titleIconNames = $data["query"]["results"]["$pageNameWithSpaces"]["printouts"]["$titleIconWithSpaces"];
		else {
			$key = array_shift(array_keys($data["query"]["results"]));
			$titleIconNames = $data["query"]["results"][$key]["printouts"]["$titleIconWithSpaces"];
		}
		$titleIconURLs = array();
		
		foreach($titleIconNames as $name) {
			
			$api = new ApiMain(
				new DerivativeRequest(
					$this->getRequest(),
					array(
						'action' => 'query',
						'titles' => 'File:' . $name,
						'prop' => 'imageinfo',
						'iiprop' => 'url'
					)
				),
				false
			);			

			$api->execute();
			$data = $api->getResultData();
			$key = array_shift(array_keys($data["query"]["pages"]));
			$url = $data["query"]["pages"][$key]["imageinfo"][0]["url"];
			$titleIconURLs[] = $url;
		}

		$this->getResult()->addValue(null, $this->getModuleName(),
			array('pageTitle' => $pageTitle,
				'titleIcons' => $titleIconURLs
					));
		
		return true;
		
	}
	public function getDescription() {
		return "Get the URLs of all Title Icons for the page, if any exist.
			
Note that because the returned value is a JSON object, you must specify format=json in this query; the default xml format will return only an error.";
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
			'pageTitle' => 'title of the page whose title icons you wish to retrieve'
		);
	}
	public function getExamples() {
		return array(
			'api.php?action=getTitleIcons&pageTitle=Test_Page_C&format=jsonfm');
	}
	public function getHelpUrls() {
		return '';
	}
}
