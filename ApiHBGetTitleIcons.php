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

class ApiHBGetTitleIcons extends ApiBase {
	public function __construct( $main, $action ) {
		parent::__construct( $main, $action );
	}

	public function execute() {
		$pageTitle = $this->getMain()->getVal( 'pageTitle' );
		$titleIconProperty = $this->getMain()->getVal( 'titleIconProperty' );

		//global $TitleIcon_TitleIconPropertyName;
		$myTitleIconName = $titleIconProperty;

		$pageNameWithSpaces = str_replace( '_', ' ', $pageTitle );
		$titleIconWithSpaces = str_replace( '+', ' ', $myTitleIconName );

		$api = new ApiMain(
			new DerivativeRequest(
				$this->getRequest(),
				array(
					'action' => 'askargs',
					'conditions' => $pageTitle,
					'printouts' => $titleIconWithSpaces
				)
			),
			false
		);

		$api->execute();
		$data = $api->getResultData();

		if ( is_array( $data["query"]["results"] ) && count( $data["query"]["results"] ) == 0 ) {
			$this->getResult()->addValue( null, $this->getModuleName(),
				array( 'pageTitle' => $pageTitle,
					'titleIcons' => array()
						) );

			return true;
		}

		if ( array_key_exists( $pageNameWithSpaces, $data["query"]["results"] ) )
			$titleIconNames = $data["query"]["results"]["$pageNameWithSpaces"]["printouts"]["$titleIconWithSpaces"];
		else {
			$key = array_shift( array_keys( $data["query"]["results"] ) );
			$titleIconNames = $data["query"]["results"][$key]["printouts"]["$titleIconWithSpaces"];
		}
		$titleIconURLs = array();

		foreach ( $titleIconNames as $name ) {

			$api = new ApiMain(
				new DerivativeRequest(
					$this->getRequest(),
					array(
						'action' => 'query',
						'titles' => 'File:' . $name,
						'prop' => 'imageinfo',
						'iiprop' => 'url'
					)
				),
				false
			);

			$api->execute();
			$data = $api->getResultData();
			$keys = array_keys( $data['query']['pages'] );
			$key = array_shift( $keys );
			$url = $data["query"]["pages"][$key]["imageinfo"][0]["url"];
			$titleIconURLs[] = $url;
		}

		$this->getResult()->addValue( null, $this->getModuleName(),
			array( 'pageTitle' => $pageTitle,
				'titleIcons' => $titleIconURLs
					) );

		return true;

	}
	public function getDescription() {
		return "Get the URLs of all Title Icons for the page, if any exist.

Note that because the returned value is a JSON object, you must specify ".
"format=json in this query; the default xml format will return only an error.";
	}
	public function getAllowedParams() {
		return array(
			'pageTitle' => array(
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true
			),
			'titleIconProperty' => array(
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => true
			)
		);
	}
	public function getParamDescription() {
		return array(
			'pageTitle' => 'title of the page whose title icons you wish to retrieve',
			'titleIconProperty' => 'name of the property containing the title icon for a page.'
		);
	}
	public function getExamples() {
		return array(
			'api.php?action=getTitleIcons&pageTitle=Test_Page_C&titleIconProperty=Logo_Link&format=jsonfm' );
	}
	public function getHelpUrls() {
		return '';
	}
}
