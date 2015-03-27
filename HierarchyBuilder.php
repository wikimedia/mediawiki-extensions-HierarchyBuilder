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
	'path' => __FILE__,
	'name' => 'HierarchyBuilder',
	'version' => '1.6.0',
	'author' => array(
		'[https://www.mediawiki.org/wiki/User:Cindy.cicalese Cindy Cicalese]',
		'[https://www.mediawiki.org/wiki/User:Kevin.ji Kevin Ji]'
	),
	'descriptionmsg' => 'hierarchybuilder-desc',
	'url' => 'https://www.mediawiki.org/wiki/Extension:HierarchyBuilder'
);

$wgExensionMessagesFiles['HierarchyBuilder'] = __DIR__ . '/HierarchyBuilder.i18n.php';
$wgHooks['ParserFirstCallInit'][] = 'efHierarchyBuilderSetup';

$wgAutoloadClasses['HierarchyBuilder'] = __DIR__ . '/HierarchyBuilder.class.php';
$wgAutoloadClasses['HierarchyFormInput'] = __DIR__ . '/HierarchyFormInput.php';
$wgAutoloadClasses['HierarchySelectFormInput'] = __DIR__ . '/HierarchySelectFormInput.php';
$wgAutoloadClasses['HierarchyTree'] = __DIR__ . '/HierarchyTree.php';
$wgAutoloadClasses['TreeNode'] = __DIR__ . '/TreeNode.php';

$wgMessagesDirs['HierarchyBuilder'] = __DIR__ . "/i18n";

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

$wgResourceModules['ext.HierarchyBuilder.renderSelected'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'HierarchyBuilder',
	'scripts' => 'renderHierarchySelected.js',
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
	'styles' => 'selectFromHierarchy.css',	
	'dependencies' => array(
		'ext.HierarchyBuilder.jstree',
		'ext.semanticforms.main'
	)
);

/**
 * @param $parser Parser
 * @return bool
 */
function efHierarchyBuilderSetup ( & $parser ) {
	$parser->setFunctionHook( 'hierarchyBreadcrumb', 'hierarchyBreadcrumb' );
	$parser->setFunctionHook( 'hierarchySectionNumber', 'sectionNumber' );
	$parser->setFunctionHook( 'hierarchyParent', 'parent' );
	$parser->setFunctionHook( 'hierarchyChildren', 'children' );
	$parser->setFunctionHook( 'hierarchySubtree', 'subhierarchy' );
	$parser->setFunctionHook( 'hierarchySelected', 'hierarchySelected' );

	$parser->setHook( 'hierarchy', 'renderHierarchy' );
	$parser->setHook( 'hierarchySelected', 'renderHierarchySelected');
	global $sfgFormPrinter;
	$sfgFormPrinter->registerInputType( 'HierarchyFormInput' );
	$sfgFormPrinter->registerInputType( 'HierarchySelectFormInput' );
	return true;
}

/**
 * This parser function will return only specific selected rows of a hierarchy
 * in addition to any necessary contextual rows. 
 *
 * The returned hierarchy is displayd similarly to the HierarchySelectFormInput,
 * with each row preceeded by a checkbox. However, the checkboxes will be inactive.
 *
 * For a given set of selected rows, only those rows will be provided from the
 * hierarchy in addition to the minimal necessary contextual rows needed to display
 * the hierarchical relationships. For example, if a single selected row is given,
 * but that row is a leaf node which is 5 levels deep within the hierarchy, then 
 * that row will be given along with each of its ancestors. This is conidered the
 * "pruned" behavior.
 *
 * The "collapsed" behavior will not remove any branches of the hierarchy, even
 * when those branches do not contain any of the specified selected rows. Instead,
 * these unnecessary branches will be collapsed initially, allowing only the
 * selected rows and their siblings to be shown.
 *
 * @param $parser: Parser
 * @return I don't know yet.
 * 
 * Example invokation:
 * @code
 * {{#hierarchySelected:<list of page names>|<hierarchy page name>|<hierarchy property>}} 
 * {{#hierarchySelected:<list of page names>|<hierarchy page name>|<hierarchy property>|pruned}}
 * {{#hierarchySelected:<list of page names>|<hierarchy page name>|<hierarchy property>|collapsed}}
 * @endcode
 */
