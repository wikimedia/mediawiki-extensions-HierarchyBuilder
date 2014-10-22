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

class HierarchyBuilder {
	static protected $m_hierarchy_num = 1;

	// pattern to extract the pageName from a wikitext hierarchy row
	const PAGENAMEPATTERN = '/\[\[(.*)\]\]/';
	// pattern to extract the leading *s to determine the current row's depth
	// in the wikitext hierarchy.
	const DEPTHPATTERN = '/^(\**)/';

	// constants for child parser function arg names
	const SEPARATOR = 'sep';
	const TEMPLATE = 'template';
	const INTROTEMPLATE = 'introtemplate';
	const OUTROTEMPLATE = 'outrotemplate';
	const LINK = 'link';

	/**
	 * This function gives the section number for a target page within a
	 * specific hierarchy on a particular page.
	 *
	 * Section numbers are not stored anywhere. The section number must be
	 * dynamically computed for each row whenever it is needed. As a result, we
	 * must retrieve the hierarchy that contains the page who's section number
	 * is being computed.
	 *
	 * @param string $targetPageName: name of the target page for which you want
	 *  the auto-number in the given hierarchyPage returned.
	 * @param string $hierarchyPageName: name of the page containing the hierarchy
	 *  from which to retrieve numberings.
	 * @param string $hierarchyPropertyName: name of the property on the hierarchy 
	 *  page which contains the hierarchy data. (ex: Hierarchy Data).
	 *
	 * @return string: The section number for the target page or the empty string
	 *  if the target page is not found within the hierarchy.
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
	 * Returns the direct hierarchical children of a page in a hierarchy.
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
	 * @param string $targetPageName: is the name of the target page for which
	 *  we want the list of immediate children.
	 * @param string $hierarchyPageName: is the name of the page containing the
	 *  hierarchy from which to retrieve the list of children.
	 * @param string $hierarchyPropertyName: is the name of the property on the
	 *  hierarchy page which contains the hierarchy data. ex: Hierarchy Data.
	 *
	 * @return array: A list strings consisting of the hierarchical children of
	 *  the target page within the hierarchy.
	 */
	public static function getPageChildren( $targetPageName, $hierarchyPageName,
		$hierarchyPropertyName
	) {
		$hierarchy = self::getPropertyFromPage( $hierarchyPageName, $hierarchyPropertyName );
		$hierarchyRows = preg_split( '/\n/', $hierarchy );

		$currentPagePattern = '/\[\[' . $targetPageName . '\]\]/';

		$hierarchyRowsSize = count( $hierarchyRows );
		for ( $i = 0; $i < $hierarchyRowsSize; $i++ ) {
			$row = $hierarchyRows[$i]; // current row that we're looking at in the hierarchy
			// look to see if this row is the one with our page
			$numMatches = preg_match_all( $currentPagePattern, $row, $matches );
			if ( $numMatches > 0 ) { // found the current page on this row of the hierarchy
				$children = self::getChildren( $hierarchyRows, $row, $i );
				return $children;
			}
		}

		return array();
	}

