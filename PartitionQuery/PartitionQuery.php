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
* include_once("$IP/extensions/PartitionQuery/PartitionQuery.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of PartitionQuery is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'PartitionQuery',
	'version' => '1.0.1',
	'author' => "Cindy Cicalese",
	'descriptionmsg' => 'partitionquery-desc'
);
 
$wgExtensionMessagesFiles['PartitionQuery'] =
	__DIR__ . '/PartitionQuery.i18n.php';

$wgResourceModules['ext.PartitionQuery'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'PartitionQuery',
	'scripts' => 'PartitionQuery.js'
);

$wgHooks['LanguageGetMagic'][] = 'wfExtensionPartitionQuery_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efPartitionQueryParserFunction_Setup';

function efPartitionQueryParserFunction_Setup (& $parser) {
	$parser->setFunctionHook('firstChars', 'firstChars');
	$parser->setFunctionHook('partitionQuery', 'partitionQuery');
	return true;
}

function wfExtensionPartitionQuery_Magic(& $magicWords, $langCode) {
	$magicWords['firstChars'] = array (0, 'firstChars');
	$magicWords['partitionQuery'] = array (0, 'partitionQuery');
	return true;
}

function firstChars($parser, $partitionProperty, $query) {
	return PartitionQuery_FirstChars::execute($parser, $partitionProperty,
		$query);
}

function partitionQuery($parser, $letters, $partitionProperty, $query) {
	$params = func_get_args();
	array_shift($params); // first is $parser; strip it
	array_shift($params); // second is letter string; strip it
	array_shift($params); // third is partitioning variable; strip it
	array_shift($params); // fourth is query string; strip it
	$partitionQuery = new PartitionQuery;
	$output = $partitionQuery->firstVisit($parser, $letters, $partitionProperty,
		$query, $params);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}

$wgAPIModules['partitionquery'] = 'ApiPartitionQuery';

class ApiPartitionQuery extends ApiBase{

	public function __construct($main, $action) {
		parent::__construct($main, $action);
	}

	public function execute() {
		$params = $this->extractRequestParams();
		$property = $params['property'];
		$letter = $params['letter'];
		$query = $params['query'];
		$params = $params['params'];
		$paramArray = explode("|", $params);
		$partitionQuery = new PartitionQuery;
		$result = $partitionQuery->populateDiv($property, $letter, $query,
			$paramArray);
		$this->getResult()->addValue(null, 'partitionquery', $result);
	}

	public function getAllowedParams() {
		return array(
			'property' => null,
			'letter' => null,
			'query' => null,
			'params' => null
		);
	}

	public function getParamDescription() {
		return array(
			'property' => wfMessage('partitionqueryapi-property-desc')->text(),
			'letter' => wfMessage('partitionqueryapi-letter-desc')->text(),
			'query' => wfMessage('partitionqueryapi-query-desc')->text(),
			'params' => wfMessage('partitionqueryapi-params-desc')->text()
		);
	}

	public function getDescription() {
		return wfMessage('partitionqueryapi-desc')->text();
	}

	public function getVersion() {
		return __CLASS__ . ": 1.0";
	}
}

class PartitionQuery_FirstChars {