function hierarchySelected( $parser ) {
	$params = func_get_args();
	if ( count( $params ) < 4 || count( $params ) > 5) {
		$output = '';
	} else {
		$selectedPages = $params[1];
		$hierarchyPageName = $params[2];
		$hierarchyPropertyName = $params[3];
		// if "pruned" is given, then set the displaymode to pruned. otherwise, "collapsed"
		if ( isset( $params[4] ) && $params[4] == 'collapsed') {
			$displayMode = 'collapsed';
		} else {
			$displayMode = 'pruned';
		}

		$optionalParams = array_slice( $params, 4 );
		$optionalParams = parseParams( $optionalParams );
		$displaynameproperty = '';
		if ( isset( $optionalParams[HierarchyBuilder::DISPLAYNAMEPROPERTY] ) ) {
			$displaynameproperty = $optionalParams[HierarchyBuilder::DISPLAYNAMEPROPERTY];
		}
		$displaynameattr = $displaynameproperty == '' ? '' : "displaynameproperty=$displaynameproperty";

		$wikitextHierarchy = HierarchyBuilder::getPropertyFromPage( $hierarchyPageName, $hierarchyPropertyName );
		// this is where we ask HierarchyBuilder class to actually do the work for us.
		$hierarchyTree = HierarchyTree::fromWikitext( $wikitextHierarchy );

		$normalizedSelectedPages = 
			array_map(
				function( $page ) {
					$pagename = HierarchyBuilder::getPageNameFromHierarchyRow( $page );
					if ( $pagename == '' ) {
						$pagename = $page;
					}
					return $pagename;
				},
				explode( ',', $selectedPages )
			);
		$mst = $hierarchyTree->getMST( $normalizedSelectedPages );
		
		// output formatting
		$flatNormalizedSelectedPages = 			
			array_reduce( $normalizedSelectedPages, 
					function( $carry, $item ) {
						if ( $carry == '') {
							$carry = $item;
						} else {
							$carry .= ',' . $item;
						}
						return $carry;
					}
				);
		$selected = htmlspecialchars( str_replace( " ", "%20", $flatNormalizedSelectedPages	) );

		$output = '';
		if ( $displayMode == 'collapsed') {
			$output = "<hierarchySelected collapsed $displaynameattr selected=$selected>" . (string)$mst . '</hierarchySelected>';
		} else {
			$output = "<hierarchySelected $displaynameattr selected=$selected>" . (string)$mst . '</hierarchySelected>';
		}
		$output = $parser->recursiveTagParse( $output );

	}
	return $parser->insertStripItem( $output, $parser->mStripState );
}

/**
 * This parser function will return the subhierarchy that is rooted at the specified
 * node within a hierarchy.
 *
 * The three required arguments are (in order):
 *   - The root node of the subhierarchy within the overall hierarchy. If this
 *     argument is empty, then the entire hierarchy is returned.
 *   - Full page name of the page containing the hierarchy
 *   - Property name of the property containing the hierarchy data
 *
 * The optional argument is:
 *   - Format to specify if the results should be returned as a bulleted list as
 *     opposed to the default striped format.
 *   - Property name of the property containing a page's displayname. Should only
 *     be given if not using format=ul.
 *
 * Example invokation:
 * @code
 * {{#hierarchySubtree:|Main Page|Hierarchy Data}}
 * {{#hierarchySubtree:Hierarchy Builder|Main Page|Hierarchy Data}}
 * {{#hierarchySubtree:Hierarchy Builder|Main Page|Hierarchy Data|displaynameproperty=Name}}
 * {{#hierarchySubtree:Hierarchy Builder|Main Page|Hierarchy Data|format=ul}}
 * @endcode
 *
 * @param $parser: Parser
 *
 * @return string: The string containing the specified subhierarchy as though
 *  it were a standalone hierarchy.
 */
