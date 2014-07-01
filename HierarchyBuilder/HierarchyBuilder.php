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

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of HierarchyBuilder is only compatible with MediaWiki 1.21 or above.');
}

if (!defined('SF_VERSION')) {
	die('<b>Error:</b> HierarchyBuilder is a Semantic Forms extension so must be included after Semantic Forms.');
}

if (version_compare(SF_VERSION, '2.5.2', 'lt')) {
	die('<b>Error:</b> This version of HierarchyBuilder is only compatible with Semantic Forms 2.5.2 or above.');
}

# credits
$wgExtensionCredits['parserhook'][] = array (
	'name' => 'HierarchyBuilder',
	'version' => '1.3',
	'author' => "Cindy Cicalese",
	'descriptionmsg' => 'hierarchybuilder-desc'
);

$wgHooks['ParserFirstCallInit'][] = 'efHierarchyBuilderSetup';

$wgExtensionMessagesFiles['HierarchyBuilder'] =
	__DIR__ . '/HierarchyBuilder.i18n.php';

$wgExtensionMessagesFiles['HierarchyBuilderMagic'] =
	__DIR__ . '/HierarchyBuilder.i18n.magic.php';

$wgResourceModules['ext.HierarchyBuilder.jstree'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'HierarchyBuilder',
	'styles' => 'themes/apple/style.css',
	'scripts' => 'jquery.jstree.js'
);

$wgResourceModules['ext.HierarchyBuilder.render'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'HierarchyBuilder',
	'scripts' => 'renderHierarchy.js',
	'dependencies' => array(
		'ext.HierarchyBuilder.jstree'
	)
);

$wgResourceModules['ext.HierarchyBuilder.edit'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'HierarchyBuilder',
	'scripts' => 'editHierarchy.js',
	'styles' => 'editHierarchy.css',
	'dependencies' => array(
		'ext.HierarchyBuilder.jstree',
		'ext.semanticforms.main'
	)
);

$wgResourceModules['ext.HierarchyBuilder.select'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'HierarchyBuilder',
	'scripts' => 'selectFromHierarchy.js',
	'dependencies' => array(
		'ext.HierarchyBuilder.jstree',
		'ext.semanticforms.main'
	)
);

function efHierarchyBuilderSetup (& $parser) {
	$parser->setFunctionHook('hierarchyBreadcrumb', 'hierarchyBreadcrumb');
	$parser->setHook('hierarchy', 'renderHierarchy');
	global $sfgFormPrinter;
	$sfgFormPrinter->registerInputType('EditHierarchy');
	$sfgFormPrinter->registerInputType('SelectFromHierarchy');
	return true;
}

function hierarchyBreadcrumb($parser) {
	$params = func_get_args();
	if (count($params) < 4) {
		$output = "";
	} else {
		// $parser is always $params[0]
		$currentPage = $params[1];
		$hierarchyPage = $params[2];
		$hierarchyProperty = $params[3];
		if (count($params) < 5) {
			$displayNameProperty = null;
		} else {
			$displayNameProperty = $params[4];
		}
		$hierarchyBuilder = new HierarchyBuilder;
		$output = $hierarchyBuilder->hierarchyBreadcrumb($currentPage,
			$hierarchyPage, $hierarchyProperty, $displayNameProperty);
		$output = $parser->recursiveTagParse($output);
	}
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}

function renderHierarchy($input, $attributes, $parser, $frame) {
	$hierarchyBuilder = new HierarchyBuilder;
	$output = $hierarchyBuilder->renderHierarchy($input, $attributes, $parser,
		$frame);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}

class HierarchyBuilder {

	static protected $m_hierarchy_num = 1;

	public function hierarchyBreadcrumb($currentPage, $hierarchyPage,
		$hierarchyProperty, $displayNameProperty) {
		$xmlstr = self::getPropertyFromPage($hierarchyPage, $hierarchyProperty);
		try {
			$xml = @new SimpleXMLElement($xmlstr);
			$found = false;
			$previous = null;
			$parent = self::getParent($currentPage, $xml);
			foreach ($xml->xpath('//a') as $element) {
				if ($found) {
					return self::breadcrumb($previous, $parent, $element,
						$displayNameProperty);
				} else if ($currentPage == $element) {
					$found = true;
				} else {
					$previous = $element;
				}
			}
			return self::breadcrumb($previous, $parent, null, $displayNameProperty);
		} catch (Exception $e) {
			return "";
		}
	}

