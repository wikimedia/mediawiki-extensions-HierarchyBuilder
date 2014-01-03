<?php

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/Reading/Reading.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of Reading is only compatible with MediaWiki 1.21 or above.');
}

define("NS_READING_ITEM", 190);
define("NS_READING_ITEM_TALK", 191);
define("NS_READING_AUTHOR", 192);
define("NS_READING_AUTHOR_TALK", 193);
define("NS_READING_TAG", 194);
define("NS_READING_TAG_TALK", 195);
define("NS_READING_REVIEW", 196);
define("NS_READING_REVIEW_TALK", 197);
define("NS_READING_READING_LIST", 198);
define("NS_READING_READING_LIST_TALK", 199);

$wgExtraNamespaces[NS_READING_ITEM] = "Item";
$wgExtraNamespaces[NS_READING_ITEM_TALK] = "Item_talk";
$wgExtraNamespaces[NS_READING_AUTHOR] = "Author";
$wgExtraNamespaces[NS_READING_AUTHOR_TALK] = "Author_talk";
$wgExtraNamespaces[NS_READING_TAG] = "Tag";
$wgExtraNamespaces[NS_READING_TAG_TALK] = "Tag_talk";
$wgExtraNamespaces[NS_READING_REVIEW] = "Review";
$wgExtraNamespaces[NS_READING_REVIEW_TALK] = "Review_talk";
$wgExtraNamespaces[NS_READING_READING_LIST] = "Reading_List";
$wgExtraNamespaces[NS_READING_READING_LIST_TALK] = "Reading_List_talk";

$wgNamespaceProtection[NS_READING_ITEM] = array( 'editreadingitem' );
$wgNamespaceProtection[NS_READING_AUTHOR] = array( 'editreadingitem' );
$wgNamespaceProtection[NS_READING_TAG] = array( 'editreadingitem' );
$wgNamespaceProtection[NS_READING_REVIEW] = array( 'reviewreadingitem' );
$wgNamespaceProtection[NS_READING_READING_LIST] = array( 'editreadinglist' );

$wgGroupPermissions['sysop']['addreadingitem'] = true;
$wgGroupPermissions['user']['editreadingitem'] = true;
$wgGroupPermissions['user']['reviewreadingitem'] = true;
$wgGroupPermissions['user']['editreadinglist'] = true;

$wgContentNamespaces[] = NS_READING_ITEM;
$wgContentNamespaces[] = NS_READING_AUTHOR;
$wgContentNamespaces[] = NS_READING_TAG;
$wgContentNamespaces[] = NS_READING_REVIEW;
$wgContentNamespaces[] = NS_READING_READING_LIST;

$wgNamespacesWithSubpages[NS_READING_REVIEW] = true;

$wgNamespacesToBeSearchedDefault[NS_READING_ITEM] = true;
$wgNamespacesToBeSearchedDefault[NS_READING_ITEM_TALK] = false;
$wgNamespacesToBeSearchedDefault[NS_READING_AUTHOR] = true;
$wgNamespacesToBeSearchedDefault[NS_READING_AUTHOR_TALK] = false;
$wgNamespacesToBeSearchedDefault[NS_READING_TAG] = true;
$wgNamespacesToBeSearchedDefault[NS_READING_TAG_TALK] = false;
$wgNamespacesToBeSearchedDefault[NS_READING_REVIEW] = true;
$wgNamespacesToBeSearchedDefault[NS_READING_REVIEW_TALK] = false;
$wgNamespacesToBeSearchedDefault[NS_READING_READING_LIST] = true;
$wgNamespacesToBeSearchedDefault[NS_READING_READING_LIST_TALK] = false;

$smwgNamespacesWithSemanticLinks[NS_READING_ITEM] = true;
$smwgNamespacesWithSemanticLinks[NS_READING_ITEM_TALK] = false;
$smwgNamespacesWithSemanticLinks[NS_READING_AUTHOR] = true;
$smwgNamespacesWithSemanticLinks[NS_READING_AUTHOR_TALK] = false;
$smwgNamespacesWithSemanticLinks[NS_READING_TAG] = true;
$smwgNamespacesWithSemanticLinks[NS_READING_TAG_TALK] = false;
$smwgNamespacesWithSemanticLinks[NS_READING_REVIEW] = true;
$smwgNamespacesWithSemanticLinks[NS_READING_REVIEW_TALK] = false;
$smwgNamespacesWithSemanticLinks[NS_READING_READING_LIST] = true;
$smwgNamespacesWithSemanticLinks[NS_READING_READING_LIST_TALK] = false;

$wgExtensionCredits[ 'specialpage' ][] = array(
	'name' => 'Reading',
	'version' => '1.0',
	'author' => 'Cindy Cicalese',
	'descriptionmsg' => 'reading-desc'
);
 
$wgSpecialPages['AddReadingItem'] = 'AddReadingItem'; 
$wgSpecialPageGroups['AddReadingItem'] = 'other';
$wgExtensionMessagesFiles['AddReadingItem'] = __DIR__ . '/Reading.i18n.php';

