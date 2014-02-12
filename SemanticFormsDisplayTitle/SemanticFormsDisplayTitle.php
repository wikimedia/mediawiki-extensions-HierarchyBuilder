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
* include_once("$IP/extensions/SemanticFormsDisplayTitle/SemanticFormsDisplayTitle.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of SemanticFormsDisplayTitle is only compatible with MediaWiki 1.21 or above.');
}

if (!defined('SF_VERSION')) {
	die('<b>Error:</b> SemanticFormsDisplayTitle is a Semantic Forms extension so must be included after Semantic Forms.');
}

if (version_compare(SF_VERSION, '2.5.2', 'lt')) {
	die('<b>Error:</b> This version of SemanticFormsDisplayTitle is only compatible with Semantic Forms 2.5.2 or above.');
}

define('SFDT_VERSION', '1.1.1');

# credits
$wgExtensionCredits['semantic'][] = array (
	'name' => 'SemanticFormsDisplayTitle',
	'version' => SFDT_VERSION,
	'author' => "Cindy Cicalese",
	'descriptionmsg' => 'sfdisplaytitle-desc'
);

$wgExtensionMessagesFiles['SemanticFormsDisplayTitle'] =
	__DIR__ . '/SemanticFormsDisplayTitle.i18n.php';

$wgResourceModules['ext.sfdisplaytitle.messages'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'SemanticFormsDisplayTitle',
	'messages' => array(
		'sfdisplaytitle-error-blank'
	)
);

$wgResourceModules['ext.sfdisplaytitle'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'SemanticFormsDisplayTitle',
	'scripts' => 'SemanticFormsDisplayTitle.js',
	'dependencies' => array(
		'ext.sfdisplaytitle.messages',
		'ext.semanticforms.main'
	)
);

$wgHooks['ParserFirstCallInit'][] = 'efSemanticFormsDisplayTitleSetup';

function efSemanticFormsDisplayTitleSetup (& $parser) {
	global $sfgFormPrinter;
	$sfgFormPrinter->registerInputType('SemanticFormsDisplayTitle');
	return true;
}

class SemanticFormsDisplayTitle extends SFFormInput {

	public function __construct($input_number, $cur_value, $input_name,
		$disabled, $other_args) {
		parent::__construct($input_number, $cur_value, $input_name, $disabled,
			$other_args);
		$this->addJsInitFunctionData('SemanticFormsDisplayTitle_init',
			$this->setupJsInitAttribs());
	}

	public static function getName() {
		return 'displaytitle';
	}

	protected function setupJsInitAttribs() {
		if (array_key_exists('sep', $this->mOtherArgs)) {
			$this->mSep = $this->mOtherArgs['sep'];
		} else {
			$this->mSep = ",";
		}

		$jsattribs = array(
			'is_mandatory' => array_key_exists('mandatory', $this->mOtherArgs),
			'sep' => $this->mSep
		);
		return json_encode($jsattribs);
	}

	public function getHtmlText() {

		if (array_key_exists('is_list', $this->mOtherArgs) &&
			$this->mOtherArgs['is_list'] == true) {
			$multiple = "multiple";
		} else {
			$multiple = "";
		}
 
		if ($this->mIsDisabled) {
			$disabled = "disabled";
		} else {
			$disabled = "";
		}

		if (array_key_exists('size', $this->mOtherArgs)) {
			$size = "size='" . $this->mOtherArgs["size"] . "'";
		} else {
			$size = "";
		}

		if (array_key_exists('limit', $this->mOtherArgs)) {
			$limit = $this->mOtherArgs["limit"];
		} else {
			$limit = 100;
		}

		if (array_key_exists('query', $this->mOtherArgs)) {
			$query = $this->mOtherArgs["query"];
			$query = str_replace("(", "[", $query);
			$query = str_replace(")", "]", $query);
		} else {
			$error_msg =
				wfMessage('sfdisplaytitle-error-missingquery')->text();
			return $error_msg;
		}

		if (array_key_exists('label_property', $this->mOtherArgs)) {
			$label_property = $this->mOtherArgs["label_property"];
		} else {
			$error_msg =
				wfMessage('sfdisplaytitle-error-missinglabelproperty')->
				text();
			return $error_msg;
		}

		global $wgParser;
		$wgParser->firstCallInit();
		$wgParser->setTitle(Title::newFromText('NO TITLE'));
		$wgParser->mOptions=new ParserOptions();
		$params = array (
			$wgParser->replaceVariables($query),
			"?" . $label_property,
			"sort" => $label_property,
			"limit" => $limit,
			"link" => "none",
			"format" => "table",
			"headers" => "hide",
			"sep" => $this->mSep
		);
		$result = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI);
		$rows = array();
		if (strlen($result) > 0) {
			$result = stristr($result, "<tr");
			while ($result && strlen($result) > 0) {
				$j = stripos($result, ">");
				if ($j > 1) {
					$result = substr($result, $j + 1);
					$i = stripos($result, "</tr>");
					$s = substr($result, 0, $i);
					$rows[] = $s;
					$result = stristr($result, "<tr");
				} else {
					$result = "";
				}
			}
		}
		if (count($rows) < 1) {
			$error_msg = "<b>No matches</b>";
			return $error_msg;
		}

		global $sfgFieldNum;
		$input_id = "input_$sfgFieldNum";
		$info_id = "info_$sfgFieldNum";
		$output =
			"<input type='hidden' id='$input_id' name='$this->mInputName' />";
		$qlid = "ql_" . $input_id;
		$output .= "<select id='$qlid' $multiple $disabled $size>\n";

		$output .= "<option/>";
		$current =
			array_map('trim', explode($this->mSep, $this->mCurrentValue));
		$pattern = '/<td[^>]*>(.*)<\/td>\s*<td[^>]*>(.*)<\/td>/';
		$options = array();
		foreach ($rows as $row) {
			preg_match($pattern, $row, $matches);
			if (isset($matches[1]) && isset($matches[2])) {
				$value = trim($matches[1]);
				$label = trim($matches[2]);
				if (in_array($value, $current)) {
					$output .=
						"<option value='$value' selected>$label</option>";
				} else {
					$options[$value] = $label;
				}
			}
		}
		foreach ($options as $value => $label) {
			$output .= "<option value='$value'>$label</option>";
		}
		$output .= "</select>\n";
		$output .= " <span id='$info_id' class='errorMessage'></span>";

		return $output;
	}

	public static function getParameters() {
		$params = parent::getParameters();

		$params['query'] = array(
			'name' => 'query',
			'type' => 'string',
			'description' =>
				wfMessage('sfdisplaytitle-field-query-desc')->text()
		);

		$params['label_property'] = array(
			'name' => 'label_property',
			'type' => 'string',
			'description' =>
				wfMessage('sfdisplaytitle-field-label_property-desc')->text()
		);

		$params['size'] = array(
			'name' => 'size',
			'type' => 'string',
			'description' =>
				wfMessage('sfdisplaytitle-field-size-desc')->text()
		);

		$params['limit'] = array(
			'name' => 'limit',
			'type' => 'string',
			'description' =>
				wfMessage('sfdisplaytitle-field-limit-desc')->text()
		);

		$params['sep'] = array(
			'name' => 'sep',
			'type' => 'string',
			'description' =>
				wfMessage('sfdisplaytitle-field-sep-desc')->text()
		);

		return $params;
	}

	public function getResourceModuleNames() {
		return array(
			'ext.sfdisplaytitle'
		);
	}
}