	private function getParent($page, $xml) {
		foreach ($xml->xpath('//li') as $element) {
			$parray = $element->xpath('a');
			if ($parray == false || count($parray) == 0) {
				return null;
			}
			$parent = (string) $parray[0];
			foreach ($element->xpath('ul/li/a') as $child) {
				if ($child == $page) {
					return $parent;
				}
			}
		}
		return null;
	}

	private function breadcrumb($previous, $parent, $next, $displayNameProperty) {
		$breadcrumb = "{| width='100%'" . PHP_EOL;
		if ($previous != null) {
			$breadcrumb .= "| width='33%' | &larr; [[" . $previous . "| " .
				HierarchyBuilder::getPageDisplayName($previous,
				$displayNameProperty) . "]]" . PHP_EOL;
		} else {
			$breadcrumb .= "| width='33%' | &nbsp;". PHP_EOL;
		}
		if ($parent != null) {
			$breadcrumb .= "| align='center' width='33%' | &uarr; [[" . $parent .
				"| " . HierarchyBuilder::getPageDisplayName($parent,
				$displayNameProperty) . "]]" . PHP_EOL;
		} else {
			$breadcrumb .= "| width='33%' | &nbsp;". PHP_EOL;
		}
		if ($next != null) {
			$breadcrumb .= "| align='right' width='33%' | [[" . $next . "|" .
				HierarchyBuilder::getPageDisplayName($next,
				$displayNameProperty) . "]] &rarr;" . PHP_EOL;
		} else {
			$breadcrumb .= "| width='33%' | &nbsp;". PHP_EOL;
		}
		$breadcrumb .= "|}" . PHP_EOL;
		return $breadcrumb;
	}

	public function renderHierarchy($input, $attributes, $parser, $frame) {
		//wikiLog("HierarchyBuilder", "renderHierarchy", "starting");

		$hierarchyName = "HierarchyDiv" . self::$m_hierarchy_num;
		self::$m_hierarchy_num++;

		if (isset($attributes["collapsed"])) {
			$collapsed = htmlspecialchars($attributes["collapsed"]);
			if ($collapsed === "collapsed") {
				$collapsed = "true";
			}
		} else	{
			$collapsed = "false";
		}

		if (isset($attributes["displaynameproperty"])) {
			$displayNameProperty =
				htmlspecialchars($attributes["displaynameproperty"]);
		} else	{
			$displayNameProperty = "";
		}

		//wikiLog("HierarchyBuilder", "renderHierarchy", "direct input: " . print_r($input, true));
		$input = $parser->recursiveTagParse($input, $frame); // this looks like it gets the property but it eats all the links.
		//wikiLog("HierarchyBuilder", "renderHierarchy", "tag-parsed input: " . print_r($input, true));
		$input = self::anchorLinkHolders($input);
		//wikiLog("HierarcyBuilder", "renderHierarchy", "Link corrected input: " . var_export($input, true));
		$input = $parser->replaceLinkHoldersText($input);
		//wikiLog("HierarchyBuilder", "renderHierarchy", "LinkReplaced input: " . var_export($input, true));
		$input = $parser->parse($input, $parser->getTitle(), $parser->Options(), TRUE, FALSE)->getText();
		//wikiLog("HierarchyBuilder", "renderHierarchy", "html converted input: " . print_r($input, true));
		//wikiLog("HierarchyBuilder", "renderHierarchy", "html converted input: " . print_r( $parser->parse($input, $parser->getTitle(), $parser->Options())->getText()  , true));

		$hierarchy = HierarchyBuilder::parseHierarchy($input,
			$displayNameProperty, $dummy,
			function ($pageName, $displayNameProperty, $data) {
				$pageLinkArray = array();
				$title = Title::newFromText($pageName);
				if ($title) {
					$pageLinkArray['href'] = $title->getLinkURL();
				}
				if (strlen($displayNameProperty) > 0) {
					$pageName = HierarchyBuilder::getPageDisplayName($pageName,
						$displayNameProperty);
				}
				return Html::element('a', $pageLinkArray, $pageName);
			});

		$parser->getOutput()->addModules('ext.HierarchyBuilder.render');

		$hierarchy = strtr($hierarchy, array('"' => "'"));
		//wikiLog("HierarchyBuilder", "renderHierarchy", "hierarchy = " . print_r($hierarchy, true));

		$script =<<<END
mw.loader.using(['ext.HierarchyBuilder.render'], function () {
	renderHierarchy("$hierarchyName", "$hierarchy", $collapsed);
});
END;

		global $wgOut;
		$script = Html::inlineScript($script);
		$wgOut->addScript($script);

		return Html::element('div', array('id' => $hierarchyName));
	}