$wgResourceModules['ext.Reading'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'Reading',
	'scripts' => 'Reading.js',
	'dependencies' => array(
		'jquery.wikiEditor',
		'jquery.wikiEditor.toolbar',
		'jquery.wikiEditor.toolbar.config'
	)
);

class AddReadingItem extends SpecialPage {

	public function __construct() {
		parent::__construct('AddReadingItem', 'addreadingitem');
	}

	public function execute($par) {

		if (!$this->userCanExecute($this->getUser())) {
			$this->displayRestrictionError();
			return;
		}

		$request = $this->getRequest();
		$this->setHeaders();
 
		$phase = $request->getText('phase');
		$itemtitle = $request->getText('itemtitle');
		$synopsis = $request->getText('synopsis');
		if (is_null($phase) || strlen($phase) == 0) {
			$this->showForm(false, $request);
		} else if (is_null($itemtitle) || strlen($itemtitle) == 0 ||
			is_null($synopsis) || strlen($synopsis) == 0) {
			$this->showForm(true, $request);
		} else {
			$this->addItem($request);
		}
	}

	private function showForm($error, $request) {
		global $wgScript;
		$html = Html::openElement('form', array(
				'method' => 'post',
				'action' => $wgScript,
				'enctype' => 'multipart/form-data')
			) .
			Html::hidden( 'title', $this->getTitle()->getPrefixedText() ) .
			Html::hidden( 'phase', 2 ) .
			'<table class="formtable"><tbody>';
		if ($error == true) {
			$html .= '<tr><td colspan="4" style="font-weight:bold;color:red">' .
				'ERROR: Title and Synopsis may not be blank.</td></tr>';
		}

		$itemtitle = $request->getText('itemtitle');
		$authors = $request->getText('authors');
		$tags = $request->getText('tags');
		$year = $request->getText('year');
		$publisher = $request->getText('publisher');
		$type = $request->getText('type');
		$urls = $request->getText('urls');
		$cover = $request->getText('cover');
		$synopsis = $request->getText('synopsis');

		list($label, $input) =
			Xml::inputLabelSep('Title:', 'itemtitle', 'itemtitle', 100, $itemtitle);
		$html .= '<tr><td style="font-weight:bold">' . $label .
			'</td><td colspan="3">' . $input . '</td></tr>';
		$instructions = "<b>Last, First name</b><br>one author per line";
		$label = Xml::label('Author(s):', 'authors');
		$input = Xml::textarea('authors', $authors, 40, 5);
		$html .= '<tr><td style="vertical-align:top">' .
			'<span style="font-weight:bold">' . $label . '</span>' .
			'<br><em>' . $instructions . '</em></td><td>' . $input . '</td>';
		$instructions = "one tag per line";
		$label = Xml::label('Tag(s):', 'tags');
		$input = Xml::textarea('tags', $tags, 40, 5);
		$html .= '<td style="vertical-align:top">' .
			'<span style="font-weight:bold">' . $label . '</span>' .
			'<br><em>' . $instructions . '</em></td><td>' . $input . '</td></tr>';
		$attribs = array(
			'maxlength' => 4
		);
		list($label, $input) =
			Xml::inputLabelSep('Publication year:', 'year', 'year', 4, $year,
			$attribs);
		$html .= '<tr><td style="font-weight:bold">' . $label . '</td><td>' .
			$input . '</td></tr>';
		list($label, $input) =
			Xml::inputLabelSep('Publisher:', 'publisher', 'publisher', 50,
			$publisher);
		$html .= '<tr><td style="font-weight:bold">' . $label . '</td><td>' .
			$input . '</td></tr>';
		$label = Xml::label('Item type:', 'type');
		$types = explode(',', $this->getTypes());
		if (strlen($type) > 0) {
			$default = $type;
		} else if (count($types) > 0) {
			$default = $types[0];
		} else {
			$default = '';
		}
		$options = implode("\n", $types);
		$option = Xml::listDropDown('type', $options, 'other', $default);
		$html .= '<tr><td style="font-weight:bold">' . $label . '</td><td>' .
			$option . '</td></tr>';
		$instructions = "one URL per line";
		$label = Xml::label('Item URL(s):', 'urls');
		$input = Xml::textarea('urls', $urls, 100, 3);
		$html .= '<td style="vertical-align:top">' .
			'<span style="font-weight:bold">' . $label . '</span>' .
			'<br><em>' . $instructions . '</em></td><td colspan="3">' .
			$input . '</td></tr>';
		list($label, $input) =
			Xml::inputLabelSep('Cover Image URL:', 'cover', 'cover', 100, $cover);
		$html .= '<tr><td style="font-weight:bold">' . $label .
			'</td><td colspan="3">' . $input . '</td></tr>';
		$label = Xml::label('Synopsis:', 'synopsis');
		$input = Xml::textarea('synopsis', $synopsis, 100, 10, array(
			'class' => 'wikieditor'
		));
		$html .= '<tr><td style="vertical-align:top;font-weight:bold">' . $label .
			'</td><td colspan="3">' .	$input . '</td></tr>';
		$html .=
			'<tr><td>' . Xml::submitButton('Save') . '</td></tr>' .
			'</tbody></table>' .
			Html::closeElement('form');

		$output = $this->getOutput();

		$output->addModules('ext.Reading');

		$output->addHTML($html);

		$script =<<<END
mw.loader.using(['ext.Reading'], function () {
});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";
		$output->addScript($script);

		return $output;

	}

