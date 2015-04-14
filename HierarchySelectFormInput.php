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
		global $HierarchyBuilder_LegacyMode;

		if ( array_key_exists( 'pagename', $this->mOtherArgs ) ) {
			$this->mPageName = $this->mOtherArgs['pagename'];
		} else {
			$this->mPageName = null;
			return;
		}

		if ( array_key_exists( 'propertyname', $this->mOtherArgs ) ) {
			$this->mPropertyName = $this->mOtherArgs['propertyname'];
		} else {
			$this->mPropertyName = null;
			return;
		}

		if ( array_key_exists( 'collapsed', $this->mOtherArgs ) ) {
			$this->mCollapsed = $this->mOtherArgs['collapsed'];
			if ( $this->mCollapsed !== 'true' && $this->mCollapsed !== 'false' ) {
				$this->mCollapsed = null;
				return;
			}
		} else {
			$this->mCollapsed = 'false';
		}

		if ( array_key_exists( 'threestate', $this->mOtherArgs ) ) {
			$this->mThreestate = $this->mOtherArgs['threestate'];
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


		if ( array_key_exists( 'displaynameproperty', $this->mOtherArgs ) ) {
			$displaynameproperty = $this->mOtherArgs['displaynameproperty'];
		} else {
			$displaynameproperty = '';
		}

		if ( array_key_exists( 'width', $this->mOtherArgs ) ) {
			$this->mWidth = $this->mOtherArgs['width'];
		} else {
			$this->mWidth = '';
		}

		if ( array_key_exists( 'height', $this->mOtherArgs ) ) {
			$this->mHeight = $this->mOtherArgs['height'];
		} else {
			$this->mHeight = '';
		}

		$hierarchy = HierarchyBuilder::getPropertyFromPage( $this->mPageName,
			$this->mPropertyName );
		$hierarchy = HierarchyBuilder::updateHierarchyWithDisplayNames( $hierarchy,
			$displaynameproperty );

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
			'height' => $this->mHeight,
			'legacyMode' => $HierarchyBuilder_LegacyMode
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