	private static function getCount($query) {
		$params = array();
		$params[] = $query;
		$params[] = "format=count";
		$output = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI);
		return $output;
	}

	private static function sortFirstChars(&$firstchars) {
		$alpha = array();
		$nonalpha = array();
		foreach ($firstchars as $c) {
			if (ctype_alpha($c)) {
				$alpha[] = $c;
			} else {
				$nonalpha[] = $c;
			}
		}
		sort($alpha);
		sort($nonalpha);
		$firstchars = array();
		foreach ($alpha as $c) {
			$firstchars[] = $c;
		}
		foreach ($nonalpha as $c) {
			$firstchars[] = $c;
		}
	}

	public function execute($parser, $partitionProperty, $query) {
		global $smwgQMaxLimit;
		$params = array();
		$params[] = $query;
		$params[] = "?" . $partitionProperty;
		$params[] = "mainlabel=-";
		$params[] = "headers=hide";
		$params[] = "limit=" . $smwgQMaxLimit;
		$params[] = "format=ol";
		$params[] = "searchlabel=";
		$params[] = "offset=0";
		$offset = 0;
		$offset_index = count($params) - 1;
		$firstchars = array();
		$count = self::getCount($query);
		do {
			$output = SMWQueryProcessor::getResultFromFunctionParams($params,
				SMW_OUTPUT_WIKI);
			if (preg_match_all("/<li>(.*)<\/li>/U", $output, $matches) !== 0) {
				$offset += count($matches[1]);
				$params[$offset_index] = "offset=" . $offset;
				foreach ($matches[1] as $match) {
					$firstchar = strtoupper($match[0]);
					if (ctype_space($firstchar)) {
						continue;
					}
					if ($firstchar == '*') {
						continue;
					}
					if (in_array($firstchar, $firstchars)) {
						continue;
					}
					$firstchars[] = $firstchar;
				}
			}
		} while ($offset < $count);
		$s = '';
		if (count($firstchars) > 0) {
			self::sortFirstChars($firstchars);
			$s = implode("", $firstchars);
		}
		return $s;
	}
}

class PartitionQuery {

	private $formname = '';
	private static $pqnum = 0;

	function firstVisit($parser, $letters, $partitionProperty, $query,
		$params) {

		global $wgOut;
		$wgOut->addModules('ext.PartitionQuery');
 
		if (strlen($letters) < 1) {
			return "";
		}

		$currentLetter = $letters[0];
		$currentLetterSymbol = $this->letterToSymbol($currentLetter);

		$this->formname = "PartitionQuery_" . self::$pqnum++;
		$buttonNameStem = $this->formname . '_button_';
		$divNameStem = $this->formname . '_div_';
		$letterArray = str_split($letters);
		$form = $this->buildForm($letterArray, $currentLetterSymbol,
			$buttonNameStem, $divNameStem, $partitionProperty, $query, $params);

		$output = '<div><div style="text-align:center">' . $form . '</div>';

		$output .= $this->buildDivs($letterArray, $divNameStem);

		$output .= '</div>';

		$script =<<<END
mw.loader.using(['ext.PartitionQuery'], function () {
	firstPartition("$this->formname", "$buttonNameStem");
});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";
		$wgOut->addScript($script);
 
		return $output;
	}

	function populateDiv($partitionProperty, $currentLetterSymbol, $query,
		$params) {
		$currentPartitionData = $this->getPartitionData($partitionProperty,
			$currentLetterSymbol, $query, $params);
		$parser = new Parser;
		$currentPartitionData = $parser->parse($currentPartitionData,
			Title::newFromText("temp"), new ParserOptions);
		return $currentPartitionData->getText();
	}

	private function letterToSymbol($letter) {
		if ($letter === '"') {
			return 'd';
		} else if ($letter === "'") {
			return 's';
		} else if (ctype_alpha($letter)) {
			return strtoUpper($letter);
		}
		return $letter;
	}

	private function addButton($letter, $index, $buttonNameStem, $divNameStem,
		$apiurl) {
		if (ctype_space($letter)) {
			return;
		}
		if ($letter == '*') {
			return;
		}
		$buttonId = $buttonNameStem . $index;
		$class = 'partition-query-button partition-query-button-unselected';
		$out = <<<EOT
<button type='button' id='$buttonId' class='$class' onClick="buttonClicked('$this->formname', '$index', '$buttonNameStem', '$divNameStem', '$apiurl')">$letter</button>
EOT;
		return $out;
	}

