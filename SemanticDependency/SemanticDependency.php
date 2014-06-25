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

if( !defined( 'MEDIAWIKI' ) ) die( "This is an extension to the MediaWiki 
	package and cannot be run standalone." );
 
# credits
$wgExtensionCredits['parserhook'][] = array (
	'name' => 'SemanticDependency',
	'version' => '1.0',
	'author' => "Cindy Cicalese",
	'description' => "Declare that another page is dependent upon the current page"
);
 
$wgHooks['ParserFirstCallInit'][] = 'efSemanticDependencyParserFunction_Setup';
$wgHooks['PageContentSaveComplete'][] = 'SemanticDependency::saveComplete';

function efSemanticDependencyParserFunction_Setup (& $parser) {
	global $wgSemanticDependencyProperties;
	if (!isset($wgSemanticDependencyProperties)) {
		$wgSemanticDependencyProperties = array();
	}
	return true;
}

class SemanticDependency {

	public static function saveComplete($article, $user, $content, $summary,
		$isMinor, $isWatch, $section, $flags, $revision, $status, $baseRevId) {

		$this_title = $article->getTitle();
		$this_namespace = $this_title->getNamespace();

		global $wgSemanticDependencyProperties;
		if (array_key_exists($this_namespace,
			$wgSemanticDependencyProperties)) {

			$property = $wgSemanticDependencyProperties[$this_namespace];
	
			$store = smwfGetStore();
			$this_page = SMWDIWikiPage::newFromTitle($this_title);
			$data = $store->getSemanticData($this_page);
			$values = $data->getPropertyValues(
				SMWDIProperty::newFromUserLabel($property));
	
			foreach ($values as $value) {
				if ($value->getDIType() === SMWDataItem::TYPE_WIKIPAGE) {
					$dependent_page_id = Revision::newFromTitle(
						Title::newFromText($value->getDBkey(),
						$value->getNamespace()))->getPage();
					$store->refreshData($dependent_page_id, 0, false, false);
					WikiPage::newFromID($dependent_page_id)->doPurge();
				}
			}
		}

		return true;
	}
}
