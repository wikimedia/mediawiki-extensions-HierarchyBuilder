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
* include_once("$IP/extensions/SemanticFormsUniqueValue/SemanticFormsUniqueValue.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of SemanticFormsUniqueValue is only compatible with MediaWiki 1.21 or above.');
}

if (!defined('SF_VERSION')) {
	die('<b>Error:</b> SemanticFormsUniqueValue is a Semantic Forms extension so must be included after Semantic Forms.');
}

if (version_compare(SF_VERSION, '2.5.2', 'lt')) {
	die('<b>Error:</b> This version of SemanticFormsUniqueValue is only compatible with Semantic Forms 2.5.2 or above.');
}

define('SFUV_VERSION', '1.0');

# credits
$wgExtensionCredits['semantic'][] = array (
	'name' => 'SemanticFormsUniqueValue',
	'version' => SFUV_VERSION,
	'author' => "Cindy Cicalese",
	'descriptionmsg' => 'sfuniquevalue-desc'
);

$wgExtensionMessagesFiles['SemanticFormsUniqueValue'] =
	__DIR__ . '/SemanticFormsUniqueValue.i18n.php';

$wgResourceModules['ext.sfuniquevalue.messages'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'SemanticFormsUniqueValue',
	'messages' => array(
		'sfuniquevalue-error-blank',
		'sfuniquevalue-error-duplicate',
		'sfuniquevalue-error-disallowed'
	)
);

$wgResourceModules['ext.sfuniquevalue'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'SemanticFormsUniqueValue',
	'scripts' => 'SemanticFormsUniqueValue.js',
	'dependencies' => array(
		'ext.sfuniquevalue.messages',
		'ext.semanticforms.main'
	)
);

$wgHooks['ParserFirstCallInit'][] = 'efSemanticFormsUniqueValueSetup';

function efSemanticFormsUniqueValueSetup (& $parser) {
	global $sfgFormPrinter;
	$sfgFormPrinter->registerInputType('SemanticFormsUniqueValue');
	return true;
}

$wgAPIModules['uniquevalue'] = 'ApiUniqueValue';

class ApiUniqueValue extends ApiBase {

	public function __construct($main, $action) {
		parent::__construct($main, $action);
	}

	public function execute() {
		$params = $this->extractRequestParams();
		$property_name = $params['PropertyName'];
		$value = $params['Value'];
		$query = $params['Query'];
		if (!$property_name) {
			$this->getResult()->addValue(null, 'uniquevalue', false);
			return;
		} else {
			$property_name = trim($property_name);
			if (strlen($property_name) < 1) {
				$this->getResult()->addValue(null, 'uniquevalue', false);
				return;
			}
		}
		if (!$value) {
			$this->getResult()->addValue(null, 'uniquevalue', false);
			return;
		} else {
			$value = trim($value);
			if (strlen($value) < 1) {
				$this->getResult()->addValue(null, 'uniquevalue', false);
				return;
			}
		}
		if (!$query) {
			$query = "";
		}
		$params = array();
		$params[] = $query . "[[$property_name::$value]]";
		$params[] = "format=count";
		$result = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI);
		$this->getResult()->addValue(null, 'uniquevalue', $result);
	}

	public function getAllowedParams() {
		return array(
			'PropertyName' => null,
			'Value' => null,
			'Query' => null
		);
	}

	public function getParamDescription() {
		return array(
			'PropertyName' =>
				wfMessage('sfuniquevalueapi-param-propertyname-desc')->
				text(),
			'Value' =>
				wfMessage('sfuniquevalueapi-param-value-desc')->text(),
			'Query' =>
				wfMessage('sfuniquevalueapi-param-query-desc')->text()
		);
	}

	public function getDescription() {
		return wfMessage('sfuniquevalueapi-desc')->text();
	}

	public function getVersion() {
		return __CLASS__ . ": 1.2";
	}
}

class SemanticFormsUniqueValue extends SFFormInput {

	public function __construct($input_number, $cur_value, $input_name,
		$disabled, $other_args) {
		parent::__construct($input_number, $cur_value, $input_name, $disabled,
			$other_args);
		$this->addJsInitFunctionData('SemanticFormsUniqueValue_init',
			$this->setupJsInitAttribs());
	}

	public static function getName() {
		return 'uniquevalue';
	}

	protected function setupJsInitAttribs() {

		if (array_key_exists('propertyname', $this->mOtherArgs)) {
			$this->mPropertyName = $this->mOtherArgs["propertyname"];
		} else {
			$this->mPropertyName = null;
			return;
		}

		if (array_key_exists('query', $this->mOtherArgs)) {
			$query = $this->mOtherArgs["query"];
			$query = str_replace("(", "[", $query);
			$query = str_replace(")", "]", $query);
		} else {
			$query = "";
		}

		if (array_key_exists('disallowed', $this->mOtherArgs)) {
			$disallowed = $this->mOtherArgs["disallowed"];
		} else {
			$disallowed = "";
		}

		global $wgServer, $wgScriptPath;
		$api_url = $wgServer .	$wgScriptPath . "/api.php";

		$jsattribs = array(
			'current_value' => $this->mCurrentValue,
			'property_name' => $this->mPropertyName,
			'query' => $query,
			'disallowed' => $disallowed,
			'api_url' => $api_url
		);
		return json_encode($jsattribs);
	}

	public function getHtmlText() {

		if ($this->mPropertyName == null) {
			$error_msg =
				wfMessage('sfuniquevalue-error-missingpropertyname')->text();
			return $error_msg;
		}

		global $sfgFieldNum, $sfgTabIndex;
		$input_id = "input_$sfgFieldNum";
		$info_id = "info_$sfgFieldNum";

		$inputAttrs = array(
			'id' => $input_id,
			'tabindex' => $sfgTabIndex,
		);
		if ($this->mIsDisabled) {
			$inputAttrs['disabled'] = 'disabled';
		}
		if (array_key_exists('size', $this->mOtherArgs)) {
			$inputAttrs['size'] = $this->mOtherArgs['size'];
		} else {
			$inputAttrs['size'] = 35;
		}
		$output = Html::input($this->mInputName, $this->mCurrentValue, 'text',
			$inputAttrs);
		$output .= " <span id='$info_id' class='errorMessage'></span>";

		return $output;
	}

	public static function getParameters() {
		$params = parent::getParameters();

		$params['propertyname'] = array(
			'name' => 'propertyname',
			'type' => 'string',
			'description' =>
				wfMessage('sfuniquevalue-param-propertyname-desc')->text()
		);

		$params['query'] = array(
			'name' => 'query',
			'type' => 'string',
			'description' =>
				wfMessage('sfuniquevalue-param-query-desc')->text()
		);

		$params['disallowed'] = array(
			'name' => 'disallowed',
			'type' => 'string',
			'description' =>
				wfMessage('sfuniquevalue-param-disallowed-desc')->text()
		);

		return $params;
	}

	public function getResourceModuleNames() {
		return array(
			'ext.sfuniquevalue'
		);
	}
}
