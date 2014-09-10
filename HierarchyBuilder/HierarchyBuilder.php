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
	'version' => '1.8',
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
	$parser->setFunctionHook('sectionNumber', 'sectionNumber');
	$parser->setFunctionHook('parent', 'parent');
	$parser->setFunctionHook('children', 'children');
	$parser->setHook('hierarchy', 'renderHierarchy');
	global $sfgFormPrinter;
	$sfgFormPrinter->registerInputType('EditHierarchy');
	$sfgFormPrinter->registerInputType('SelectFromHierarchy');
	return true;
}

/**
 * This parser function will give the section number of a page in a hierarchy.
 * The three required arguments are (in order): 
 *   - Full page name
 *   - Full page name of the page containing the hierarchy
 *   - Property name of the property containing the hierarchy data
 */
function sectionNumber($parser) {
	//wikiLog('', 'getPageNumbering', "started");
	$params = func_get_args();
	if (count($params) != 4) {
		$output = "";
	} else {
		$pageName = $params[1];
		$hierarchyPageName = $params[2];
		$hierarchyPropertyName = $params[3];
		$output = HierarchyBuilder::getPageSectionNumber($pageName, $hierarchyPageName, $hierarchyPropertyName);
	}
	return $parser->insertStripItem($output, $parser->mStripState);
}

/**
 * This parser function will return a list of the immediate children of a given
 * page within a hierarchy on a page. The list of chilren will be delimited by
 * a specified character or the ',' character by default if no delimiter is given.
 */
function parent($parser) {
	$params = func_get_args();
	if (count($params) != 4) {
		$output = "";
	} else {
		$pageName = $params[1];
		$hierarchyPageName = $params[2];
		$hierarchyPropertyName = $params[3];
		$output = HierarchyBuilder::getPageParent($pageName, $hierarchyPageName, $hierarchyPropertyName);
		if ($output != "") {
			$output = "[[$output]]";
		}
		$output = $parser->recursiveTagParse($output);
	}
	return $parser->insertStripItem($output, $parser->mStripState);
}

/**
 * This parser function will return the immediate parent of a given page within
 * a hierarchy on a page.
 *
 * 3 unnamed mandatory args:
 *  - pagename
 *  - hierarchy page
 *  - hierarchy property
 *
 * 5 named optional args:
 *  - sep = 
 *  - template = 
 *  - introtemplate = 
 *  - outrotemplate = 
 *  - link = 
 *
 * Example of new invocation:
 * {{#children|pagename|hierarchy page|hierarchy property|sep=,|template=X|introtemplate=Y|outrotemplate=Z|link=none}}
 */