	private function anchorLinkHolders($hierarchy) {
		$pattern = "#<!--LINK \d+:\d+-->#";
		$num_matches = preg_match_all($pattern, $hierarchy, $matches);
		if ($num_matches !== FALSE) {
			//wikiLog("HierarchyBuilder", "correctLinks", "found links the correct");
			foreach($matches[0] as $link) {
				//wikiLog("HierarchyBuilder", "correctLinks", "correcting link: " . var_export($link, true));
				$hierarchy = str_replace("$link", "<a>$link</a>", $hierarchy);
			}
		}
		//wikiLog("HierarchyBuilder", "correctLinks", "num_matches: " . $num_matches);
		//wikiLog("HierarchyBuilder", "correctLinks", "matches: " . var_export($matches, true));
		//wikiLog("HierarchyBuilder", "correctLinks", "input: " . var_export($hierarchy, true));
		return $hierarchy;
	}

	public static function parseHierarchy($input, $displayNameProperty, &$data,
		$callback) {
		$hierarchy = htmlspecialchars_decode($input);
		$newlines = array("\n", "\r");
		$hierarchy = str_replace($newlines, "", $hierarchy);
		$pattern = "/<a>([^<]*)<\/a>/i";
		$num_matches = preg_match_all($pattern, $hierarchy, $matches);
		if ($num_matches !== FALSE) {
			foreach ($matches[1] as $pageName) {
				$link = $callback(trim($pageName), $displayNameProperty, $data);
				$hierarchy = str_replace("<a>$pageName</a>", $link, $hierarchy);
			}
		}
		//wikiLog("HierarchyBuilder", "parseHierarchy", "eating newlines");
		return $hierarchy;
	}

	/**
	 * This is the titleIcon replacement version for the original (commented out below). 
	 * $page is a string containing the title of the page.
	 * I still need to format the output correctly.
	 */
	public function getPropertyFromPage($page, $property) { 
		//wikiLog("HierarchyBuilder", "getPropertyFromPage", "Started");
    	$store = smwfGetStore();
		$title = Title::newFromText($page);
		//wikiLog("HierarchyBuilder", "getPropertyFromPage", "Title: " . var_export($title, true));
    	$subject = SMWDIWikiPage::newFromTitle($title);
		//wikiLog("HierarchyBuilder", "getPropertyFromPage", "Subject: " . var_export($subject, true));
    	$data = $store->getSemanticData($subject);
		//wikiLog("HierarchyBuilder", "getPropertyFromPage", "Data: " . var_export($data, true));
    	$property = SMWDIProperty::newFromUserLabel($property);
		//wikiLog("HierarchyBuilder", "getPropertyFromPage", "Property: " . var_export($property, true));
    	$values = $data->getPropertyValues($property);
		//wikiLog("HierarchyBuilder", "getPropertyFromPage", "Values: " . var_export($values, true));
    	$strings = array();
    	foreach ($values as $value) {
    	    if ($value->getDIType() == SMWDataItem::TYPE_STRING ||
            	$value->getDIType() == SMWDataItem::TYPE_BLOB) {
            	$strings[] = trim($value->getString());
        	}
		}
		return $strings;
	}

