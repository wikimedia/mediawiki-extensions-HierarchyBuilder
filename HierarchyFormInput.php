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

class HierarchyFormInput extends SFFormInput {

	public function __construct( $inputNumber, $curValue, $inputName,
		$disabled, $otherArgs ) {
		parent::__construct( $inputNumber, $curValue, $inputName, $disabled,
			$otherArgs );
		$this->addJsInitFunctionData( 'editHierarchyInit',
			$this->setupJsInitAttribs() );
	}

	public static function getName() {
		return 'hierarchy';
	}

	/**
	 * Retrieves all the necessary information for the initialization of the 
	 * javascript Edit Hierarchy user interface.
	 *
	 * @return array: JSON encoded parameters for calling editHierarchy JS code.
	 */
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

		$pageArray = $output === "" ? array() : array_map( 'trim', explode( ',', $output ) );

		if ( array_key_exists( HierarchyBuilder::TITLEICONPROPERTY, $this->mOtherArgs ) ) {
			$titleiconProperty = $this->mOtherArgs[HierarchyBuilder::TITLEICONPROPERTY];
		} else {
			$titleiconProperty = '';
		}

		if ( array_key_exists( 'hideinfo', $this->mOtherArgs ) ) {
			$hideinfoProperty = $this->mOtherArgs['hideinfo'];
		} else {
			$hideinfoProperty = 'false';
		}

		$pages = array();
		foreach ( $pageArray as $key => $value ) {
			$pages[$value] =
				HierarchyBuilder::getPageDisplayName( $value );
		}

		// This loop will removed pages from the unselected pages list if we can
		// find it in the hierarchy already.
		foreach ( $pages as $key => $value ) {
			if ( strpos( '[[' . $this->mCurrentValue . ']]', $key ) !== false ) {
				unset( $pages[$key] );
			}
		}

		$unusedpagesmessage = wfMessage( 'hierarchybuilder-unusedpages' )->text();
		$unusedpages = "<ul>" .
			"<li class='hierarchy_root'><a>$unusedpagesmessage</a>" .
			"<ul>";
		foreach ( $pages as $key => $value ) {
			$name = $value;
			$namehtml = "<a>$name<span style=display:none>$key</span></a>";
			
			if ($titleiconProperty != '') {
				$pagetitleicons = HierarchyBuilder::getPageTitleIcons( $key, $titleiconProperty );
				$pagetitleiconshtml = HierarchyBuilder::getIconHTML( $pagetitleicons );
			} else {
				$pagetitleiconshtml = '';
			}

			$pagerowhtml = "<li>" . $pagetitleiconshtml . $namehtml . "</li>";
			$unusedpages .= $pagerowhtml;
		}
		$unusedpages .= "</ul></li></ul>";

		$hierarchy = $this->wikitext2Html($this->mCurrentValue, $titleiconProperty);

		global $sfgFieldNum;
		$this->mDivId = "hierarchy_$sfgFieldNum";
		$this->mInputId = "input_$sfgFieldNum";
		$jsattribs = array(
			'divId' => $this->mDivId,
			'hierarchy' => $hierarchy,
			//'pages' => $pages,
			'pages' => $unusedpages,
			'isDisabled' => $this->mIsDisabled,
			'hideinfo' => $hideinfoProperty,
			'isMandatory' => array_key_exists( 'mandatory', $this->mOtherArgs ),
			'revealEditMessage' =>
				wfMessage( 'hierarchybuilder-reveal-editmessage' )->text(),
			'message' =>
				wfMessage( 'hierarchybuilder-editmessage', $this->mCategory )->text(),
			'errormessage' =>
				wfMessage( 'hierarchybuilder-edit-error-message' )->text(),
			'hierarchyroot' =>
				wfMessage( 'hierarchybuilder-hierarchyroot' )->text(),
			'unusedpages' =>
				wfMessage( 'hierarchybuilder-unusedpages' )->text()
		);
		return json_encode( $jsattribs );
	}

	public function wikitext2Html($hierarchy, $titleiconproperty) {
		$rootedhierarchy = "[[".wfMessage( 'hierarchybuilder-hierarchyroot' )->text()."]]\n" . $hierarchy;
		return "<ul>" . $this->wikitext2HtmlHelper($rootedhierarchy, 0, $titleiconproperty) . "</ul>";	
	}

	public function wikitext2HtmlHelper($subhierarchy, $depth, $titleiconproperty) {
		$depthpattern = '/^' . '\*'.'{'.$depth.'}' . '([^\*]+)' . '/m';
		$nummatches = preg_match_all( $depthpattern, $subhierarchy, $matches );
		if ($nummatches < 1) {
			return '';
		}
		$rootrow = $matches[1][0];
		
		$childdepth = $depth + 1;
		$childdepthpattern = '/^' . '\*'.'{'.$childdepth.'}' . '([^\*]+)' . '/m';
		$nummatches = preg_match_all( $childdepthpattern, $subhierarchy, $matches );
		$childrows = $nummatches > 0 ? $matches[0] : array();
		$childsubhierarchies = array_slice( preg_split( $childdepthpattern, $subhierarchy ), 1 ); // chop off element 0 which is the root
		
		//extract the root pagename 
		$numMatches = preg_match_all( HierarchyBuilder::PAGENAMEPATTERN, $rootrow, $matches );
		$rootpagename = $matches[1][0]; // this is just the pagename excluding the [[]] formatting
		if ($depth == 0) {
			$rootHtml = "<a>$rootpagename<span style=display:none>$rootpagename</span></a>";
		} else {

			if ($titleiconproperty != '') {
				$roottitleicons = HierarchyBuilder::getPageTitleIcons( $rootpagename, $titleiconproperty );
				$roottitleiconshtml = HierarchyBuilder::getIconHTML( $roottitleicons );
			} else {
				$roottitleiconshtml = '';
			}
			$rootdisplayname = HierarchyBuilder::getPageDisplayName($rootpagename);
			$rootrowhtml = "<a>$rootdisplayname<span style=display:none>$rootpagename</span></a>";
			$rootHtml = $roottitleiconshtml . $rootrowhtml;
		}
		
		$html = $depth == 0 ? "<li class='hierarchy_root'>" : '<li>';
		$html .= $rootHtml;
		if ( count($childrows) > 0 ) {
			$html .= '<ul>';
			for ( $i = 0; $i < count($childrows); $i++ ) {
				$childhierarchy = $childrows[$i] . "\n" . $childsubhierarchies[$i];
				$html .= $this->wikitext2HtmlHelper($childhierarchy, $depth+1, $titleiconproperty);
			}
			$html .= '</ul>';
		}
		$html .= '</li>';
			
		return $html;
	}
	
	/**
	 * Get error messages for display.
	 *
	 * @return HTML::element: HTML formatted message for display.
	 */
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
	}

	public function getResourceModuleNames() {
		return array(
			'ext.HierarchyBuilder.edit'
		);
	}
}