function subhierarchy( $parser ) {
	$params = func_get_args();
	if ( count( $params ) < 4 ) {
		$output = '';
	} else {
		$rootNode = $params[1];
		$hierarchyPageName = $params[2];
		$hierarchyPropertyName = $params[3];

		$optionalParams = array_slice( $params, 4 );
		$optionalParams = parseParams( $optionalParams );
		$format = '';
		if ( isset( $optionalParams[HierarchyBuilder::FORMAT] ) ) {
			$format = $optionalParams[HierarchyBuilder::FORMAT];
		}
		$displaynameproperty = '';
		if ( isset( $optionalParams[HierarchyBuilder::DISPLAYNAMEPROPERTY] ) ) {
			$displaynameproperty = $optionalParams[HierarchyBuilder::DISPLAYNAMEPROPERTY];
		}
		/*$displaymode = '';
		if ( isset( $optionalParams[HierarchyBuilder::DISPLAYMODE] ) ) {
			$displaymode = $optionalParams[HierarchyBuilder::DISPLAYMODE];
		}*/
		$showroot = '';
		if ( isset( $optionalParams[HierarchyBuilder::SHOWROOT] ) ) {
			$showroot = $optionalParams[HierarchyBuilder::SHOWROOT];
		}
		if ( $rootNode == '' ) {
			$showroot = 'showroot';
		}
		$collapsed = '';
		if ( isset( $optionalParams[HierarchyBuilder::COLLAPSED] ) ) {
			$collapsed = $optionalParams[HierarchyBuilder::COLLAPSED];
		}

		$output = HierarchyBuilder::getSubhierarchy(
			$rootNode,
			$hierarchyPageName,
			$hierarchyPropertyName
		);

		// this is where we have to handle the default mode which is not showroot and not collapsed
		if ( $showroot == '' ) {
			// fix $output so only the children are given
			$hierarchyrows = preg_split( '/\n/', $output );
			$root = $hierarchyrows[0];
			$children = array_slice( $hierarchyrows, 1 );

			$depth = HierarchyBuilder::getDepthOfHierarchyRow( $root );
			$output = array_reduce( $children, 
					function( $carry, $item ) use ( $depth ) {
						if ($carry != '') {
							$carry .= "\n" . substr( $item, strlen($depth));
						} else {
							$carry = substr( $item, strlen($depth));
						}
						return $carry;
					}
				);
		}

		// this is the default output display format
		if ($format != 'ul') {
			if ( $displaynameproperty == '' ) {
					$output = "<hierarchy $collapsed>$output</hierarchy>";
			} else {
				$output = "<hierarchy $collapsed displaynameproperty=$displaynameproperty>$output</hierarchy>";
			}
		}
		// otherwise it's the bulleted format and we don't modify output.

		$output = $parser->recursiveTagParse( PHP_EOL.$output );
	}
	return $parser->insertStripItem( $output, $parser->mStripState );
}

/**
 * This parser function will give the section number of a page in a hierarchy.
 *
 * The three required arguments are (in order):
 *   - Full page name
 *   - Full page name of the page containing the hierarchy
 *   - Property name of the property containing the hierarchy data
 *
 * Example invokation:
 * @code
 * {{#hierarchySectionNumber:{{FULLPAGENAME}}|Table of Contents|Hierarchy Data}}
 * @endcode
 *
 * @param $parser: Parser
 *
 * @return string: The section number of the specified page name within the
 *  specified hierarchy.
 */