function children($parser) {
	$params = func_get_args();
	if (count($params) < 4) {
		$output = "";
	} else {
		$pageName = $params[1];
		$hierarchyPageName = $params[2];
		$hierarchyPropertyName = $params[3];

		$optional_params = array_slice($params, 4);
		$optional_params = parseParams($optional_params);
		$delimiter = ",";
		if (isset($optional_params[HierarchyBuilder::separator])) {
			$delimiter = $optional_params[HierarchyBuilder::separator] == "" ? "," : $optional_params[HierarchyBuilder::separator];
		}
		if (isset($optional_params[HierarchyBuilder::template])) {
			$template = $optional_params[HierarchyBuilder::template];
		}
		if (isset($optional_params[HierarchyBuilder::introtemplate])) {
			$introtemplate = $optional_params[HierarchyBuilder::introtemplate];
		}
		if (isset($optional_params[HierarchyBuilder::outrotemplate])) {
			$outrotemplate = $optional_params[HierarchyBuilder::outrotemplate];
		}
		if (isset($optional_params[HierarchyBuilder::link])) {
			$link = $optional_params[HierarchyBuilder::link];
		}

		wikiLog("","children","sep = $delimiter");
		wikiLog("","children","template = $template");
		wikiLog("","children","intro = $introtemplate");
		wikiLog("","children","outro = $outrotemplate");
		wikiLog("","children","link = $link");

		$children = HierarchyBuilder::getPageChildren($pageName, $hierarchyPageName, $hierarchyPropertyName);

		$output = "";
		if (count($children) > 0) {
			if (isset($template)) {
				$output = "{{{$introtemplate}}}"
					.implode(array_map(function($child) use ($template, $link) {
						if ($link == "none") {
							return "{{".$template."|$child}}";
						} else {
							return "{{".$template."|[[$child]]}}";
						}
					}, $children), "") 
					. "{{{$outrotemplate}}}";
			} else {
				$output = implode(array_map(function($child) use ($template, $link) {
					if ($link == "none") {
						return $child;
					} else {
						return "[[$child]]";
					}
				}, $children), $delimiter);
			}
		}

		//wikiLog("", "children", "output = $output");
		
		/*
		//apply the template to each of the children independently and concatenate them
		$command = implode(array_map(function($child) use ($template) {
			if ($link == "none") {
				return "{{".$template."|[[$child]]}}";
			} else {
				return "{{".$template."|$child}}";
			}
		}, $children), "");
		// if we have children then go ahead and apply the intro and outro templates
		if (count($children) > 0) {
			$command = "{{{$introtemplate}}}" . $command;
			$command = $command . "{{{$outrotemplate}}}";
		}
		wikiLog("", "children", "$command");

		$output = array_map(function($child) {
			if ($link == "none") {
				return "[[$child]]";
			} else {
				return $child;
			}
		}, $children);
		$output = implode($output, $delimiter);
		*/

		$output = $parser->recursiveTagParse($output);
	}	
	return $parser->insertStripItem($output, $parser->mStripState);
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

function parseParams($params) {
	$paramsArray = array();
	foreach($params as $param) {
		$paramsArray += parseParam($param);
	}
	return $paramsArray;
}

function parseParam($param) {
	$paramArray = array();
	$ret = preg_split('/=/', $param, 2);
	if (count($ret) > 1) {
		$paramArray[$ret[0]] = $ret[1];
	}
	return $paramArray;
}

class HierarchyBuilder {
	static protected $m_hierarchy_num = 1;

	const pageNamePattern = "/\[\[(.*)\]\]/"; // pattern to extract the pageName from a wikitext hierarchy row
	const depthPattern = "/^(\**)/"; // pattern to extract the leading *s to determine the current row's depth in the wikitext hierarchy.

	// constants for child parser function arg names
	const separator = "sep";
	const template = "template";
	const introtemplate = "introtemplate";
	const outrotemplate = "outrotemplate";
	const link = "link";

	/**
	 * $targetPageName is the name of the target page for which you want the 
	 *     auto-number in the given hierarchyPage returned.
	 * $hierarchyPageName is the name of the page containing the hierarchy from
	 *     which to retrieve numberings.
	 * $hierarchyPropertyName is the name of the property on the hierarchy page
	 *     which contains the hierarchy data. ex: Hierarchy Data.
	 *
	 * This function returns the section number of a target page within a hierarchy.
	 */
	public static function getPageSectionNumber($targetPageName, $hierarchyPageName, $hierarchyPropertyName) {
		$hierarchy = self::getPropertyFromPage($hierarchyPageName, $hierarchyPropertyName);
		$pageSectionNumber = HierarchyBuilder::getSectionNumberFromHierarchy($hierarchy, $targetPageName);
		return $pageSectionNumber;
	}

	/**
	 * $targetPageName is the name of the target page for which we want the list
	 *     of immediate children.
	 * $hierarchyPageName is the name of the page containing the hierarchy from
	 *     which to retrieve the list of children.
	 * $hierarchyPropertyName is the name of the property on the hierarchy page
	 *     which contains the hierarchy data. ex: Hierarchy Data.
	 *
	 * This function searches a specified hierarchy for the direct children of 
	 * a particular page. The search proceeds by searching the hierarchy top 
	 * down to find the target page, and then looping further to identify the 
	 * immediate children. Once the loop to find immediate children finds a row 
	 * which has depth less than or equal to the target then the search is 
	 * complete. If there are no immediate children in the hierarchy for the 
	 * specified target page, or if the target page is not included in the
	 * hierarchy at all, then this function returns an empty array. 
	 *
	 */
	/*public static function getPageChildren($targetPageName, $hierarchyPageName, $hierarchyPropertyName) {
		$hierarchy = HierarchyBuilder::getPropertyFromPage($hierarchyPageName, $hierarchyPropertyName);
		$pageChildren = HierarchyBuilder::getChildrenFromHierarchy($hierarchy, $targetPageName);
		return $pageChildren;
	}*/
	public static function getPageChildren($targetPageName, $hierarchyPageName, $hierarchyPropertyName) {
		$hierarchy = self::getPropertyFromPage($hierarchyPageName, $hierarchyPropertyName);
		$hierarchyRows = preg_split("/\n/", $hierarchy);

		$currentPagePattern = "/\[\[".$targetPageName."\]\]/";

		for ($i = 0; $i < sizeof($hierarchyRows); $i++) {
			$row = $hierarchyRows[$i]; // current row that we're looking at in the hierarchy
			$num_matches = preg_match_all($currentPagePattern, $row, $matches); // look to see if this row is the one with our page
			if ($num_matches > 0) { // found the current page on this row of the hierarchy
				$children = self::getChildren($hierarchyRows, $row, $i);
				return $children;
			}
		}

		return array();
	}

	/**
	 * $hierarchyRows is an array representation of a wikitext hierarchy where 
	 *     each row in the hierarchy is a separate element of the array.
	 * $row is a specific row of the hierarchy given by $hierarchyRows.
	 * $row_i is the index of $row in $hierarchyRows.
	 * 
	 * This function will find the immediate children of $row within $hierarchyRows
	 * and return the pageNames of those children. The immediate children are 
	 * defined to be any rows which come after $row with depth exactly equal to 
	 * one greater than the depth of $row AND which come before the first subsequent
	 * row with depth less than or equal to the depth of $row.
	 * 
	 * Note: If no immediate children of $row are found, then an empty array is
	 * returned instead of a list of children;
	 */
	private static function getChildren($hierarchyRows, $row, $row_i) {
		// figure out what the depth of the current page is. if we can't find any depth (leading *s) then set the depth to 0 indicating failure.
		$currentDepth = self::getDepthOfHierarchyRow($row);
		
		// figure out who the immediate children are based on depth being 1 more than the current depth
		$children = array();
		for ($child_i = $row_i+1; $child_i < count($hierarchyRows); $child_i++) { // run backwards through all the previous rows
			$childRow = $hierarchyRows[$child_i];
			$childDepth = self::getDepthOfHierarchyRow($childRow);

			if ($childDepth <= $currentDepth) { // if we've run out of rows that are deeper than the currentrow then it's impossible to find more direct children
				return $children;
			} elseif ($childDepth > $currentDepth+1) { // if the depth is more than 1 deeper than the current row then this is not an immediate child and we should continue searching
				continue;
			} else {
				array_push($children, self::getPageNameFromHierarchyRow($childRow));
			}
		}

		return $children;
	}

	/**
	 * $targetPageName is the name of the target page for which we want the
	 *     immediate parent in the hierarchy/
	 * $hierarchyPageName is the name of the page containing the hierarchy from
	 *     which to retrieve the immediate parent of the target page.
	 * $hierarchyPropertyName is the name of hte property on the hierarchy page
	 *     which contains the hierarhcy data. ex: HierarchyData.
	 *
	 * This function searches a specified hierarchy for the direct parent of a
	 * particular page. The search proceeds by searching the hierarchy top down
	 * to find the target page, and then looping back upwards to identify the 
	 * immediate parent. If there is no immediate parent in the hierarchy for
	 * the specified target page, or if the target page is not included in the
	 * hierarchy at all, then this function returns the empty string. 
	 */
	/*public static function getPageParent($targetPageName, $hierarchyPageName, $hierarchyPropertyName) {
		$hierarchy = HierarchyBuilder::getPropertyFromPage($hierarchyPageName, $hierarchyPropertyName);
		$pageParent = HierarchyBuilder::getParentFromHierarchy($hierarchy, $targetPageName);
		return $pageParent;
	}*/
	public static function getPageParent($targetPageName, $hierarchyPageName, $hierarchyPropertyName) {
		$hierarchy = self::getPropertyFromPage($hierarchyPageName, $hierarchyPropertyName);
		$hierarchyRows = preg_split("/\n/", $hierarchy);
		
		$currentPagePattern = "/\[\[".$targetPageName."\]\]/";
		// loop through the hierarchyRows looking for the row containing the currentPage
		for ($i = 0; $i < sizeof($hierarchyRows); $i++) {
			$row = $hierarchyRows[$i]; // current row that we're looking at in the hierarchy
			$num_matches = preg_match_all($currentPagePattern, $row, $matches); // look to see if this row is the one with our page
			if ($num_matches > 0) { // found the current page on this row of the hierarchy
				// get the parent of the current row in the hierarchy. Note that if there is no hierarchical parent, then the parent will be empty.
				$parent = self::getParent($hierarchyRows, $row, $i);
				return $parent;
			}
		}

		return "";
	}

	/**
	 * $currentPage is the name of the page in the hierarchy we're currently viewing
	 * $hierarchyPage is the name of the page that contains the hierarchy $currentPage belongs to
	 * $hierarchyProperty is the name of the property on $hierarchyPage that actually stores the wikitext formatted hierarchy
	 * $displayNameProperty is the value of the DislayName property (eg: "Description")
	 */
	public function hierarchyBreadcrumb($currentPage, $hierarchyPage,
		$hierarchyProperty, $displayNameProperty) {

		$hierarchy = self::getPropertyFromPage($hierarchyPage, $hierarchyProperty);
		$hierarchyRows = preg_split("/\n/", $hierarchy);
		
		$currentPagePattern = "/\[\[".$currentPage."\]\]/";
		// loop through the hierarchyRows looking for the row containing the currentPage
		for ($i = 0; $i < sizeof($hierarchyRows); $i++) {
			$row = $hierarchyRows[$i]; // current row that we're looking at in the hierarchy
			$num_matches = preg_match_all($currentPagePattern, $row, $matches); // look to see if this row is the one with our page
			if ($num_matches > 0) { // found the current page on this row of the hierarchy
				// go to the previous row and extract the page name if any previous row exists. Otherwise the previous page name is empty.
				$prev_i = $i-1;
				$previousRow = ($prev_i >= 0 ? $hierarchyRows[$prev_i] : "");
				$previous = self::getPageNameFromHierarchyRow($previousRow);

				// go to the next row and extract the page name if any next row exists. Otherwise the next page name is empty.
				$next_i = $i+1;
				$nextRow = ($next_i < sizeof($hierarchyRows) ? $hierarchyRows[$next_i] : "");
				$next = self::getPageNameFromHierarchyRow($nextRow);
				
				// get the parent of the current row in the hierarchy. Note that if there is no hierarchical parent, then the parent will be empty.
				$parent = self::getParent($hierarchyRows, $row, $i);

				return self::breadcrumb($previous, $parent, $next, $displayNameProperty);
			}
		}

		return "";
	}

	/**
	 * $hierarchyRows is an array representation of a wikitext hierarchy where 
	 *     each row in the hierarchy is a separate element of the array.
	 * $row is a specific row of the hierarchy given by $hierarchyRows.
	 * $row_i is the index of $row in $hierarchyRows.
	 * 
	 * This function will find the hierarchical parent of $row within $hierarchyRows
	 * and return the pageName of that parent. The hierarchical parent is defined
	 * to be the first row of $hierarchyRows which preceeds $row and has a depth
	 * that is equal to one less than the depth of $row. 
	 * 
	 * Note: If no hierarchical parent of $row is found, then the empty string 
	 * is returned;
	 */
	private function getParent($hierarchyRows, $row, $row_i) {
		// figure out what the depth of the current page is. if we can't find any depth (leading *s) then set the depth to 0 indicating failure.
		$currentDepth = self::getDepthOfHierarchyRow($row);
		
		// figure out who the parent is based on depth being 1 less than the current depth
		$parent = "";
		for ($parent_i = $row_i-1; $parent_i >= 0; $parent_i--) { // run backwards through all the previous rows
			$parentRow = $hierarchyRows[$parent_i];
			$parentDepth = self::getDepthOfHierarchyRow($parentRow);

			if ($parentDepth == $currentDepth-1) {
				$parent = self::getPageNameFromHierarchyRow($parentRow);
				break;
			}
		}

		return $parent;
	}

	/**
	 * $hierarchyRow is assumed to be a row of a hierarchy in wikitext format,
	 *     which is to say, leading *s and a page name within [[]] delimiters.
	 * 
	 * This function will return the first pageName (link) found within $hierarchyRow
	 */
	private function getPageNameFromHierarchyRow($hierarchyRow) {
		$num_matches = preg_match_all(self::pageNamePattern, $hierarchyRow, $matches);
		$pageName = ($num_matches > 0 ? $matches[1][0] : ""); // give me the first subpattern match to be the name of the previous page
		return $pageName;
	}

	/**
	 * $hierarchyRow is assumed to be a row of a hierarchy in wikitext format, 
	 *     which is to say, leading *s and a page name within [[]] delimiters.
	 *
	 * This function will return the number of leading *s as the depth of $hierarchyRow.
	 */
	private function getDepthOfHierarchyRow($hierarchyRow) {
		$num_matches = preg_match_all(self::depthPattern, $hierarchyRow, $matches);
		$depth = ($num_matches > 0 ? strlen($matches[1][0]) : 0);
		return $depth;
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

		if (isset($attributes["numbered"])) {
			$numbered = htmlspecialchars($attributes["numbered"]);
			if ($numbered === "numbered") {
				$numbered = "true";
			}
		} else {
			$numbered = "false";
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
	renderHierarchy("$hierarchyName", "$hierarchy", $collapsed, $numbered);
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
		//wikiLog("HierarchyBuilder", "getPropertyFromPage", "Data: " . print_r($data, true));
    	$property = SMWDIProperty::newFromUserLabel($property);
		//wikiLog("HierarchyBuilder", "getPropertyFromPage", "Property: " . var_export($property, true));
    	$values = $data->getPropertyValues($property);
		//wikiLog("HierarchyBuilder", "getPropertyFromPage", "Values: " . var_export($values, true));
    	$strings = array();
    	foreach ($values as $value) {
    		//wikiLog("HierarchyBuilder", "getPropertyFromPage", "value = ".print_r($value->getDIType(),true));
    	    if ($value->getDIType() == SMWDataItem::TYPE_STRING ||
            	$value->getDIType() == SMWDataItem::TYPE_BLOB) {
            	//$strings[] = trim($value->getString());
            	//wikiLog("HierarchyBuilder", "getPropertyFromPage", "value->getString() = ".print_r(trim($value->getString()),true));
            	return trim($value->getString());
        	}
		}
		//return $strings;
		return "";
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

	/**
	 * $hierarchy is a wikitext formatted hierarchy
	 *
	 * This function will search through the hierarchy to find all the page names
	 * (defined by [[]] syntax) and return them as an array without [[]] syntax.
	 *
	 * This function will return an array of all the page names found, otherwise
	 * an empty array will be returned when no page names are found.
	 */
	public static function collectPageNamesFromHierarchy($hierarchy) {
		// use a regex to find all of the page names
		$numMatches = preg_match_all(HierarchyBuilder::pageNamePattern, $hierarchy, $matches);
		return ($numMatches > 0 ? $matches[1] : array());
	}

	/**
	 * $hierarchy is a wikitext formatted hierarchy
	 * $displayNameProperty is the name of the property containing the display name
	 *
	 * This function will run through the hierarchy and for each pageName link
	 * found, it will find the displayName for that pageName, and then update
	 * the link syntax so that the displayName will be shown instead.
	 * 
	 * ex: [[pageName]] -> [[pageName | displayName]]
	 */
	public static function updateHierarchyWithDisplayNames($hierarchy, $displayNameProperty) {
		$hierarchyPageNames = self::collectPageNamesFromHierarchy($hierarchy);
		foreach ($hierarchyPageNames as $pageName) {
			$displayName = self::getPageDisplayName($pageName, $displayNameProperty);
			$pageNameLink = "[[".$pageName."]]";
			$displayNameLink = "[[".$pageName." | ".$displayName."]]";
			$hierarchy = str_replace($pageNameLink, $displayNameLink, $hierarchy);
		}
		return $hierarchy;
	}

	/**
	 * $hierarchyRoot is the root row of the hierarchy.
	 * $wikiTextHierarchy is a string containing the hierarchy in wikitext.
	 * $target is a string containing the page name of a page for which we
	 *     require the section number.
	 *
	 * This function will search a hierarchy for a target page name and will 
	 * return the section number for the row which contains that page. The 
	 * target is a simple page name and the requirement is that a matching row 
	 * must consist only of a single link to the target page. (eg: [[$target]]) 
	 * We do not yet support non-page rows.
	 */
	public static function getSectionNumberFromHierarchy($wikiTextHierarchy, $target) {
		$sectionNumber = self::getSectionNumberFromHierarchyHelper("[[hierarchy_root]]" . "\n" . $wikiTextHierarchy, "", "", $target);
		return $sectionNumber;
	}
	
	/**
	 * $wikiTextHierarchy is a string containing the hierarchy in wikitext.
	 * $depth is a string containing the number of stars equal to the current 
	 *     depth in the hierarchy.
	 * $sectionNumber is the section number of the root of the current subhierarchy.
	 * $target is the string page name of the page we're searching the hierarchy for.
	 *
	 * This function will recursively traverse the given hierarchy/subhierarchy
	 * and search for the given target row. The target is a simple page name and
	 * the requirement is that a matching row must consist only of a single link
	 * to the target page. (eg: [[$target]]) We do not yet support non-page rows.
	 */
	private static function getSectionNumberFromHierarchyHelper($wikiTextHierarchy, $depth, $sectionNumber, $target){
		$rootAndChildren = HierarchyBuilder::splitHierarchy($wikiTextHierarchy, $depth);
		$root = $rootAndChildren[0]; // this is just the root row of this hierarchy (or subhierarchy)
		$children = array_slice($rootAndChildren, 1); // this is a list of direct children hierarchies of the root. It might be an empty list though

		$rootPageName = HierarchyBuilder::getPageNameFromHierarchyRow($root, false);
		//$rootDisplayName = HierarchyBuilder::getPageDisplayName($rootPageName, $displayNameProperty);

		// if we are staring at the target then return the current section number for the target
		if ($rootPageName == $target) {
			return $sectionNumber;
		}

		// if there are children, then recurse on each one searching for the target
		if (count($children) > 0) {
			$numberSuffix = 1;
			foreach($children as $child) {
				$childNumber = $sectionNumber == "" ? $numberSuffix++ : $sectionNumber . "." . $numberSuffix++;
				$targetNumber = self::getSectionNumberFromHierarchyHelper($child, $depth."*", $childNumber, $target);
				// if we find the target in this child branch then we can return the target section number
				if ($targetNumber != "") {
					return $targetNumber;
				}
			}
		}
		
		// if we can't find the target then we can't find the target then return an empty section number
		return "";
	}

	/**
	 * $hierarchyRoot is the root of the hierarchy
	 * $wikiTextHierarchy is the wikitext formatted hierarchy.
	 * $target is the page name of the page for which we require the parent.
	 *
	 * This function will search the hierarchy for the row which has a direct 
	 * child that is equal to $target. The target is a simple page name and the
	 * requirement is that a matching row must consist only of a single link to
	 * the target page. (eg: [[$target]]) We do not yet support non-page rows.
	 * If the target is not contained in the hierarchy OR the target is already
	 * root level in the hierarchy, then we return the empty string.
	 */
	/*public static function getParentFromHierarchy($wikiTextHierarchy, $target) {
		$parent = HierarchyBuilder::getParentFromHierarchyHelper("[[hierarchy_root]]" . "\n" . $wikiTextHierarchy, "", $target);
		$parent = $parent == "hierarchy_root" ? "" : $parent;
		return $parent;
	}*/

	/**
	 * $wikiTextHierarchy is the wikitext formatted hierarchy.
	 * $depth is the current depth within the hierarchy.
	 * $target is the page name of the page for which we require the parent.
	 * 
	 * This function will recursively search the hierarchy for the row that has
	 * a direct child that is equal to $target. The target is a simple page name
	 * and the requirement is that a matching row must consist only of a single 
	 * link to the target page. (eg: [[$target]]) We do not yet support non-page
	 * rows. If we cannot find a row with a direct child equal to $target, then
	 * we return an empty string.
	 *
	 * Note: This recursive search is not very efficient. We need to come back
	 * to this function to optimize it, particularly with regard to it's use of
	 * regex and children loops.
	 */
	/*private static function getParentFromHierarchyHelper($wikiTextHierarchy, $depth, $target) {
		$rootAndChildren = HierarchyBuilder::splitHierarchy($wikiTextHierarchy, $depth);
		$root = $rootAndChildren[0];
		$children = array_slice($rootAndChildren, 1);

		if (count($children) > 0) {
			foreach($children as $child) {
				$childRootAndChildren = HierarchyBuilder::splitHierarchy($child, $depth."*");
				$childRoot = $childRootAndChildren[0];
				$childRootPageName = HierarchyBuilder::getPageNameFromHierarchyRow($childRoot, false);
				if ($childRootPageName == $target) {
					$rootPageName = HierarchyBuilder::getPageNameFromHierarchyRow($root, false);
					return $rootPageName;
				}
			}

			foreach($children as $child) {
				$targetParent = HierarchyBuilder::getParentFromHierarchyHelper($child, $depth."*", $target);
				if ($targetParent != "") {
					return $targetParent;
				}
			}
		}

		// if we can't find the target's parent then we return an empty string.
		return "";		
	}*/

	/**
	 * $wikiTextHierarchy is the wikitext formatted hierarchy.
	 * $target is the page name of the page for which we want the direct children.
	 *
	 * This function will search through the hierarchy and return a list of the
	 * direct children of the row that equals $target. The target is a simple 
	 * page name and the requirement is that a matching row must consist only of
	 * a single link to the target page. (eg: [[$target]]) We do not yet support 
	 * non-page rows. If we cannot find a row with a direct child equal to $target,
	 * then we return an empty array.
	 */
	/*public static function getChildrenFromHierarchy($wikiTextHierarchy, $target) {
		$children = HierarchyBuilder::getChildrenFromHierarchyHelper("[[hierarchy_root]]" . "\n" . $wikiTextHierarchy, "", $target);
		return $children;
	}*/

	/**
	 * $wikiTextHierarchy is the wikitext formatted hierarchy.
	 * $depth is the current depth within the hierarchy.
	 * $target is the page name of the page for which we want the direct children.
	 *
	 * This function will recursively search through the hierarchy and return a
	 * list of the direct children of the $target. The target is a simple page 
	 * name and the requirement is that a matching row must consist only of a 
	 * single link to the target page. (eg: [[$target]]) We do not yet support 
	 * non-page rows. If we cannot find a row with a direct child equal to 
	 * $target, then we return an empty array.
	 */
	/*private static function getChildrenFromHierarchyHelper($wikiTextHierarchy, $depth, $target) {
		$rootAndChildren = HierarchyBuilder::splitHierarchy($wikiTextHierarchy, $depth);
		$root = $rootAndChildren[0];
		$children = array_slice($rootAndChildren, 1);

		$rootPageName = HierarchyBuilder::getPageNameFromHierarchyRow($root, false);
		
		if ($rootPageName == $target) {
			$childrenList = array();
			foreach($children as $child) {
				$childRootAndChildren = HierarchyBuilder::splitHierarchy($child, $depth."*");
				$childRoot = $childRootAndChildren[0];
				$childRootPageName = HierarchyBuilder::getPageNameFromHierarchyRow($childRoot, false);
				array_push($childrenList, $childRootPageName);
			}
			return $childrenList;
		} else {
			foreach ($children as $child) {
				$childrenList = HierarchyBuilder::getChildrenFromHierarchyHelper($child, $depth."*", $target);
				if (count($childrenList) > 0) {
					return $childrenList;
				}
			}
		}

		return array();
	}*/

	/**
	 * $wikiTextHierarchy is the hierarchy that we want to split into root, and
	 *     the root's child subhierarchies.
	 * $depth is the current depth of the hierarchy root. It can be interpreted 
	 *     as the depth of the root of the $wikiTextHierarchy root when viewed 
	 *     as a subhierarchy within another hierarchy.
	 *
	 * This function takes a hierarchy and splits it into the root, and each of
	 * of the root's child subhierarchies. These are returned as an array with
	 * the root first and each of the root's child subhierarchies in order.  
	 */
	private static function splitHierarchy($wikiTextHierarchy, $depth) {
		$nextDepth = "\n" . $depth . "*";
		$r1 = "/\*/"; // this guy finds * characters
		$regex = preg_replace($r1, "\\*", $nextDepth) . "(?!\\*)"; // this is building the regex that will be used later
		$regex = "/" . $regex . "/"; 
		// actually split the hierarchy into root and children
		$rootAndChildren = preg_split($regex, $wikiTextHierarchy);
		
		return $rootAndChildren;
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
		/*//wikiLog("EditHierarchy", "setupJsInitAttribs", "mOtherArgs");
		foreach($this->mOtherArgs as $key => $value) {
			$value = var_export($value, true);
			//wikiLog("EditHierarchy","setupJsInitAttribs",  $key . " => " . $value);
		}
		//wikiLog("EditHierarchy", "setupJsInitAttribs", "Semantic Property Name = " . $this->mOtherArgs['semantic_property']);
		$title = Title::newFromText($this->mCategory);
		//wikiLog("EditHierarchy", "setupJsInitAttribs", "title: " . $title);
		//wikiLog("EditHierarchy", "setupJsInitAttribs", "Semantic Property Values = " . var_export($this->getPropertyValues($title, $this->mOtherArgs['semantic_property'])));	*/


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

		$hierarchy = HierarchyBuilder::updateHierarchyWithDisplayNames($hierarchy, $displayNameProperty);
		//wikiLog("EditHierarchy", "setupJsInitAttribs", "updatedHierarchy = " . str_replace("'", "", $hierarchy));

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

		
		/*$params = array();
		$params[] = "[[$this->mPageName]]";
		$params[] = "?$this->mPropertyName";
		$params[] = "mainlabel=-";
		$params[] = "headers=hide";
		$params[] = "limit=1";
		$output = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI); // maybe also call getPropertyFromPage*/
		$hierarchy = HierarchyBuilder::getPropertyFromPage($this->mPageName, $this->mPropertyName);
		$hierarchy = HierarchyBuilder::updateHierarchyWithDisplayNames($hierarchy, $displaynameproperty);
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
		//$hierarchy = str_replace("<br />", "\n", trim($output));

		//wikiLog("SelectFromHierarchy", "setupJsInitAttribs", "hierarchy = " . print_r($hierarchy, true));

		$selected_items = array_map('trim', explode(",", $this->mCurrentValue));

		//wikiLog("SelectFromHierarchy", "setupJsInitAttribs", "selected_items = " . print_r($selected_items, true));

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

		//wikiLog("SelectFromHierarchy", "setupJsInitAttribs", "jsonencode = ".print_r(json_encode($jsattribs), true));

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

function wikiLog($className, $methodName, $message) {
	wfErrorLog( "[".date("c")."]" . "[".$className."][".$methodName."] " . $message . "\n", '/home/kji/hierarchyBuilder.log' );
}