	private function buildForm($letterArray, $currentLetterSymbol,
		$buttonNameStem, $divNameStem, $partitionProperty, $query, $params) {
		$buttonId = $buttonNameStem . 'Previous';
		global $wgServer, $wgScriptPath;
		$apiurl = $wgServer . $wgScriptPath . "/api.php";
		$out = <<<EOT
<button type='button' id='$buttonId' class='partition-query-button' disabled='disabled' onClick="previousClicked('$this->formname', '$buttonNameStem')">&lt;</button>
EOT;
		$symbols = "";
		$index = 0;
		foreach ($letterArray as $letter) {
			$symbols .= $this->letterToSymbol($letter);
			$selected = false;
			$out .= $this->addButton($letter, $index, $buttonNameStem,
				$divNameStem, $apiurl, $selected);
			$index++;
		}
		$paramString = implode("|", $params);
		$buttonId = $buttonNameStem . 'Next';
		if (count($letterArray) < 2) {
			$disabled = "disabled='disabled'";
		} else {
			$disabled = "";
		}
		$out .= <<<EOT
<button type='button' id='$buttonId'class='partition-query-button' $disabled onClick="nextClicked('$this->formname', '$buttonNameStem')">&gt;</button>
EOT;
		$out .= <<<EOT
<form id='$this->formname' method='post' action=''>
<input type='hidden' name='Letters' value='$symbols'>
<input type='hidden' name='CurrentIndex' value='-1'>
<input type='hidden' name='AlreadyClickedLetters' value=''>
<input type='hidden' name='PartitionProperty' value='$partitionProperty'>
<input type='hidden' name='Query' value='$query'>
<input type='hidden' name='Params' value='$paramString'>
</form><br>
EOT;
		return $out;
	}

	private function getPartitionData($partitionProperty, $currentLetterSymbol,
		$query, $params) {
		$part = $this->buildPartition($partitionProperty, $currentLetterSymbol,
			$query);
		$askparams = array();
		$askparams[] = $query . $part;
		foreach ($params as $param) {
			$askparams[] = $param;
		}
		$result = SMWQueryProcessor::getResultFromFunctionParams($askparams,
			SMW_OUTPUT_WIKI);
		return $result;
	}

	private static function getCount($query) {
		$params = array();
		$params[] = $query;
		$params[] = "format=count";
		$output = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI);
		return $output;
	}

	private function buildPartition($partitionProperty, $currentLetterSymbol,
		$query) {
		if ($currentLetterSymbol === 'd') {
			$part = "[[$partitionProperty::~\"*]]";
		} else if ($currentLetterSymbol === 's') {
			$part = "[[$partitionProperty::~'*]]";
		} else if (ctype_alpha($currentLetterSymbol)) {
			// work around bug in SMW ask where incorrect results are returned
			// when one part of a disjunction returns no results
			$lowerpart = "[[$partitionProperty::~" .
				strtolower($currentLetterSymbol) .	"*]]";
			$lowercount = self::getCount($query . $lowerpart);
			$upperpart = "[[$partitionProperty::~" .	$currentLetterSymbol .
				"*]]";
			$uppercount = self::getCount($query . $upperpart);
			if ($lowercount == 0) {
				$part = $upperpart;
			} else if ($uppercount == 0) {
				$part = $lowerpart;
			} else {
				$part = "[[$partitionProperty::~" .
					strtolower($currentLetterSymbol) . "*||~" .
					$currentLetterSymbol . "*]]";
			}
		} else {
			$part = "[[$partitionProperty::~$currentLetterSymbol*]]";
		}
		return $part;
	}

	private function buildDivs($letterArray, $divNameStem) {
		$output = "";
		$index = 0;
		global $wgServer, $wgScriptPath;
		$imgpath = $wgServer . $wgScriptPath .
			"/extensions/PartitionQuery/waiting.gif";
		foreach ($letterArray as $letter) {
			$divName = $divNameStem . $index;
			$output .= "<div id='$divName' style='display:none'>";
			$output .=
				"<p style='text-align:center'><img src='$imgpath' /></p>";
			$output .= "</div>";
			$index++;
		}
		return $output;
	}
}