	private function getTypes() {
		$params = array();
		$params[] = "[[Property:Type]]";
		$params[] = "?Allows value";
		$params[] = "mainlabel=-";
		$params[] = "headers=hide";
		$params[] = "searchlabel=";
		$output = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI);
		return $output;
	}

	private function findReadingPage($category, $name) {
		$params = array();
		$params[] = "[[Category:$category]][[Name::$name]]";
		$params[] = "headers=hide";
		$params[] = "link=none";
		$params[] = "searchlabel=";
		$params[] = "limit=1";
		$params[] = "default=";
		$output = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI);
		$output = trim($output);
	if (strlen($output) > 0) {
		return $output;
	}
		return false;
	}

	private function addItem($request) {

		$output = $this->getOutput();

		$itemtitle = htmlspecialchars($request->getText('itemtitle'));
		$authors = explode("\n", $request->getText('authors'));
		$author_list = $this->parseAuthors($authors);
		$tags = explode("\n", $request->getText('tags'));
		$tag_list = $this->parseTags($tags);
		$year = htmlspecialchars($request->getText('year'));
		$publisher = htmlspecialchars($request->getText('publisher'));
		$type = $request->getText('type');
		$urls = explode("\n", $request->getText('urls'));
		$url_list = '';
		foreach ($urls as $url) {
			$url = trim($url);
			if (strlen($url) > 0) {
				$url_list .= $url . ' ';
			}
		}
		$cover = $request->getText('cover');
		$synopsis = str_replace("\n", "<br>",
			htmlspecialchars($request->getText('synopsis')));

		$wikitext = "{{Item";
		$wikitext .= "|Title=" . $itemtitle;
		if (strlen($author_list) > 0) {
			$wikitext .= "|Authors=" . $author_list;
		}
		if (strlen($tag_list) > 0) {
			$wikitext .= "|Tags=" . $tag_list;
		}
		if (strlen($year) > 0) {
			$wikitext .= "|Year=" . $year;
		}
		if (strlen($publisher) > 0) {
			$wikitext .= "|Publisher=" . $publisher;
		}
		if (strlen($type) > 0 && $type != 'other') {
			$wikitext .= "|Type=" . $type;
		}
		if (strlen($url_list) > 0) {
			$wikitext .= "|URLs=" . $url_list;
		}
		if (strlen($cover) > 0) {
			$wikitext .= "|Cover=" . $cover;
		}
		if (strlen($synopsis) > 0) {
			$wikitext .= "|Synopsis=" . $synopsis;
		}
		$wikitext .= "}}";

		$pagename = $this->addReadingPage(NS_READING_ITEM, $wikitext);
		$output->addWikiText('<p style="font-weight:bold">' .
			"Added item [[$pagename]].</p>");
	}

	private function parseAuthors($authors) {

		$author_list = "";

		foreach ($authors as $author) {

			$author = preg_replace('/\s+/', ' ', $author);
			$author = trim($author);
			$author = preg_replace('/[\s,]*$/', '', $author);

			if (strlen($author) > 0) {
				$pagename = $this->findReadingPage("Authors", $author);
				if ($pagename == false) {
					$pagename = $this->addReadingPage(NS_READING_AUTHOR,
						"{{Author|Name=" . htmlspecialchars($author) . "}}");
				}
				if (strlen($author_list) != 0) {
					$author_list .= ",";
				}
				$author_list .= $pagename;
			}
		}

		return $author_list;
	}

	private function parseTags($tags) {
 
		$tag_list = "";

		foreach ($tags as $tag) {

			$tag = preg_replace('/\s+/', ' ', $tag);
			$tag = trim($tag);
			$tag = preg_replace('/[\s,]*$/', '', $tag);

			if (strlen($tag) > 0) {
				$pagename = $this->findReadingPage("Tags", $tag);
				if ($pagename == false) {
					$pagename = $this->addReadingPage(NS_READING_TAG,
						"{{Tag|Tag=" . htmlspecialchars($tag) . "}}");
				}
				if (strlen($tag_list) != 0) {
					$tag_list .= ",";
				}
				$tag_list .= $pagename;
			}
		}

		return $tag_list;
	}

	private function addReadingPage($namespace, $text) {
		$id = 0;
		do {
			$id++;
			$title = Title::makeTitle($namespace, $id);
		} while ($title->exists());
		$page = new WikiPage($title);
		$summary = 'Created Page.';
		$page->doEdit($text, $summary, EDIT_NEW);
		global $wgExtraNamespaces;
		return $wgExtraNamespaces[$namespace] . ":" .	$id;
	}
}