	/*public function getPropertyFromPage($page, $property) { // $page is used to construct a title now
		wfErrorLog( "[HierarchyBuilder][getPropertyFromPage] " . $page ."\n", '/home/kji/hierarchyBuilder.log' );
		$params = array();
		$params[] = "[[$page]]";
		$params[] = "?$property";
		$params[] = "mainlabel=-";
		$params[] = "headers=hide";
		$params[] = "limit=1";
		$output = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI);
		return $output;
	}*/

	public function getPageDisplayName($page, $displayNameProperty) {
		if (strlen($displayNameProperty) == 0) {
			return $page;
		}
		//wikiLog("HierarchyBuilder", "getPageDisplayName", "about to call getPropertyFromPage()");
		$output = self::getPropertyFromPage($page, $displayNameProperty);
		if (strlen($output) > 0) {
			return $output;
		}
		return $page;
	}
}

class EditHierarchy extends SFFormInput {

	public function __construct($input_number, $cur_value, $input_name,
		$disabled, $other_args) {
		parent::__construct($input_number, $cur_value, $input_name, $disabled,
			$other_args);
		$this->addJsInitFunctionData('EditHierarchy_init',
			$this->setupJsInitAttribs());
	}

	public static function getName() {
		return 'hierarchy';
	}

	protected function setupJsInitAttribs() {

		if (array_key_exists('category', $this->mOtherArgs)) {
			$this->mCategory = $this->mOtherArgs['category'];
		} else {
			$this->mCategory = null;
		}


		//wikiLog("EditHierarchy", "setupJsInitAttribs", var_export($this, true));
		/*wikiLog("EditHierarchy", "setupJsInitAttribs", "mOtherArgs");
		foreach($this->mOtherArgs as $key => $value) {
			$value = var_export($value, true);
			wikiLog("EditHierarchy","setupJsInitAttribs",  $key . " => " . $value);
		}
		wikiLog("EditHierarchy", "setupJsInitAttribs", "Semantic Property Name = " . $this->mOtherArgs['semantic_property']);
		$title = Title::newFromText($this->mCategory);
		wikiLog("EditHierarchy", "setupJsInitAttribs", "title: " . $title);
		wikiLog("EditHierarchy", "setupJsInitAttribs", "Semantic Property Values = " . var_export($this->getPropertyValues($title, $this->mOtherArgs['semantic_property'])));	*/


		$params = array();
		$params[] = "[[Category:$this->mCategory]]";
		$params[] = "link=none";
		$params[] = "limit=1000";	
		
		$output = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI); // this cna wait for a another approach
// use the category object to get list of titles in category from which you can get names

		//wikiLog("EditHierarchy", "setupJsInitAttribs", var_export(explode(",", $output)));

		$pageArray = array_map('trim', explode(",", $output));

		//wikiLog("EditHierarchy", "setupJsInitAttribs", print_r($pageArray, true));

		if (array_key_exists('displaynameproperty', $this->mOtherArgs)) {
			$displayNameProperty = $this->mOtherArgs['displaynameproperty'];
		} else {
			$displayNameProperty = "";
		}

		$pages = array();
		foreach ($pageArray as $key => $value) {
			$pages[$value] =
				HierarchyBuilder::getPageDisplayName($value,
				$displayNameProperty);
		}

		//wikiLog("EditHierarchy", "setupJsInitAttribs", print_r($pages, true));
		// This loop will removed pages from the unselected pages list if we can find it in the hierarchy already.		
		foreach ($pages as $key => $value) {
			if (strpos("[[".$this->mCurrentValue."]]", $key) !== false) { 
				unset($pages[$key]);
			}
		}

		$hierarchy = $this->mCurrentValue; // I don't use the call below anymore because now we have wikiText, not HTML
		/*$hierarchy = HierarchyBuilder::parseHierarchy($this->mCurrentValue,
			$displayNameProperty, $pages,
			function ($pageName, $displayNameProperty, &$pages) {
				if (array_key_exists($pageName, $pages)) {
						unset($pages[$pageName]);
				}
				if (strlen($displayNameProperty) > 0) {
					$displayName = HierarchyBuilder::getPageDisplayName($pageName,
						$displayNameProperty);
				} else {
					$displayName = $pageName;
				}
				return Html::openElement('a') . $displayName .
					Html::element('span', array('style' => 'display:none'), $pageName) .
					Html::closeElement('a');
			});*/


