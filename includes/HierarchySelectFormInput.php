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

class HierarchySelectFormInput extends SFFormInput {

	public function __construct( $inputNumber, $curValue, $inputName,
		$disabled, $otherArgs ) {
		parent::__construct( $inputNumber, $curValue, $inputName, $disabled,
			$otherArgs );
		$this->addJsInitFunctionData( 'selectFromHierarchyInit',
			$this->setupJsInitAttribs() );
	}

	public static function getName() {
		return 'hierarchySelect';
	}

	/**
	 * Gets necessary information to initialize the parameters used to call the
	 * select from hierarchy JS user interface code.
	 *
	 * @return string: JSON encoded parameters for select from hierarchy JS code.
	 */
	protected function setupJsInitAttribs() {
		//global $HierarchyBuilder_LegacyMode;

		if ( array_key_exists( HierarchyBuilder::PAGENAME, $this->mOtherArgs ) ) {
			$this->mPageName = $this->mOtherArgs[HierarchyBuilder::PAGENAME];
		} else {
			$this->mPageName = null;
			return;
		}

		if ( array_key_exists( HierarchyBuilder::PROPERTYNAME, $this->mOtherArgs ) ) {
			$this->mPropertyName = $this->mOtherArgs[HierarchyBuilder::PROPERTYNAME];
		} else {
			$this->mPropertyName = null;
			return;
		}

		if ( array_key_exists( HierarchyBuilder::TITLEICONPROPERTY, $this->mOtherArgs ) ) {
			$this->titleiconProperty = $this->mOtherArgs[HierarchyBuilder::TITLEICONPROPERTY];
		} else {
			$this->titleiconProperty = null;
		}

		if ( array_key_exists( HierarchyBuilder::COLLAPSED, $this->mOtherArgs ) ) {
			$this->mCollapsed = $this->mOtherArgs[HierarchyBuilder::COLLAPSED];
			if ( $this->mCollapsed ) {
				$this->mCollapsed = 'true';
			}
			if ( $this->mCollapsed !== 'true' && $this->mCollapsed !== 'false' ) {
				$this->mCollapsed = null;
				return;
			}
		} else {
			$this->mCollapsed = 'false';
		}

		if ( array_key_exists( HierarchyBuilder::THREESTATE, $this->mOtherArgs ) ) {
			$this->mThreestate = $this->mOtherArgs[HierarchyBuilder::THREESTATE];
			if ( $this->mThreestate ) {
				$this->mThreestate = 'true';
			}
			if ( $this->mThreestate !== 'true' && $this->mThreestate !== 'false' ) {
				$this->mThreestate = null;
				return;
			}
		} else {
			$this->mThreestate = 'false';
		}

		if ( array_key_exists( HierarchyBuilder::WIDTH, $this->mOtherArgs ) ) {
			$this->mWidth = $this->mOtherArgs[HierarchyBuilder::WIDTH];
		} else {
			$this->mWidth = '';
		}

		if ( array_key_exists( HierarchyBuilder::HEIGHT, $this->mOtherArgs ) ) {
			$this->mHeight = $this->mOtherArgs[HierarchyBuilder::HEIGHT];
		} else {
			$this->mHeight = '';
		}

		$hierarchy = HierarchyBuilder::getPropertyFromPage(
			$this->mPageName,
			$this->mPropertyName
		);
		$hierarchy = HierarchyBuilder::parseWikitext2Html(
			$hierarchy,
			$this->titleiconProperty
		);

		$selectedItems = array_map( 'trim', explode( ',', $this->mCurrentValue ) );

		global $sfgFieldNum;
		$this->mDivId = "hierarchy_$sfgFieldNum";
		$this->mInputId = "input_$sfgFieldNum";
		$jsattribs = array(
			'divId' => $this->mDivId,
			'hierarchy' => $hierarchy,
			'selectedItems' => $selectedItems,
			'isDisabled' => $this->mIsDisabled,
			'isMandatory' => array_key_exists( 'mandatory', $this->mOtherArgs ),
			'collapsed' => $this->mCollapsed == 'true' ? true : false,
			'threestate' => $this->mThreestate == 'true' ? true : false,
			'width' => $this->mWidth,
			'height' => $this->mHeight//,
			//'legacyMode' => $HierarchyBuilder_LegacyMode
		);

		return json_encode( $jsattribs );
	}

	/**
	 * Gets eror messages for display.
	 */
	public function getHtmlText() {

		if ( $this->mPageName == null ) {
			return Html::element( 'b', array(),
				wfMessage( 'hierarchybuilder-missing-page-name' )->text() );
		}

		if ( $this->mPropertyName == null ) {
			return Html::element( 'b', array(),
				wfMessage( 'hierarchybuilder-missing-property-name' )->text() );
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
		$params[HierarchyBuilder::PAGENAME] = array(
			'name' => HierarchyBuilder::PAGENAME,
			'type' => 'string',
			'description' =>
				wfMessage( 'hierarchybuilder-pagename-desc' )->text()
		);
		$params[HierarchyBuilder::PROPERTYNAME] = array(
			'name' => HierarchyBuilder::PROPERTYNAME,
			'type' => 'string',
			'description' =>
				wfMessage( 'hierarchybuilder-propertyname-desc' )->text()
		);
	}

	public function getResourceModuleNames() {
		return array(
			'ext.HierarchyBuilder.select'
		);
	}
}
