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

if ( !defined( 'MEDIAWIKI' ) ) {
	die( '<b>Error:</b> This file is part of a MediaWiki extension and cannot' .
		' be run standalone.' );
}

if ( version_compare( $wgVersion, '1.21', 'lt' ) ) {
	die( '<b>Error:</b> This version of HierarchyBuilder is only compatible ' .
		'with MediaWiki 1.21 or above.' );
}

if ( !defined( 'SF_VERSION' ) ) {
	die( '<b>Error:</b> HierarchyBuilder is a Semantic Forms extension so must' .
		' be included after Semantic Forms.' );
}

if ( version_compare( SF_VERSION, '2.5.2', 'lt' ) ) {
	die( '<b>Error:</b> This version of HierarchyBuilder is only compatible with' .
		' Semantic Forms 2.5.2 or above.' );
}

# credits
$wgExtensionCredits['parserhook'][] = array (
	'name' => 'HierarchyBuilder',
	'version' => '1.9',
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

function efHierarchyBuilderSetup ( & $parser ) {
	$parser->setFunctionHook( 'hierarchyBreadcrumb', 'hierarchyBreadcrumb' );
	$parser->setFunctionHook( 'sectionNumber', 'sectionNumber' );
	$parser->setFunctionHook( 'parent', 'parent' );
	$parser->setFunctionHook( 'children', 'children' );
	$parser->setHook( 'hierarchy', 'renderHierarchy' );
	global $sfgFormPrinter;
	$sfgFormPrinter->registerInputType( 'EditHierarchy' );
	$sfgFormPrinter->registerInputType( 'SelectFromHierarchy' );
	return true;
}

/**
 * This parser function will give the section number of a page in a hierarchy.
 * The three required arguments are (in order):
 *   - Full page name
 *   - Full page name of the page containing the hierarchy
 *   - Property name of the property containing the hierarchy data
 */
function sectionNumber( $parser ) {
	// wikiLog('', 'getPageNumbering', "started");
	$params = func_get_args();
	if ( count( $params ) != 4 ) {
		$output = "";
	} else {
		$pageName = $params[1];
		$hierarchyPageName = $params[2];
		$hierarchyPropertyName = $params[3];
		$output = HierarchyBuilder::getPageSectionNumber(
			$pageName,
			$hierarchyPageName,
			$hierarchyPropertyName
		);
	}
	return $parser->insertStripItem( $output, $parser->mStripState );
}

/**
 * This parser function will return a list of the immediate children of a given
 * page within a hierarchy on a page. The list of chilren will be delimited by
 * a specified character or the ',' character by default if no delimiter is given.
 *
 * 3 unnamed mandatory args:
 *  - pagename
 *  - hierarchy page
 *  - hierarchy property
 *
 * 1 named optional arg:
 *  - link = [none]
 *
 * Example invokations:
 * {{#parent:{{FULLPAGENAME}}|hierarchy page name|hierarchy property}}
 * {{#parent:{{FULLPAGENAME}}|hierarchy page name|hierarchy property|link=none}}
 */
function parent( $parser ) {
	$params = func_get_args();
	if ( count( $params ) < 4 ) {
		$output = "";
	} else {
		// mandatory args
		$pageName = $params[1];
		$hierarchyPageName = $params[2];
		$hierarchyPropertyName = $params[3];
		// optional args (just link=none)
		$optional_params = array_slice( $params, 4 );
		$optional_params = parseParams( $optional_params );
		if ( isset( $optional_params[HierarchyBuilder::LINK] ) ) {
			$link = $optional_params[HierarchyBuilder::LINK];
		} else {
			$link = "";
		}

		// find the parent
		$parent = HierarchyBuilder::getPageParent( $pageName, $hierarchyPageName,
			$hierarchyPropertyName );

		// format the parent for return according to the optional arg
		if ( $parent != "" ) {
			$parent = $link == "none" ? $parent : "[[$parent]]";
		}

		$output = $parser->recursiveTagParse( $parent );
	}
	return $parser->insertStripItem( $output, $parser->mStripState );
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
 *  - sep = [, | ; | ... ]
 *  - template = any template taking a single param
 *  - introtemplate = any template with no params
 *  - outrotemplate = any tempalte with no params
 *  - link = [none]
 *
 * Example invokations:
 *  - {{#children:{{FULLPAGENAME}}|hierarchy page|hierarchy property}}
 *  - {{#children:{{FULLPAGENAME}}|hierarchy page|hierarchy property|sep=,}}
 *  - {{#children:{{FULLPAGENAME}}|hierarchy page|hierarchy property|sep=,|link=none}}
 *  - {{#children:{{FULLPAGENAME}}|hierarchy page|hierarchy property|sep=,|template=X|link=none}}
 *  - {{#children:{{FULLPAGENAME}}|hierarchy page|hierarchy property|sep=,|template=X|
 *    introtemplate=Y|outrotemplate=Z|link=none}}
 */
function children( $parser ) {
	$params = func_get_args();
	if ( count( $params ) < 4 ) {
		$output = "";
	} else {
		// mandatory arguments
		$pageName = $params[1];
		$hierarchyPageName = $params[2];
		$hierarchyPropertyName = $params[3];

		// look for all the optional args in any order. We really don't care if
		// the right combination of optional parameters appears at this point.
		// The logic for handling different parameter combinations will happen 
		// after pulling children when we attempt to return results.
		$optional_params = array_slice( $params, 4 );
		$optional_params = parseParams( $optional_params );
		// look for the template parameter
		if ( isset( $optional_params[HierarchyBuilder::TEMPLATE] ) ) {
			$template = $optional_params[HierarchyBuilder::TEMPLATE];
		} else {
			$template = "";
		}
		// look for the introtemplate parameter
		if ( isset( $optional_params[HierarchyBuilder::OUTROTEMPLATE] ) ) {
			$introTemplate = $optional_params[HierarchyBuilder::INTROTEMPLATE];
		} else {
			$introTemplate = "";
		}
		// look for the outrotemplate parameter
		if ( isset( $optional_params[HierarchyBuilder::OUTROTEMPLATE] ) ) {
			$outroTemplate = $optional_params[HierarchyBuilder::OUTROTEMPLATE];
		} else {
			$outroTemplate = "";
		}
		// look for the link parameter
		if ( isset( $optional_params[HierarchyBuilder::LINK] ) ) {
			$link = $optional_params[HierarchyBuilder::LINK];
		} else {
			$link = "";
		}
		// look for the delimiter parameter
		if ( isset( $optional_params[HierarchyBuilder::SEPARATOR] ) ) {
			$delimiter = $optional_params[HierarchyBuilder::SEPARATOR];
		} else {
			if ( $template != "" ) {
				$delimiter = "";
			} else {
				$delimiter = ",";
			}
		}

		// find the page children
		$children = HierarchyBuilder::getPageChildren( $pageName, $hierarchyPageName,
			$hierarchyPropertyName );

		// format the output according to the optional params
		$output = "";
		if ( count( $children ) > 0 ) {
			if ( $template != "" ) {
				$intro = $introTemplate != "" ? "{{{$introTemplate}}}\n" : "";
				$outro = $outroTemplate != "" ? "\n{{{$outroTemplate}}}" : "";
				$templateChildrenString = implode(
					array_map(
						function( $child ) use ( $template, $link ) {
							if ( $link == "none" ) {
								return "{{" . $template . "|$child}}";
							} else {
								return "{{" . $template . "|[[$child]]}}";
							}
							//return $link == "none"
							//	? "{{" . $template . "|$child}}"
							//	: "{{" . $template . "|[[$child]]}}";
						},
						$children
					),
					"$delimiter\n"
				);

				$output = $intro . $templateChildrenString . $outro;
			} else {
				$childrenString = implode(
					array_map(
						function( $child ) use ( $link ) {
							return $link == "none" ? $child : "[[$child]]";
						},
						$children
					),
					$delimiter
				);

				$output = $childrenString;
			}
		}

		$output = $parser->recursiveTagParse( $output );
	}
	return $parser->insertStripItem( $output, $parser->mStripState );
}

function hierarchyBreadcrumb( $parser ) {
	$params = func_get_args();
	if ( count( $params ) < 4 ) {
		$output = "";
	} else {
		// $parser is always $params[0]
		$currentPage = $params[1];
		$hierarchyPage = $params[2];
		$hierarchyProperty = $params[3];
		if ( count( $params ) < 5 ) {
			$displayNameProperty = null;
		} else {
			$displayNameProperty = $params[4];
		}

		$hierarchyBuilder = new HierarchyBuilder;
		$output = $hierarchyBuilder->hierarchyBreadcrumb( $currentPage,
			$hierarchyPage, $hierarchyProperty, $displayNameProperty );
		$output = $parser->recursiveTagParse( $output );
	}
	$parser->disableCache();
	return array( $parser->insertStripItem( $output, $parser->mStripState ),
		'noparse' => false );
}

function renderHierarchy( $input, $attributes, $parser, $frame ) {
	$hierarchyBuilder = new HierarchyBuilder;
	$output = $hierarchyBuilder->renderHierarchy( $input, $attributes, $parser,
		$frame );
	$parser->disableCache();
	return array( $parser->insertStripItem( $output, $parser->mStripState ),
		'noparse' => false );
}

function parseParams( $params ) {
	$paramsArray = array();
	foreach ( $params as $param ) {
		$paramsArray += parseParam( $param );
	}
	return $paramsArray;
}

function parseParam( $param ) {
	$paramArray = array();
	$ret = preg_split( '/=/', $param, 2 );
	if ( count( $ret ) > 1 ) {
		$paramArray[$ret[0]] = $ret[1];
	}
	return $paramArray;
}

class HierarchyBuilder {
	static protected $m_hierarchy_num = 1;

	// pattern to extract the pageName from a wikitext hierarchy row
	const PAGENAMEPATTERN = "/\[\[(.*)\]\]/";
	// pattern to extract the leading *s to determine the current row's depth
	// in the wikitext hierarchy.
	const DEPTHPATTERN = "/^(\**)/";

	// constants for child parser function arg names
	const SEPARATOR = "sep";
	const TEMPLATE = "template";
	const INTROTEMPLATE = "introtemplate";
	const OUTROTEMPLATE = "outrotemplate";
	const LINK = "link";

	/**
	 * $targetPageName is the name of the target page for which you want the
	 *	 auto-number in the given hierarchyPage returned.
	 * $hierarchyPageName is the name of the page containing the hierarchy from
	 *	 which to retrieve numberings.
	 * $hierarchyPropertyName is the name of the property on the hierarchy page
	 *	 which contains the hierarchy data. ex: Hierarchy Data.
	 *
	 * This function returns the section number of a target page within a hierarchy.
	 */
	public static function getPageSectionNumber(
		$targetPageName,
		$hierarchyPageName,
		$hierarchyPropertyName
	) {
		$hierarchy = self::getPropertyFromPage( $hierarchyPageName, $hierarchyPropertyName );
		$pageSectionNumber = HierarchyBuilder::getSectionNumberFromHierarchy( $hierarchy,
			$targetPageName );
		return $pageSectionNumber;
	}

	/**
	 * $targetPageName is the name of the target page for which we want the list
	 *	 of immediate children.
	 * $hierarchyPageName is the name of the page containing the hierarchy from
	 *	 which to retrieve the list of children.
	 * $hierarchyPropertyName is the name of the property on the hierarchy page
	 *	 which contains the hierarchy data. ex: Hierarchy Data.
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
	public static function getPageChildren( $targetPageName, $hierarchyPageName,
		$hierarchyPropertyName
	) {
		$hierarchy = self::getPropertyFromPage( $hierarchyPageName, $hierarchyPropertyName );
		$hierarchyRows = preg_split( "/\n/", $hierarchy );

		$currentPagePattern = "/\[\[" . $targetPageName . "\]\]/";

		$hierarchyRowsSize = count( $hierarchyRows );
		for ( $i = 0; $i < $hierarchyRowsSize; $i++ ) {
			$row = $hierarchyRows[$i]; // current row that we're looking at in the hierarchy
			// look to see if this row is the one with our page
			$num_matches = preg_match_all( $currentPagePattern, $row, $matches );
			if ( $num_matches > 0 ) { // found the current page on this row of the hierarchy
				$children = self::getChildren( $hierarchyRows, $row, $i );
				return $children;
			}
		}

		return array();
	}

	/**
	 * $hierarchyRows is an array representation of a wikitext hierarchy where
	 *	 each row in the hierarchy is a separate element of the array.
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
	private static function getChildren( $hierarchyRows, $row, $row_i ) {
		// figure out what the depth of the current page is. if we can't find
		// any depth (leading *s) then set the depth to 0 indicating failure.
		$currentDepth = self::getDepthOfHierarchyRow( $row );

		// figure out who the immediate children are based on depth being 1 more
		// than the current depth
		$children = array();
		// run backwards through all the previous rows
		$hierarchyRowsSize = count( $hierarchyRows );
		for ( $child_i = $row_i + 1; $child_i < $hierarchyRowsSize; $child_i++ ) {
			$childRow = $hierarchyRows[$child_i];
			$childDepth = self::getDepthOfHierarchyRow( $childRow );

			if ( $childDepth <= $currentDepth ) {
				// if we've run out of rows that are deeper than the currentrow
				// then it's impossible to find more direct children
				return $children;
			} elseif ( $childDepth > $currentDepth + 1 ) {
				// if the depth is more than 1 deeper than the current row then
				// this is not an immediate child and we should continue searching
				continue;
			} else {
				array_push( $children, self::getPageNameFromHierarchyRow( $childRow ) );
			}
		}

		return $children;
	}

	/**
	 * $targetPageName is the name of the target page for which we want the
	 *	 immediate parent in the hierarchy/
	 * $hierarchyPageName is the name of the page containing the hierarchy from
	 *	 which to retrieve the immediate parent of the target page.
	 * $hierarchyPropertyName is the name of hte property on the hierarchy page
	 *	 which contains the hierarhcy data. ex: HierarchyData.
	 *
	 * This function searches a specified hierarchy for the direct parent of a
	 * particular page. The search proceeds by searching the hierarchy top down
	 * to find the target page, and then looping back upwards to identify the
	 * immediate parent. If there is no immediate parent in the hierarchy for
	 * the specified target page, or if the target page is not included in the
	 * hierarchy at all, then this function returns the empty string.
	 */

	public static function getPageParent( $targetPageName, $hierarchyPageName,
		$hierarchyPropertyName
	) {
		$hierarchy = self::getPropertyFromPage( $hierarchyPageName, $hierarchyPropertyName );
		$hierarchyRows = preg_split( "/\n/", $hierarchy );

		$currentPagePattern = "/\[\[" . $targetPageName . "\]\]/";
		// loop through the hierarchyRows looking for the row containing the currentPage
		$hierarchyRowsSize = count( $hierarchyRows );
		for ( $i = 0; $i < $hierarchyRowsSize; $i++ ) {
			$row = $hierarchyRows[$i]; // current row that we're looking at in the hierarchy
			// look to see if this row is the one with our page
			$num_matches = preg_match_all( $currentPagePattern, $row, $matches );
			if ( $num_matches > 0 ) { // found the current page on this row of the hierarchy
				// Get the parent of the current row in the hierarchy.
				// Note that if there is no hierarchical parent, then the parent
				// will be empty.
				$parent = self::getParent( $hierarchyRows, $row, $i );
				return $parent;
			}
		}

		return "";
	}

	/**
	 * $currentPage is the name of the page in the hierarchy we're currently viewing
	 * $hierarchyPage is the name of the page that contains the hierarchy $currentPage belongs to
	 * $hierarchyProperty is the name of the property on $hierarchyPage that actually stores the 
	 *  wikitext formatted hierarchy
	 * $displayNameProperty is the value of the DislayName property (eg: "Description")
	 */
	public function hierarchyBreadcrumb( $currentPage, $hierarchyPage,
		$hierarchyProperty, $displayNameProperty ) {

		$hierarchy = self::getPropertyFromPage( $hierarchyPage, $hierarchyProperty );
		$hierarchyRows = preg_split( "/\n/", $hierarchy );

		$currentPagePattern = "/\[\[" . $currentPage . "\]\]/";
		// loop through the hierarchyRows looking for the row containing the currentPage
		$hierarchyRowsSize = count( $hierarchyRows );
		for ( $i = 0; $i < $hierarchyRowsSize; $i++ ) {
			// current row that we're looking at in the hierarchy
			$row = $hierarchyRows[$i];
			// look to see if this row is the one with our page
			$num_matches = preg_match_all( $currentPagePattern, $row, $matches );
			if ( $num_matches > 0 ) { // found the current page on this row of the hierarchy
				// go to the previous row and extract the page name if any
				// previous row exists. Otherwise the previous page name is empty.
				$prev_i = $i -1;
				$previousRow = ( $prev_i >= 0 ? $hierarchyRows[$prev_i] : "" );
				$previous = self::getPageNameFromHierarchyRow( $previousRow );

				// go to the next row and extract the page name if any next row
				// exists. Otherwise the next page name is empty.
				$next_i = $i + 1;
				$nextRow = ( $next_i < count( $hierarchyRows ) ? $hierarchyRows[$next_i] : "" );
				$next = self::getPageNameFromHierarchyRow( $nextRow );

				// get the parent of the current row in the hierarchy.
				// Note that if there is no hierarchical parent, then the parent will be empty.
				$parent = self::getParent( $hierarchyRows, $row, $i );

				return self::breadcrumb( $previous, $parent, $next, $displayNameProperty );
			}
		}

		return "";
	}

	/**
	 * $hierarchyRows is an array representation of a wikitext hierarchy where
	 *	 each row in the hierarchy is a separate element of the array.
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
	private function getParent( $hierarchyRows, $row, $row_i ) {
		// figure out what the depth of the current page is. if we can't find
		// any depth (leading *s) then set the depth to 0 indicating failure.
		$currentDepth = self::getDepthOfHierarchyRow( $row );

		// figure out who the parent is based on depth being 1 less than the current depth
		$parent = "";
		// run backwards through all the previous rows
		for ( $parent_i = $row_i -1; $parent_i >= 0; $parent_i-- ) {
			$parentRow = $hierarchyRows[$parent_i];
			$parentDepth = self::getDepthOfHierarchyRow( $parentRow );

			if ( $parentDepth == $currentDepth -1 ) {
				$parent = self::getPageNameFromHierarchyRow( $parentRow );
				break;
			}
		}

		return $parent;
	}

	/**
	 * $hierarchyRow is assumed to be a row of a hierarchy in wikitext format,
	 *	 which is to say, leading *s and a page name within [[]] delimiters.
	 *
	 * This function will return the first pageName (link) found within $hierarchyRow
	 */
	private function getPageNameFromHierarchyRow( $hierarchyRow ) {
		$num_matches = preg_match_all( self::PAGENAMEPATTERN, $hierarchyRow, $matches );
		// give me the first subpattern match to be the name of the previous page
		$pageName = ( $num_matches > 0 ? $matches[1][0] : "" );
		return $pageName;
	}

	/**
	 * $hierarchyRow is assumed to be a row of a hierarchy in wikitext format,
	 *	 which is to say, leading *s and a page name within [[]] delimiters.
	 *
	 * This function will return the number of leading *s as the depth of $hierarchyRow.
	 */
	private function getDepthOfHierarchyRow( $hierarchyRow ) {
		$num_matches = preg_match_all( self::DEPTHPATTERN, $hierarchyRow, $matches );
		$depth = ( $num_matches > 0 ? strlen( $matches[1][0] ) : 0 );
		return $depth;
	}

	private function breadcrumb( $previous, $parent, $next, $displayNameProperty ) {
		$breadcrumb = "{| width='100%'" . PHP_EOL;
		if ( $previous != null ) {
			$breadcrumb .= "| width='33%' | &larr; [[" . $previous . "| " .
				HierarchyBuilder::getPageDisplayName( $previous,
				$displayNameProperty ) . "]]" . PHP_EOL;
		} else {
			$breadcrumb .= "| width='33%' | &nbsp;" . PHP_EOL;
		}
		if ( $parent != null ) {
			$breadcrumb .= "| align='center' width='33%' | &uarr; [[" . $parent .
				"| " . HierarchyBuilder::getPageDisplayName( $parent,
				$displayNameProperty ) . "]]" . PHP_EOL;
		} else {
			$breadcrumb .= "| width='33%' | &nbsp;" . PHP_EOL;
		}
		if ( $next != null ) {
			$breadcrumb .= "| align='right' width='33%' | [[" . $next . "|" .
				HierarchyBuilder::getPageDisplayName( $next,
				$displayNameProperty ) . "]] &rarr;" . PHP_EOL;
		} else {
			$breadcrumb .= "| width='33%' | &nbsp;" . PHP_EOL;
		}
		$breadcrumb .= "|}" . PHP_EOL;
		return $breadcrumb;
	}

	public function renderHierarchy( $input, $attributes, $parser, $frame ) {
		$hierarchyName = "HierarchyDiv" . self::$m_hierarchy_num;
		self::$m_hierarchy_num++;

		if ( isset( $attributes["collapsed"] ) ) {
			$collapsed = htmlspecialchars( $attributes["collapsed"] );
			if ( $collapsed === "collapsed" ) {
				$collapsed = "true";
			}
		} else	{
			$collapsed = "false";
		}

		if ( isset( $attributes["displaynameproperty"] ) ) {
			$displayNameProperty =
				htmlspecialchars( $attributes["displaynameproperty"] );
		} else	{
			$displayNameProperty = "";
		}

		if ( isset( $attributes["numbered"] ) ) {
			$numbered = htmlspecialchars( $attributes["numbered"] );
			if ( $numbered === "numbered" ) {
				$numbered = "true";
			}
		} else {
			$numbered = "false";
		}

		// this looks like it gets the property but it eats all the links.
		$input = $parser->recursiveTagParse( $input, $frame );
		$input = self::anchorLinkHolders( $input );
		$input = $parser->replaceLinkHoldersText( $input );
		$input = $parser->parse( $input,
			$parser->getTitle(),
			$parser->Options(),
			true,
			false )->getText();

		$hierarchy = HierarchyBuilder::parseHierarchy( $input,
			$displayNameProperty, $dummy,
			function ( $pageName, $displayNameProperty, $data ) {
				$pageLinkArray = array();
				$title = Title::newFromText( $pageName );
				if ( $title ) {
					$pageLinkArray['href'] = $title->getLinkURL();
				}
				if ( strlen( $displayNameProperty ) > 0 ) {
					$pageName = HierarchyBuilder::getPageDisplayName( $pageName,
						$displayNameProperty );
				}
				return Html::element( 'a', $pageLinkArray, $pageName );
			} );

		$parser->getOutput()->addModules( 'ext.HierarchyBuilder.render' );

		$hierarchy = strtr( $hierarchy, array( '"' => "'" ) );

		$script = <<<END
mw.loader.using(['ext.HierarchyBuilder.render'], function () {
	renderHierarchy("$hierarchyName", "$hierarchy", $collapsed, $numbered);
});
END;

		global $wgOut;
		$script = Html::inlineScript( $script );
		$wgOut->addScript( $script );

		return Html::element( 'div', array( 'id' => $hierarchyName ) );
	}

	private function anchorLinkHolders( $hierarchy ) {
		$pattern = "#<!--LINK \d+:\d+-->#";
		$num_matches = preg_match_all( $pattern, $hierarchy, $matches );
		if ( $num_matches !== false ) {
			foreach ( $matches[0] as $link ) {
				$hierarchy = str_replace( "$link", "<a>$link</a>", $hierarchy );
			}
		}

		return $hierarchy;
	}

	public static function parseHierarchy( $input, $displayNameProperty, &$data,
		$callback ) {
		$hierarchy = htmlspecialchars_decode( $input );
		$newlines = array( "\n", "\r" );
		$hierarchy = str_replace( $newlines, "", $hierarchy );
		$pattern = "/<a>([^<]*)<\/a>/i";
		$num_matches = preg_match_all( $pattern, $hierarchy, $matches );
		if ( $num_matches !== false ) {
			foreach ( $matches[1] as $pageName ) {
				$link = $callback( trim( $pageName ), $displayNameProperty, $data );
				$hierarchy = str_replace( "<a>$pageName</a>", $link, $hierarchy );
			}
		}
		return $hierarchy;
	}

	/**
	 * This is the titleIcon replacement version for the original (commented out below).
	 * $page is a string containing the title of the page.
	 * I still need to format the output correctly.
	 */
	public function getPropertyFromPage( $page, $property ) {
		$store = smwfGetStore();
		$title = Title::newFromText( $page );
		$subject = SMWDIWikiPage::newFromTitle( $title );
		$data = $store->getSemanticData( $subject );
		$property = SMWDIProperty::newFromUserLabel( $property );
		$values = $data->getPropertyValues( $property );

		$strings = array();
		foreach ( $values as $value ) {
			if ( $value->getDIType() == SMWDataItem::TYPE_STRING ||
				$value->getDIType() == SMWDataItem::TYPE_BLOB ) {
				return trim( $value->getString() );
			}
		}
		// return $strings;
		return "";
	}

	public function getPageDisplayName( $page, $displayNameProperty ) {
		if ( strlen( $displayNameProperty ) == 0 ) {
			return $page;
		}
		$output = self::getPropertyFromPage( $page, $displayNameProperty );
		if ( strlen( $output ) > 0 ) {
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
	public static function collectPageNamesFromHierarchy( $hierarchy ) {
		// use a regex to find all of the page names
		$numMatches = preg_match_all( HierarchyBuilder::PAGENAMEPATTERN, $hierarchy, $matches );
		return ( $numMatches > 0 ? $matches[1] : array() );
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
	public static function updateHierarchyWithDisplayNames( $hierarchy, $displayNameProperty ) {
		$hierarchyPageNames = self::collectPageNamesFromHierarchy( $hierarchy );
		foreach ( $hierarchyPageNames as $pageName ) {
			$displayName = self::getPageDisplayName( $pageName, $displayNameProperty );
			$pageNameLink = "[[" . $pageName . "]]";
			$displayNameLink = "[[" . $pageName . " | " . $displayName . "]]";
			$hierarchy = str_replace( $pageNameLink, $displayNameLink, $hierarchy );
		}
		return $hierarchy;
	}

	/**
	 * $hierarchyRoot is the root row of the hierarchy.
	 * $wikiTextHierarchy is a string containing the hierarchy in wikitext.
	 * $target is a string containing the page name of a page for which we
	 *	 require the section number.
	 *
	 * This function will search a hierarchy for a target page name and will
	 * return the section number for the row which contains that page. The
	 * target is a simple page name and the requirement is that a matching row
	 * must consist only of a single link to the target page. (eg: [[$target]])
	 * We do not yet support non-page rows.
	 */
	public static function getSectionNumberFromHierarchy( $wikiTextHierarchy, $target ) {
		$sectionNumber = self::getSectionNumberFromHierarchyHelper(
			"[[hierarchy_root]]" . "\n" . $wikiTextHierarchy, "", "", $target );
		return $sectionNumber;
	}

	/**
	 * $wikiTextHierarchy is a string containing the hierarchy in wikitext.
	 * $depth is a string containing the number of stars equal to the current
	 *	 depth in the hierarchy.
	 * $sectionNumber is the section number of the root of the current subhierarchy.
	 * $target is the string page name of the page we're searching the hierarchy for.
	 *
	 * This function will recursively traverse the given hierarchy/subhierarchy
	 * and search for the given target row. The target is a simple page name and
	 * the requirement is that a matching row must consist only of a single link
	 * to the target page. (eg: [[$target]]) We do not yet support non-page rows.
	 */
	private static function getSectionNumberFromHierarchyHelper( $wikiTextHierarchy, $depth,
		$sectionNumber, $target
	) {
		$rootAndChildren = HierarchyBuilder::splitHierarchy( $wikiTextHierarchy, $depth );
		// this is just the root row of this hierarchy (or subhierarchy)
		$root = $rootAndChildren[0];
		// this is a list of direct children hierarchies of the root. It might
		// be an empty list though
		$children = array_slice( $rootAndChildren, 1 );

		$rootPageName = HierarchyBuilder::getPageNameFromHierarchyRow( $root, false );

		// if we are staring at the target then return the current section number for the target
		if ( $rootPageName == $target ) {
			return $sectionNumber;
		}

		// if there are children, then recurse on each one searching for the target
		if ( count( $children ) > 0 ) {
			$numberSuffix = 1;
			foreach ( $children as $child ) {
				$childNumber = $sectionNumber == "" ? $numberSuffix++ : $sectionNumber . "." . $numberSuffix++;
				$targetNumber = self::getSectionNumberFromHierarchyHelper( $child, $depth . "*",
					$childNumber, $target );
				// if we find the target in this child branch then we can return
				// the target section number
				if ( $targetNumber != "" ) {
					return $targetNumber;
				}
			}
		}

		// if we can't find the target then return an empty section number
		return "";
	}

	/**
	 * $wikiTextHierarchy is the hierarchy that we want to split into root, and
	 *	 the root's child subhierarchies.
	 * $depth is the current depth of the hierarchy root. It can be interpreted
	 *	 as the depth of the root of the $wikiTextHierarchy root when viewed
	 *	 as a subhierarchy within another hierarchy.
	 *
	 * This function takes a hierarchy and splits it into the root, and each of
	 * of the root's child subhierarchies. These are returned as an array with
	 * the root first and each of the root's child subhierarchies in order.
	 */
	private static function splitHierarchy( $wikiTextHierarchy, $depth ) {
		$nextDepth = "\n" . $depth . "*";
		$r1 = "/\*/"; // this guy finds * characters
		// this is building the regex that will be used later
		$regex = preg_replace( $r1, "\\*", $nextDepth ) . "(?!\\*)";
		$regex = "/" . $regex . "/";
		// actually split the hierarchy into root and children
		$rootAndChildren = preg_split( $regex, $wikiTextHierarchy );

		return $rootAndChildren;
	}
}

class EditHierarchy extends SFFormInput {

	public function __construct( $input_number, $cur_value, $input_name,
		$disabled, $other_args ) {
		parent::__construct( $input_number, $cur_value, $input_name, $disabled,
			$other_args );
		$this->addJsInitFunctionData( 'editHierarchyInit',
			$this->setupJsInitAttribs() );
	}

	public static function getName() {
		return 'hierarchy';
	}

	protected function setupJsInitAttribs() {

		if ( array_key_exists( 'category', $this->mOtherArgs ) ) {
			$this->mCategory = $this->mOtherArgs['category'];
		} else {
			$this->mCategory = null;
		}

		$params = array();
		$params[] = "[[Category:$this->mCategory]]";
		$params[] = "link=none";
		$params[] = "limit=1000";

		$output = SMWQueryProcessor::getResultFromFunctionParams( $params,
			SMW_OUTPUT_WIKI ); // this can wait for a another approach
// use the category object to get list of titles in category from which you can get names

		$pageArray = array_map( 'trim', explode( ",", $output ) );

		if ( array_key_exists( 'displaynameproperty', $this->mOtherArgs ) ) {
			$displayNameProperty = $this->mOtherArgs['displaynameproperty'];
		} else {
			$displayNameProperty = "";
		}

		$pages = array();
		foreach ( $pageArray as $key => $value ) {
			$pages[$value] =
				HierarchyBuilder::getPageDisplayName( $value,
				$displayNameProperty );
		}

		// This loop will removed pages from the unselected pages list if we can
		// find it in the hierarchy already.
		foreach ( $pages as $key => $value ) {
			if ( strpos( "[[" . $this->mCurrentValue . "]]", $key ) !== false ) {
				unset( $pages[$key] );
			}
		}

		$hierarchy = $this->mCurrentValue;

		$hierarchy = HierarchyBuilder::updateHierarchyWithDisplayNames( $hierarchy,
			$displayNameProperty );

		global $sfgFieldNum;
		$this->mDivId = "hierarchy_$sfgFieldNum";
		$this->mInputId = "input_$sfgFieldNum";
		$jsattribs = array(
			'divId' => $this->mDivId,
			'hierarchy' => $hierarchy,
			'pages' => $pages,
			'isDisabled' => $this->mIsDisabled,
			'isMandatory' => array_key_exists( 'mandatory', $this->mOtherArgs ),
			'message' =>
				wfMessage( 'hierarchybuilder-editmessage', $this->mCategory )->text(),
			'hierarchyroot' =>
				wfMessage( 'hierarchybuilder-hierarchyroot' )->text(),
			'unusedpages' =>
				wfMessage( 'hierarchybuilder-unusedpages' )->text()
		);
		return json_encode( $jsattribs );
	}

	public function getHtmlText() {

		if ( $this->mCategory == null ) {
			return Html::element( 'b', array(),
				wfMessage( 'hierarchybuilder-missing-category' )->text() );
		}

		return Html::element( 'input', array(
			'type' => 'hidden',
			'id' => $this->mInputId,
			'name' => $this->mInputName,
			'value' => $this->mCurrentValue ) ) .
			Html::element( 'div', array( 'id' => $this->mDivId ) );
	}

	public static function getParameters() {
		$params = parent::getParameters();
		$params['category'] = array(
			'name' => 'category',
			'type' => 'string',
			'description' =>
				wfMessage( 'hierarchybuilder-category-desc' )->text()
		);
		$params['displaynameproperty'] = array(
			'name' => 'displaynameproperty',
			'type' => 'string',
			'description' =>
				wfMessage( 'hierarchybuilder-displaynameproperty-desc' )->text()
		);
	}

	public function getResourceModuleNames() {
		return array(
			'ext.HierarchyBuilder.edit'
		);
	}
}

class SelectFromHierarchy extends SFFormInput {

	public function __construct( $input_number, $cur_value, $input_name,
		$disabled, $other_args ) {
		parent::__construct( $input_number, $cur_value, $input_name, $disabled,
			$other_args );
		$this->addJsInitFunctionData( 'selectFromHierarchyInit',
			$this->setupJsInitAttribs() );
	}

	public static function getName() {
		return 'hierarchySelect';
	}

	protected function setupJsInitAttribs() {
		// wikiLog("SelectFromHierarchy", "setupJsInitAttribs", "starting");

		if ( array_key_exists( 'pagename', $this->mOtherArgs ) ) {
			$this->mPageName = $this->mOtherArgs["pagename"];
		} else {
			$this->mPageName = null;
			return;
		}

		if ( array_key_exists( 'propertyname', $this->mOtherArgs ) ) {
			$this->mPropertyName = $this->mOtherArgs["propertyname"];
		} else {
			$this->mPropertyName = null;
			return;
		}

		if ( array_key_exists( 'collapsed', $this->mOtherArgs ) ) {
			$this->mCollapsed = $this->mOtherArgs["collapsed"];
			if ( $this->mCollapsed !== "true" && $this->mCollapsed !== "false" ) {
				$this->mCollapsed = null;
				return;
			}
		} else {
			$this->mCollapsed = "false";
		}

		if ( array_key_exists( 'displaynameproperty', $this->mOtherArgs ) ) {
			$displaynameproperty = $this->mOtherArgs["displaynameproperty"];
		} else {
			$displaynameproperty = "";
		}

		$hierarchy = HierarchyBuilder::getPropertyFromPage( $this->mPageName,
			$this->mPropertyName );
		$hierarchy = HierarchyBuilder::updateHierarchyWithDisplayNames( $hierarchy,
			$displaynameproperty );

		$selected_items = array_map( 'trim', explode( ",", $this->mCurrentValue ) );

		global $sfgFieldNum;
		$this->mDivId = "hierarchy_$sfgFieldNum";
		$this->mInputId = "input_$sfgFieldNum";
		$jsattribs = array(
			'divId' => $this->mDivId,
			'hierarchy' => $hierarchy,
			'selectedItems' => $selected_items,
			'isDisabled' => $this->mIsDisabled,
			'isMandatory' => array_key_exists( 'mandatory', $this->mOtherArgs ),
			'collapsed' => $this->mCollapsed == "true" ? true : false
		);

		return json_encode( $jsattribs );
	}

	public function getHtmlText() {

		if ( $this->mPageName == null ) {
			return Html::element( 'b', array(),
				wfMessage( 'hierarchybuilder-missing-page-name' )->text() );
		}

		if ( $this->mPropertyName == null ) {
			return Html::element( 'b', array(),
				wfMessage( 'hierarchybuilder-missing-property-name' )->text() );
		}

		if ( $this->mCollapsed == null ) {
			return Html::element( 'b', array(),
				wfMessage( 'hierarchybuilder-invalid-collapsed' )->text() );
		}

		return Html::element( 'input', array(
			'type' => 'hidden',
			'id' => $this->mInputId,
			'name' => $this->mInputName,
			'value' => $this->mCurrentValue ) ) .
			Html::element( 'div', array( 'id' => $this->mDivId ) );
	}

	public static function getParameters() {
		$params = parent::getParameters();
		$params['pagename'] = array(
			'name' => 'pagename',
			'type' => 'string',
			'description' =>
				wfMessage( 'hierarchybuilder-pagename-desc' )->text()
		);
		$params['propertyname'] = array(
			'name' => 'propertyname',
			'type' => 'string',
			'description' =>
				wfMessage( 'hierarchybuilder-propertyname-desc' )->text()
		);
		$params['collapsed'] = array(
			'name' => 'collapsed',
			'type' => 'string',
			'description' =>
				wfMessage( 'hierarchybuilder-collapsed-desc' )->text()
		);
		$params['displaynameproperty'] = array(
			'name' => 'displaynameproperty',
			'type' => 'string',
			'description' =>
				wfMessage( 'hierarchybuilder-displaynameproperty-desc' )->text()
		);
	}

	public function getResourceModuleNames() {
		return array(
			'ext.HierarchyBuilder.select'
		);
	}
}

function wikiLog( $className, $methodName, $message ) {
	wfErrorLog( "[" . date( "c" ) . "]"
		. "[" . $className . "]"
		. "[" . $methodName . "] "
		. $message . "\n",
		'/home/kji/hierarchyBuilder.log' );
}