	/**
	 * Helper function that find the direct hierarchical children of a row within
	 * a hierarchy represented as an array of rows.
	 *
	 * This function will find the immediate children of $row within $hierarchyRows
	 * and return the pageNames of those children. The immediate children are
	 * defined to be any rows which come after $row with depth exactly equal to
	 * one greater than the depth of $row AND which come before the first subsequent
	 * row with depth less than or equal to the depth of $row.
	 *
	 * Note: If no immediate children of $row are found, then an empty array is
	 * returned instead of a list of children;
	 *
	 * @param array $hierarchyRows: Array representation of a wikitext hierarchy
	 *  where each row in the hierarchy is a separate element of the array.
	 * @param string $row: A specific row of the hierarchy given by 
	 *  $hierarchyRows.
	 * @param number $rowIdx: The index of $row in $hierarchyRows.
	 *
	 * @return array: List of string consisting of the hierarchical children of
	 *  $row within $hierarchyRows.
	 */
	private static function getChildren( $hierarchyRows, $row, $rowIdx ) {
		// figure out what the depth of the current page is. if we can't find
		// any depth (leading *s) then set the depth to 0 indicating failure.
		$currentDepth = self::getDepthOfHierarchyRow( $row );

		// figure out who the immediate children are based on depth being 1 more
		// than the current depth
		$children = array();
		// run backwards through all the previous rows
		$hierarchyRowsSize = count( $hierarchyRows );
		for ( $childIdx = $rowIdx + 1; $childIdx < $hierarchyRowsSize; $childIdx++ ) {
			$childRow = $hierarchyRows[$childIdx];
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
	 * Returns the hierarchical parent of a page within a hierarchy.
	 *
	 * This function searches a specified hierarchy for the direct parent of a
	 * particular page. The search proceeds by searching the hierarchy top down
	 * to find the target page, and then looping back upwards to identify the
	 * immediate parent. If there is no immediate parent in the hierarchy for
	 * the specified target page, or if the target page is not included in the
	 * hierarchy at all, then this function returns the empty string.
	 * 
	 * @param string $targetPageName: The name of the target page for which we
	 *  want the immediate parent in the hierarchy.
	 * @param string $hierarchyPageName: The name of the page containing the
	 *  hierarchy from which to retrieve the immediate parent of the target page.
	 * @param string $hierarchyPropertyName: The name of the property on the 
	 *  hierarchy page which contains the hierarhcy data. (ex: Hierarchy Data)
	 *
	 * @return string: The hierarchical parent of target page within the hiearchy.
	 */

	public static function getPageParent( $targetPageName, $hierarchyPageName,
		$hierarchyPropertyName
	) {
		$hierarchy = self::getPropertyFromPage( $hierarchyPageName, $hierarchyPropertyName );
		$hierarchyRows = preg_split( '/\n/', $hierarchy );

		$currentPagePattern = '/\[\[' . $targetPageName . '\]\]/';
		// loop through the hierarchyRows looking for the row containing the currentPage
		$hierarchyRowsSize = count( $hierarchyRows );
		for ( $i = 0; $i < $hierarchyRowsSize; $i++ ) {
			$row = $hierarchyRows[$i]; // current row that we're looking at in the hierarchy
			// look to see if this row is the one with our page
			$numMatches = preg_match_all( $currentPagePattern, $row, $matches );
			if ( $numMatches > 0 ) { // found the current page on this row of the hierarchy
				// Get the parent of the current row in the hierarchy.
				// Note that if there is no hierarchical parent, then the parent
				// will be empty.
				$parent = self::getParent( $hierarchyRows, $row, $i );
				return $parent;
			}
		}

		return '';
	}

	/**
	 * Compute and return the breadcrumb for a given page within a hierarchy.
	 *
	 * This function will compute and return the breadcrumb information for a
	 * given page based on the position of that page within a specified hierarchy.
	 * The returned breadcrumb will show the display name for the pages it contains.
	 *
	 * @param string $currentPage: Name of the page in the hierarchy that is 
	 *  currently being viewed.
	 * @param string $hierarchyPage: Name of the page that contains the hierarchy
	 *  to which $currentPage belongs.
	 * @param string $hierarchyProperty: Name of the property on $hierarchyPage
	 *  that actually stores the wikitext formatted hierarchy.
	 * @param string $displayNameProperty: Value of the DislayName property
	 *  (eg: "Description")
	 *
	 * @return string: Formatted wikitext that will format and display the
	 *  breadcrumb information on the page.
	 */
	public function hierarchyBreadcrumb( $currentPage, $hierarchyPage,
		$hierarchyProperty, $displayNameProperty ) {

		$hierarchy = self::getPropertyFromPage( $hierarchyPage, $hierarchyProperty );
		$hierarchyRows = preg_split( '/\n/', $hierarchy );

		$currentPagePattern = '/\[\[' . $currentPage . '\]\]/';
		// loop through the hierarchyRows looking for the row containing the currentPage
		$hierarchyRowsSize = count( $hierarchyRows );
		for ( $i = 0; $i < $hierarchyRowsSize; $i++ ) {
			// current row that we're looking at in the hierarchy
			$row = $hierarchyRows[$i];
			// look to see if this row is the one with our page
			$numMatches = preg_match_all( $currentPagePattern, $row, $matches );
			if ( $numMatches > 0 ) { // found the current page on this row of the hierarchy
				// go to the previous row and extract the page name if any
				// previous row exists. Otherwise the previous page name is empty.
				$prevIdx = $i -1;
				$previousRow = ( $prevIdx >= 0 ? $hierarchyRows[$prevIdx] : '' );
				$previous = self::getPageNameFromHierarchyRow( $previousRow );

				// go to the next row and extract the page name if any next row
				// exists. Otherwise the next page name is empty.
				$nextIdx = $i + 1;
				$nextRow = ( $nextIdx < count( $hierarchyRows ) ? $hierarchyRows[$nextIdx] : '' );
				$next = self::getPageNameFromHierarchyRow( $nextRow );

				// get the parent of the current row in the hierarchy.
				// Note that if there is no hierarchical parent, then the parent will be empty.
				$parent = self::getParent( $hierarchyRows, $row, $i );

				return self::breadcrumb( $previous, $parent, $next, $displayNameProperty );
			}
		}

		return '';
	}

	/**
	 * Find and return the hierarchical parent of a row within a hierarchy.
	 *
	 * This function will find the hierarchical parent of $row within $hierarchyRows
	 * and return the pageName of that parent. The hierarchical parent is defined
	 * to be the first row of $hierarchyRows which preceeds $row and has a depth
	 * that is equal to one less than the depth of $row.
	 *
	 * Note: If no hierarchical parent of $row is found, then the empty string
	 * is returned;
	 *
	 * @param array $hierarchyRows: Array representation of a wikitext hierarchy
	 *  where each row in the hierarchy is a separate element of the array.
	 * @param string $row: A specific row of the hierarchy given by $hierarchyRows.
	 * @param number $rowIdx: The index of $row in $hierarchyRows.
	 *
	 * @return string: The hierarchical parent of $row within @$hierarchyRows
	 *  or the empty string if there is no parent. Note that if the parent row
	 *  contains more than just a link to a page, then only the page name from
	 *  that row will be returned.
	 */
	private function getParent( $hierarchyRows, $row, $rowIdx ) {
		// figure out what the depth of the current page is. if we can't find
		// any depth (leading *s) then set the depth to 0 indicating failure.
		$currentDepth = self::getDepthOfHierarchyRow( $row );

		// figure out who the parent is based on depth being 1 less than the current depth
		$parent = '';
		// run backwards through all the previous rows
		for ( $parentIdx = $rowIdx -1; $parentIdx >= 0; $parentIdx-- ) {
			$parentRow = $hierarchyRows[$parentIdx];
			$parentDepth = self::getDepthOfHierarchyRow( $parentRow );

			if ( $parentDepth == $currentDepth -1 ) {
				$parent = self::getPageNameFromHierarchyRow( $parentRow );
				break;
			}
		}

		return $parent;
	}

	/**
	 * Find and return the page name from a hierarchy row.
	 *
	 * This function will return the first pageName (link) found within $hierarchyRow
	 *
	 * @param string $hierarchyRow: Assumed to be a row of a hierarchy in wikitext
	 *  format, which is to say, leading *s and a page name within [[]] delimiters.
	 *
	 * @return string: The first page name found within $hierarchyRow.
	 */
	private function getPageNameFromHierarchyRow( $hierarchyRow ) {
		$numMatches = preg_match_all( self::PAGENAMEPATTERN, $hierarchyRow, $matches );
		// give me the first subpattern match to be the name of the previous page
		$pageName = ( $numMatches > 0 ? $matches[1][0] : '' );
		return $pageName;
	}

	/**
	 * Returns the depth of a row within a hierarchy.
	 *
	 * This function will return the number of leading *s in $hierarchyRow as
	 * the depth of $hierarchyRow.
	 *
	 * @param string $hierarchyRow: Assumed to be a row of a hierarchy in wikitext
	 *  format, which is to say, leading *s and a page name within [[]] delimiters.
	 *
	 * @return number: The depth of $hierarchyRow.
	 */
	private function getDepthOfHierarchyRow( $hierarchyRow ) {
		$numMatches = preg_match_all( self::DEPTHPATTERN, $hierarchyRow, $matches );
		$depth = ( $numMatches > 0 ? strlen( $matches[1][0] ) : 0 );
		return $depth;
	}

	/**
	 * Return the wikitext formatted breadcrumb using the given information.
	 * 
	 * This function gives formatted wikitext for rendering a breadcrumb trail
	 * on a wikipage including the previous page, the parent page, and the next
	 * page within a hierarchy.
	 *
	 * @param string $previous: The name of the previous page in the hierarchy.
	 * @param string $parent: The name of the hierarchical parent page in the
	 *  hierarchy.
	 * @param string $next: The name of the next page in the hierarchy.
	 * @param string $displayNameProperty: The name of the property that stores
	 *  the display name for a page when using context free page naming.
	 *
	 * @return string: Formatted wikitext which renders breadcrumbs on a page. 
	 */
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

	/**
	 * Renders a wikitext formatted hierarchy on a page.
	 *
	 * This function implements the hierarchy tag extension for rendering a 
	 * hierarchical representation of pages within a wiki. Hierarchy data is
	 * taken as wikitext within the <hierarchy> tag, parsed into HTML and passed
	 * to the javascript code for rendering.
	 *
	 * @param string $input: Wikitext hierarchy data
	 * @param array $attributes: List of optional attributes for customizing the
	 *  display of the hierarchy. The optional attributes are:
	 *   - collapsed - the hierarchy should initially be collapsed
	 *   - displaynameproperty - content free page naming is enabled and display
	 *     names should be used instead of page names when displaying the hierarchy.
	 *   - numbered - rows of the hierarchy should be given section numbers.
	 * @param $parser: Parser 
	 * @param $frame: Frame
	 *
	 * @return string: Html div that will contain the rendered hierarchy.
	 */
	public function renderHierarchy( $input, $attributes, $parser, $frame ) {
		$hierarchyName = 'HierarchyDiv' . self::$m_hierarchy_num;
		self::$m_hierarchy_num++;

		if ( isset( $attributes['collapsed'] ) ) {
			$collapsed = htmlspecialchars( $attributes['collapsed'] );
			if ( $collapsed === 'collapsed' ) {
				$collapsed = 'true';
			}
		} else	{
			$collapsed = 'false';
		}

		if ( isset( $attributes['displaynameproperty'] ) ) {
			$displayNameProperty =
				htmlspecialchars( $attributes['displaynameproperty'] );
		} else	{
			$displayNameProperty = '';
		}

		if ( isset( $attributes['numbered'] ) ) {
			$numbered = htmlspecialchars( $attributes['numbered'] );
			if ( $numbered === 'numbered' ) {
				$numbered = 'true';
			}
		} else {
			$numbered = 'false';
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

	/**
	 * This function will find all link placeholders within a hierarchy and
	 * replace them with html anchors.
	 *
	 * @param string $hierarchy: Wikitext formatted hierarchy containing some
	 *  link placeholders (e.g. <!--LINK 0:0-->)
	 *
	 * @return string: Wikitext formatted hierarchy where with all the link
	 *  placeholders removed and replaced by html anchors.
	 */
	private function anchorLinkHolders( $hierarchy ) {
		$pattern = '#<!--LINK \d+:\d+-->#';
		$numMatches = preg_match_all( $pattern, $hierarchy, $matches );
		if ( $numMatches !== false ) {
			foreach ( $matches[0] as $link ) {
				$hierarchy = str_replace( "$link", "<a>$link</a>", $hierarchy );
			}
		}

		return $hierarchy;
	}

	/**
	 * Parse a hierarchy into html.
	 *
	 * @param string $input: WikiText hierarchy.
	 * @param string $displayNameProperty: Property containing page display names
	 *  when content free page naming is enabled.
	 * @param string $data: Dummy variable.
	 * @param function $callback: Function for processing links.
	 *
	 * @return string: Updated HTML formatted hierarchy with functional links.
	 */
	public static function parseHierarchy( $input, $displayNameProperty, &$data,
		$callback ) {
		$hierarchy = htmlspecialchars_decode( $input );
		$newlines = array( "\n", "\r" );
		$hierarchy = str_replace( $newlines, '', $hierarchy );
		$pattern = '/<a>([^<]*)<\/a>/i';
		$numMatches = preg_match_all( $pattern, $hierarchy, $matches );
		if ( $numMatches !== false ) {
			foreach ( $matches[1] as $pageName ) {
				$link = $callback( trim( $pageName ), $displayNameProperty, $data );
				$hierarchy = str_replace( "<a>$pageName</a>", $link, $hierarchy );
			}
		}
		return $hierarchy;
	}

	/**
	 * This function will return the value of the specified property from the
	 * given page.
	 *
	 * @param string $page: Name of the page from which to retrieve a property.
	 * @param string $property: Name of the property that should be returned.
	 *
	 * @return string: The value of the specified property from the given page
	 *  or the empty string if the property does not exist.
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
		return '';
	}

	/**
	 * This function gives the display name for the specified page when using
	 * content free page names.
	 *
	 * @param string $page: Name of the page.
	 * @param string $displayNameProperty: Name of the property that stores
	 *  display names for pages when content free page naming is active.
	 *
	 * @return string: The display name of the specified page.
	 */
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
	 * Returns all the page names found in the hierarchy.
	 *
	 * This function will search through the hierarchy to find all the page names
	 * (defined by [[]] syntax) and return them as an array without [[]] syntax.
	 * 
	 * @param string $hierarchy: A wikitext formatted hierarchy.
	 *
	 * @return array: An array of all the page names found within the hierarchy.
	 *  If no page name are found, then an empty array is returned instead.
	 */
	public static function collectPageNamesFromHierarchy( $hierarchy ) {
		// use a regex to find all of the page names
		$numMatches = preg_match_all( HierarchyBuilder::PAGENAMEPATTERN, $hierarchy, $matches );
		return ( $numMatches > 0 ? $matches[1] : array() );
	}

	/**
	 * Updates a hierarchy so page links are shown using their display names.
	 *
	 * This function will run through the hierarchy and for each pageName link
	 * found, it will find the displayName for that pageName, and then update
	 * the link syntax so that the displayName will be shown instead.
	 *
	 * @param string $hierarchy: A wikitext formatted hierarchy.
	 * @param string $displayNameProperty: The name of the property containing
	 *  the page's display name.
	 *
	 * @return string: The wikitext formatted hierarchy after the links have
	 *  been updated to reflect the displayName instead of the page name.
	 *
	 * @example [[pageName]] -> [[pageName | displayName]]
	 */
	public static function updateHierarchyWithDisplayNames( $hierarchy, $displayNameProperty ) {
		$hierarchyPageNames = self::collectPageNamesFromHierarchy( $hierarchy );
		foreach ( $hierarchyPageNames as $pageName ) {
			$displayName = self::getPageDisplayName( $pageName, $displayNameProperty );
			$pageNameLink = '[[' . $pageName . ']]';
			$displayNameLink = '[[' . $pageName . ' | ' . $displayName . ']]';
			$hierarchy = str_replace( $pageNameLink, $displayNameLink, $hierarchy );
		}
		return $hierarchy;
	}

	/**
	 * Returns the section number for a page within a wikitext formatted hierarchy.
	 *
	 * This function will search a hierarchy for a target page name and will
	 * return the section number for the row which contains that page. The
	 * target is a simple page name and the requirement is that a matching row
	 * must consist only of a single link to the target page. (eg: [[$target]])
	 * We do not yet support non-page rows.
	 *
	 * @param string $hierarchyRoot: The root row of the hierarchy.
	 * @param string $wikiTextHierarchy: Wikitext formatted hierarchy.
	 * @param string $target: The page name of the page who's section number
	 *  must be returned.
	 *
	 * @return string: The section numer of the target page within the hierarchy.
	 */
	public static function getSectionNumberFromHierarchy( $wikiTextHierarchy, $target ) {
		$sectionNumber = self::getSectionNumberFromHierarchyHelper(
			'[[hierarchy_root]]' . "\n" . $wikiTextHierarchy, '', '', $target );
		return $sectionNumber;
	}

	/**
	 * Helper function for traversing a wikitext formatted hierarchy and computing
	 * a page's section number.
	 *
	 * This function will recursively traverse the given hierarchy/subhierarchy
	 * and search for the given target row. The target is a simple page name and
	 * the requirement is that a matching row must consist only of a single link
	 * to the target page. (eg: [[$target]]) We do not yet support non-page rows.
	 *
	 * @param string $wikiTextHierarchy: The hierarchy in wikitext.
	 * @param string $depth: A string containing the number of stars equal to
	 *  the current depth in the hierarchy.
	 * @param string $sectionNumber: The section number of the root of the current
	 *  subhierarchy.
	 * @param string $target: The page name of the page we're searching the 
	 *  hierarchy for.
	 *
	 * @return string: The section number of the page within the hierarchy. If
	 *  we cannot find the page within the hierarchy, then the empty string is
	 *  returned instead.
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
				$childNumber = $sectionNumber == '' ? $numberSuffix++ : $sectionNumber . '.' . $numberSuffix++;
				$targetNumber = self::getSectionNumberFromHierarchyHelper( $child, $depth . '*',
					$childNumber, $target );
				// if we find the target in this child branch then we can return
				// the target section number
				if ( $targetNumber != '' ) {
					return $targetNumber;
				}
			}
		}

		// if we can't find the target then return an empty section number
		return '';
	}

	/**
	 * This function takes a hierarchy and splits it into the root, and each of
	 * of the root's child subhierarchies. These are returned as an array with
	 * the root first and each of the root's child subhierarchies in order.
	 *
	 * @param string $wikiTextHierarchy: The hierarchy that needs to be split
	 *  into root, and the root's child subhierarchies.
	 * @param string $depth: The string representing the current depth of the
	 *  hierarchy root. It can be interpreted as the depth of the root of the
	 *  wikiTextHierarchy when viewed as a subhierarchy within another hierarchy.
	 *
	 * @return array: An array with the root as the first element and each
	 *  child subhierarchy as a subsequent element. 
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