function sectionNumber( $parser ) {
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
 * @code
 * {{#hierarchyParent:{{FULLPAGENAME}}|hierarchy page name|hierarchy property}}
 * {{#hierarchyParent:{{FULLPAGENAME}}|hierarchy page name|hierarchy property|link=none}}
 * @endcode
 *
 * @param $parser Parser
 *
 * @return string: The parent of the specified page within the specified hierarchy
 *  as wikitext for formatted display.
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
		$optionalParams = array_slice( $params, 4 );
		$optionalParams = parseParams( $optionalParams );
		// look for the template parameter
		if ( isset( $optionalParams[HierarchyBuilder::TEMPLATE] ) ) {
			$template = $optionalParams[HierarchyBuilder::TEMPLATE];
		} else {
			$template = '';
		}
		// look for the introtemplate parameter
		if ( isset( $optionalParams[HierarchyBuilder::INTROTEMPLATE] ) ) {
			$introTemplate = $optionalParams[HierarchyBuilder::INTROTEMPLATE];
		} else {
			$introTemplate = '';
		}
		// look for the outrotemplate parameter
		if ( isset( $optionalParams[HierarchyBuilder::OUTROTEMPLATE] ) ) {
			$outroTemplate = $optionalParams[HierarchyBuilder::OUTROTEMPLATE];
		} else {
			$outroTemplate = '';
		}
		// look for the link parameter
		if ( isset( $optionalParams[HierarchyBuilder::LINK] ) ) {
			$link = $optionalParams[HierarchyBuilder::LINK];
		} else {
			$link = '';
		}
		// look for the delimiter parameter
		if ( isset( $optionalParams[HierarchyBuilder::SEPARATOR] ) ) {
			$delimiter = $optionalParams[HierarchyBuilder::SEPARATOR];
		} else {
			if ( $template != '' ) {
				$delimiter = '';
			} else {
				$delimiter = ',';
			}
		}

		// find the parents
		$parents = HierarchyBuilder::getPageParent( $pageName, $hierarchyPageName,
			$hierarchyPropertyName );

		// format the parents for return according to the optional arg
		// this code is the same as below for children
		$output = '';
		if ( count( $parents ) > 0 ) {
			if ( $template != '' ) {
				$intro = $introTemplate != '' ? "{{{$introTemplate}}}\n" : '';
				$outro = $outroTemplate != '' ? "\n{{{$outroTemplate}}}" : '';
				$templateParentString = implode(
					array_map(
						function( $parent ) use ( $template, $link ) {
							if ( $link == 'none' ) {
								return "{{" . $template . "|$parent}}";
							} else {
								return "{{" . $template . "|[[$parent]]}}";
							}
						},
						$parents
					),
					"$delimiter\n"
				);
				$output = $intro . $templateParentString . $outro;
			} else {
				$parentString = implode(
					array_map(
						function( $parent ) use ( $link ) {
							return $link == 'none' ? $parent : "[[$parent]]";
						},
						$parents
					),
					$delimiter
				);

				$output = $parentString;
			}
		}
		$output = $parser->recursiveTagParse( $output );
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
 * @code
 * {{#hierarchyChildren:{{FULLPAGENAME}}|hierarchy page|hierarchy property}}
 * {{#hierarchyChildren:{{FULLPAGENAME}}|hierarchy page|hierarchy property|sep=,}}
 * {{#hierarchyChildren:{{FULLPAGENAME}}|hierarchy page|hierarchy property|sep=,|link=none}}
 * {{#hierarchyChildren:{{FULLPAGENAME}}|hierarchy page|hierarchy property|sep=,|template=X|link=none}}
 * {{#hierarchyChildren:{{FULLPAGENAME}}|hierarchy page|hierarchy property|sep=,|template=X|introtemplate=Y|outrotemplate=Z|link=none}}
 * @endcode
 *
 * @param $parser: Parser
 *
 * @return string: The list of children of the specified page within the specified
 *  hierarchy. The list is returned as wikitext for formatted display according to
 *  the various separator, template, and link parameters.
 */
function children( $parser ) {
	$params = func_get_args();
	if ( count( $params ) < 4 ) {
		$output = '';
	} else {
		// mandatory arguments
		$pageName = $params[1];
		$hierarchyPageName = $params[2];
		$hierarchyPropertyName = $params[3];

		// look for all the optional args in any order. We really don't care if
		// the right combination of optional parameters appears at this point.
		// The logic for handling different parameter combinations will happen
		// after pulling children when we attempt to return results.
		$optionalParams = array_slice( $params, 4 );
		$optionalParams = parseParams( $optionalParams );
		// look for the template parameter
		if ( isset( $optionalParams[HierarchyBuilder::TEMPLATE] ) ) {
			$template = $optionalParams[HierarchyBuilder::TEMPLATE];
		} else {
			$template = '';
		}
		// look for the introtemplate parameter
		if ( isset( $optionalParams[HierarchyBuilder::INTROTEMPLATE] ) ) {
			$introTemplate = $optionalParams[HierarchyBuilder::INTROTEMPLATE];
		} else {
			$introTemplate = '';
		}
		// look for the outrotemplate parameter
		if ( isset( $optionalParams[HierarchyBuilder::OUTROTEMPLATE] ) ) {
			$outroTemplate = $optionalParams[HierarchyBuilder::OUTROTEMPLATE];
		} else {
			$outroTemplate = '';
		}
		// look for the link parameter
		if ( isset( $optionalParams[HierarchyBuilder::LINK] ) ) {
			$link = $optionalParams[HierarchyBuilder::LINK];
		} else {
			$link = '';
		}
		// look for the delimiter parameter
		if ( isset( $optionalParams[HierarchyBuilder::SEPARATOR] ) ) {
			$delimiter = $optionalParams[HierarchyBuilder::SEPARATOR];
		} else {
			if ( $template != '' ) {
				$delimiter = '';
			} else {
				$delimiter = ',';
			}
		}

		// find the page children
		$children = HierarchyBuilder::getPageChildren( $pageName, $hierarchyPageName,
			$hierarchyPropertyName );

		// format the output according to the optional params
		$output = '';
		if ( count( $children ) > 0 ) {
			if ( $template != '' ) {
				$intro = $introTemplate != '' ? "{{{$introTemplate}}}\n" : '';
				$outro = $outroTemplate != '' ? "\n{{{$outroTemplate}}}" : '';
				$templateChildrenString = implode(
					array_map(
						function( $child ) use ( $template, $link ) {
							if ( $link == 'none' ) {
								return "{{" . $template . "|$child}}";
							} else {
								return "{{" . $template . "|[[$child]]}}";
							}
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
							return $link == 'none' ? $child : "[[$child]]";
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

/**
 * This parser function displays a breadcrumb for a page within a hierarchy.
 *
 * The breadcrumb display consists of three pages:
 *  - previous page in the hierarchy
 *  - next page in the hierarchy
 *  - hierarchical parent page in the hierarchy.
 *
 * There are 4 required parameters for this parser function:
 *  - pagename - that page who's breadcrumb you want to display.
 *  - hierarchy page - the page that has the hierarchy on it.
 *  - hierarchy property - the property containing the hierarchy data on the
 *    hierarchy page.
 *  - display name property - the property for display names when using content
 *    free page naming.
 *
 * Example Usage:
 * @code
 * {{#hierarchyBreadcrumb:{{FULLPAGENAME}}|Table of Contents|Hierarchy Data|Name}}
 * @endcode
 *
 * @param $parser Parser
 *
 * @return string: Wikitext that displays the breadcrumb on the page.
 */
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

function renderHierarchySelected( $input, $attributes, $parser, $frame ) {
	$hierarchyBuilder = new HierarchyBuilder;
	$output = $hierarchyBuilder->renderHierarchySelected( $input, $attributes, $parser,
		$frame );
	$parser->disableCache();
	return array( $parser->insertStripItem( $output, $parser->mStripState ),
		'noparse' => false );
}

/**
 * Helper function for parsing a list of named parser function parameters.
 *
 * @param array $params: A list of named parameters (e.g. "array('sep=|', 'link=none'))
 *
 * @return array: Associative array of named parameters.
 */
function parseParams( $params ) {
	$paramsArray = array();
	foreach ( $params as $param ) {
		$paramsArray += parseParam( $param );
	}
	return $paramsArray;
}

/**
 * Helper function for parsing a single named parser function parameter.
 *
 * @param string $param: A single named parameter (e.g. 'link=none')
 *
 * @param array: A single element associative array containing the named parameter.
 */
function parseParam( $param ) {
	$paramArray = array();
	$ret = preg_split( '/=/', $param, 2 );
	if ( count( $ret ) > 1 ) {
		$paramArray[$ret[0]] = $ret[1];
	} else {
		$paramArray[$ret[0]] = $ret[0];
	}
	return $paramArray;
}

function wikiLog($className, $methodName, $message) {
	wfErrorLog( "[".date("c")."]" . "[".$className."][".$methodName."] " . $message . "\n", '/home/kji/hierarchyBuilder.log' );
}