		global $sfgFieldNum;
		$this->mDivId = "hierarchy_$sfgFieldNum";
		$this->mInputId = "input_$sfgFieldNum";
		$jsattribs = array(
			'div_id' => $this->mDivId,
			'hierarchy' => $hierarchy,
			'pages' => $pages,
			'is_disabled' => $this->mIsDisabled,
			'is_mandatory' => array_key_exists('mandatory', $this->mOtherArgs),
			'message' =>
				wfMessage('hierarchybuilder-editmessage', $this->mCategory)->text(),
			'hierarchyroot' =>
				wfMessage('hierarchybuilder-hierarchyroot')->text(),
			'unusedpages' =>
				wfMessage('hierarchybuilder-unusedpages')->text()
		);
		return json_encode($jsattribs);
	}

	public function getHtmlText() {

		if ($this->mCategory == null) {
			return Html::element('b', array(),
				wfMessage('hierarchybuilder-missing-category')->text());
		}

		return Html::element('input', array(
			'type' => 'hidden',
			'id' => $this->mInputId,
			'name' => $this->mInputName,
			'value' => $this->mCurrentValue)) .
			Html::element('div', array('id' => $this->mDivId));
	}

	public static function getParameters() {
		$params = parent::getParameters();
		$params['category'] = array(
			'name' => 'category',
			'type' => 'string',
			'description' =>
				wfMessage('hierarchybuilder-category-desc')->text()
		);
		$params['displaynameproperty'] = array(
			'name' => 'displaynameproperty',
			'type' => 'string',
			'description' =>
				wfMessage('hierarchybuilder-displaynameproperty-desc')->text()
		);
	}

	public function getResourceModuleNames() {
		return array(
			'ext.HierarchyBuilder.edit'
		);
	}
}

class SelectFromHierarchy extends SFFormInput {

	public function __construct($input_number, $cur_value, $input_name,
		$disabled, $other_args) {
		parent::__construct($input_number, $cur_value, $input_name, $disabled,
			$other_args);
		$this->addJsInitFunctionData('SelectFromHierarchy_init',
			$this->setupJsInitAttribs());
	}

	public static function getName() {
		return 'hierarchySelect';
	}

	protected function setupJsInitAttribs() {
		//wikiLog("SelectFromHierarchy", "setupJsInitAttribs", "starting");

		if (array_key_exists('pagename',$this->mOtherArgs)) {
			$this->mPageName = $this->mOtherArgs["pagename"];
		} else {
			$this->mPageName = null;
			return;
		}

		if (array_key_exists('propertyname',$this->mOtherArgs)) {
			$this->mPropertyName = $this->mOtherArgs["propertyname"];
		} else {
			$this->mPropertyName = null;
			return;
		}

		if (array_key_exists('collapsed',$this->mOtherArgs)) {
			$this->mCollapsed = $this->mOtherArgs["collapsed"];
			if ($this->mCollapsed !== "true" && $this->mCollapsed !== "false") {
				$this->mCollapsed = null;
				return;
			}
		} else {
			$this->mCollapsed = "false";
		}

		if (array_key_exists('displaynameproperty',$this->mOtherArgs)) {
			$displaynameproperty = $this->mOtherArgs["displaynameproperty"];
		} else {
			$displaynameproperty = "";
		}

		
		$params = array();
		$params[] = "[[$this->mPageName]]";
		$params[] = "?$this->mPropertyName";
		$params[] = "mainlabel=-";
		$params[] = "headers=hide";
		$params[] = "limit=1";
		$output = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI); // maybe also call getPropertyFromPage
		//$output = HierarchyBuilder::getPropertyFromPage($this->mPageName, $this->mPropertyName);

		//wikiLog("SelectFromHierarchy", "setupJsInitAttribs", "output: " . var_export($output, true));
		//wikiLog("SelectFromHierarchy", "setupJsInitAttribs", "mPageName: " . var_export($this->mPageName, true));
		//wikiLog("SelectFromHierarchy", "setupJsInitAttribs", "mPropertyName: " . var_export($this->mPropertyName, true));
		//wikiLog("SelectFromHierarchy", "setupJsInitAttribs", "mCurrentValue: " . var_export($this->mCurrentValue, true));

		//wikiLog("SelectFromHierarchy", "setupJsInitAttribs", print_r(trim($output), true));
		/*$hierarchy = HierarchyBuilder::parseHierarchy(trim($output),
			$displaynameproperty, $dummy,
			function ($pageName, $displayNameProperty, $data) {
				$title = Title::newFromText($pageName);
				$pageLinkArray = array();
				if ($title) {
					$pageLinkArray['href'] = $title->getLinkURL();
				}
				if (strlen($displayNameProperty) > 0) {
					$displayName =
						HierarchyBuilder::getPageDisplayName($pageName,
						$displayNameProperty);
				} else {
					$displayName = $pageName;
				}
				return Html::openElement('a', $pageLinkArray) . $displayName .
					Html::element('span', array('style' => 'display:none'),
					$pageName) .  Html::closeElement('a');
			});*/
		$hierarchy = str_replace("<br />", "\n", trim($output));

		//wikiLog("SelectFromHierarchy", "setupJsInitAttribs", "hierarchy = " . var_export($hierarchy, true));

		$selected_items = array_map('trim', explode(",", $this->mCurrentValue));

		global $sfgFieldNum;
		$this->mDivId = "hierarchy_$sfgFieldNum";
		$this->mInputId = "input_$sfgFieldNum";
		$jsattribs = array(
			'div_id' => $this->mDivId,
			'hierarchy' => $hierarchy,
			'selected_items' => $selected_items,
			'is_disabled' => $this->mIsDisabled,
			'is_mandatory' => array_key_exists('mandatory', $this->mOtherArgs),
			'collapsed' => $this->mCollapsed == "true" ? true : false
		);
		return json_encode($jsattribs);
	}

	public function getHtmlText() {

		if ($this->mPageName == null) {
			return Html::element('b', array(),
				wfMessage('hierarchybuilder-missing-page-name')->text());
		}

		if ($this->mPropertyName == null) {
			return Html::element('b', array(),
				wfMessage('hierarchybuilder-missing-property-name')->text());
		}

		if ($this->mCollapsed == null) {
			return Html::element('b', array(),
				wfMessage('hierarchybuilder-invalid-collapsed')->text());
		}

		return Html::element('input', array(
			'type' => 'hidden',
			'id' => $this->mInputId,
			'name' => $this->mInputName,
			'value' => $this->mCurrentValue)) .
			Html::element('div', array('id' => $this->mDivId));
	}

	public static function getParameters() {
		$params = parent::getParameters();
		$params['pagename'] = array(
			'name' => 'pagename',
			'type' => 'string',
			'description' =>
				wfMessage('hierarchybuilder-pagename-desc')->text()
		);
		$params['propertyname'] = array(
			'name' => 'propertyname',
			'type' => 'string',
			'description' =>
				wfMessage('hierarchybuilder-propertyname-desc')->text()
		);
		$params['collapsed'] = array(
			'name' => 'collapsed',
			'type' => 'string',
			'description' =>
				wfMessage('hierarchybuilder-collapsed-desc')->text()
		);
		$params['displaynameproperty'] = array(
			'name' => 'displaynameproperty',
			'type' => 'string',
			'description' =>
				wfMessage('hierarchybuilder-displaynameproperty-desc')->text()
		);
	}

	public function getResourceModuleNames() {
		return array(
			'ext.HierarchyBuilder.select'
		);
	}
}

/*function wikiLog($className, $methodName, $message) {
	wfErrorLog( "[".date("c")."]" . "[".$className."][".$methodName."] " . $message . "\n", '/home/kji/hierarchyBuilder.log' );
}*/

