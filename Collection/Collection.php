<?php

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/Collection/Collection.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of Collection is only compatible with MediaWiki 1.21 or above.');
}

define("NS_COLLECTION_ITEM", 190);
define("NS_COLLECTION_ITEM_TALK", 191);
define("NS_COLLECTION_MATERIAL_TYPE", 192);
define("NS_COLLECTION_MATERIAL_TYPE_TALK", 193);
define("NS_COLLECTION_AUTHOR", 194);
define("NS_COLLECTION_AUTHOR_TALK", 195);
define("NS_COLLECTION_KEYWORD", 196);
define("NS_COLLECTION_KEYWORD_TALK", 197);
define("NS_COLLECTION_REVIEW", 198);
define("NS_COLLECTION_REVIEW_TALK", 199);
define("NS_COLLECTION_READING_LIST", 200);
define("NS_COLLECTION_READING_LIST_TALK", 201);

$wgExtraNamespaces[NS_COLLECTION_ITEM] = "Item";
$wgExtraNamespaces[NS_COLLECTION_ITEM_TALK] = "Item_talk";
$wgExtraNamespaces[NS_COLLECTION_MATERIAL_TYPE] = "Material_Type";
$wgExtraNamespaces[NS_COLLECTION_MATERIAL_TYPE_TALK] = "Material_Type_talk";
$wgExtraNamespaces[NS_COLLECTION_AUTHOR] = "Author";
$wgExtraNamespaces[NS_COLLECTION_AUTHOR_TALK] = "Author_talk";
$wgExtraNamespaces[NS_COLLECTION_KEYWORD] = "Keyword";
$wgExtraNamespaces[NS_COLLECTION_KEYWORD_TALK] = "Keyword_talk";
$wgExtraNamespaces[NS_COLLECTION_REVIEW] = "Review";
$wgExtraNamespaces[NS_COLLECTION_REVIEW_TALK] = "Review_talk";
$wgExtraNamespaces[NS_COLLECTION_READING_LIST] = "Reading_List";
$wgExtraNamespaces[NS_COLLECTION_READING_LIST_TALK] = "Reading_List_talk";

$wgNamespaceProtection[NS_COLLECTION_ITEM] = array( 'editcollection' );
$wgNamespaceProtection[NS_COLLECTION_MATERIAL_TYPE] = array( 'editcollection' );
$wgNamespaceProtection[NS_COLLECTION_AUTHOR] = array( 'editcollection' );
$wgNamespaceProtection[NS_COLLECTION_KEYWORD] = array( 'editcollection' );
$wgNamespaceProtection[NS_COLLECTION_REVIEW] = array( 'reviewcollection' );
$wgNamespaceProtection[NS_COLLECTION_READING_LIST] = array( 'editreadinglist' );

$wgGroupPermissions['sysop']['importcollection'] = true;
$wgGroupPermissions['sysop']['editcollection'] = true;
$wgGroupPermissions['user']['reviewcollection'] = true;
$wgGroupPermissions['user']['editreadinglist'] = true;

$wgContentNamespaces[] = NS_COLLECTION_ITEM;
$wgContentNamespaces[] = NS_COLLECTION_MATERIAL_TYPE;
$wgContentNamespaces[] = NS_COLLECTION_AUTHOR;
$wgContentNamespaces[] = NS_COLLECTION_KEYWORD;
$wgContentNamespaces[] = NS_COLLECTION_REVIEW;
$wgContentNamespaces[] = NS_COLLECTION_READING_LIST;

$wgNamespacesWithSubpages[NS_COLLECTION_REVIEW] = true;

$wgNamespacesToBeSearchedDefault[NS_COLLECTION_ITEM] = true;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_ITEM_TALK] = false;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_MATERIAL_TYPE] = true;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_MATERIAL_TYPE_TALK] = false;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_AUTHOR] = true;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_AUTHOR_TALK] = false;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_KEYWORD] = true;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_KEYWORD_TALK] = false;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_REVIEW] = true;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_REVIEW_TALK] = false;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_READING_LIST] = true;
$wgNamespacesToBeSearchedDefault[NS_COLLECTION_READING_LIST_TALK] = false;

$smwgNamespacesWithSemanticLinks[NS_COLLECTION_ITEM] = true;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_ITEM_TALK] = false;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_MATERIAL_TYPE] = true;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_MATERIAL_TYPE_TALK] = false;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_AUTHOR] = true;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_AUTHOR_TALK] = false;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_KEYWORD] = true;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_KEYWORD_TALK] = false;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_REVIEW] = true;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_REVIEW_TALK] = false;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_READING_LIST] = true;
$smwgNamespacesWithSemanticLinks[NS_COLLECTION_READING_LIST_TALK] = false;

$wgExtensionCredits[ 'specialpage' ][] = array(
	'name' => 'Collection',
	'version' => '2.0',
	'author' => 'Cindy Cicalese',
	'descriptionmsg' => 'collection-desc'
);
 
$wgSpecialPages['ImportCollection'] = 'ImportCollection'; 
$wgSpecialPageGroups['ImportCollection'] = 'other';
$wgExtensionMessagesFiles['ImportCollection'] = __DIR__ . '/Collection.i18n.php';

$wgResourceModules['ext.Collection'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'Collection',
	'scripts' => 'Collection.js'
);

$wgAPIModules['add_item'] = 'ApiAddItem';

class ApiAddItem extends ApiBase {

	private $RETURN_ERROR_BAD_REQUEST = -1;
	private $RETURN_CREATED_PAGE = 0;
	private $RETURN_DUPLICATE_OVERWRITTEN = 1;
	private $RETURN_DUPLICATE_NOOP = 2;

	public function __construct($main, $action) {
		parent::__construct($main, $action);
	}

	public function getAllowedParams() {
		return array(
			'overwrite' => null,
			'authors' => null,
			'keywords' => null,
			'ref-type' => null,
			'title' => null,
			'tertiary-title' => null,
			'full-title' => null,
			'abstract' => null,
			'call-num' => null,
			'isbn' => null,
			'language' => null,
			'notes' => null,
			'pages' => null,
			'publisher' => null,
			'pub-location' => null,
			'volume' => null,
			'date' => null,
			'year' => null,
			'electronic-resource-num' => null,
			'url' => null
		);
	}

	public function getVersion() {
		return __CLASS__ . ": 1.0";
	}

	public function getDescription() {
		return "add a collection item wiki page with the given fields";
	}

	private function parseItem($field_array) {

		$call_number = null;

		$authors = null;
		$keywords = null;

		$title = null;
		$secondary_title = null;
		$tertiary_title = null;
		$full_title = null;
		$titles = array();

		$year = null;
		$date = null;

		$text = "";
		foreach ($field_array as $field_name => $field_value) {

			$value = preg_replace('/\s+/', ' ', $field_value);
			$value = trim($value);

			switch ($field_name) {
			case "overwrite":
				// do nothing
				break;
			case "authors":
				$authors = $value;
				break;
			case "keywords":
				$keywords = $value;
				break;
			case "ref-type":
				$text .= '|Material_Type = ' . $value;
				break;
			case "title":
				$title = $value;
				break;
			case "tertiary-title":
				$tertiary_title = $value;
				break;
			case "full-title":
				$full_title = $value;
				break;
			case "year":
				$year = $value;
				break;
			case "date":
				$date = $value;
				break;
			case "abstract":
				$text .= '|Abstract = ' . $value;
				break;
			case "call-num":
				$call_number = $value;
				$text .= '|Call_Number = ' . $value;
				break;
			case "isbn":
				$text .= '|ISSN_ISBN = ' . $value;
				break;
			case "language":
				$text .= '|Language = ' . $value;
				break;
			case "notes":
				$text .= '|Notes = ' . $value;
				break;
			case "pages":
				$text .= '|Pages = ' . $value;
				break;
			case "publisher":
				$text .= '|Publisher = ' . $value;
				break;
			case "pub-location":
				$text .= '|Publication_Location = ' . $value;
				break;
			case "volume":
				$text .= '|Volume = ' . $value;
				break;
			case "electronic-resource-num":
				$text .= '|DOI = ' . $value;
				break;
			case "url":
				$urls = explode(' ', $value);
				$new_urls = array();
				foreach ($urls as $url) {
					$url = preg_replace('/\s+/', ' ', $url);
					$url = trim($url);
					if (strlen($url) > 0) {
						$new_urls[] = $url;
					}
				}
				if (count($new_urls) > 0) {
					$text .= "|URLs=" . implode(' ', $new_urls);
				}
				break;
			default:
			}
		}

		if ($title != null) {
			$titles[] = $title;
		}
		if ($full_title != null) {
			$titles[] = $full_title;
		}
		if ($tertiary_title != null) {
			$titles[] = $tertiary_title;
		}
		if (count($titles) > 0) {
			$text .= "|Title=" . $titles[0];
			array_shift($titles);
		}
		if (count($titles) > 0) {
			$text .= "|Secondary_Title=" . $titles[0];
			array_shift($titles);
			while (count($titles) > 0) {
				$text .= "; " . $titles[0];
				array_shift($titles);
			}
		}

		if ($year == null) {
			if ($date != null) {
				$year = $date;
			} else {
				$year = "----";
			}
		}
		$text .= "|Year=" . $year;

		return array($call_number, $text, $authors, $keywords);
	}

	private function findPage($query) {
		$params = array();
		$params[] = $query;
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

	private function findItem($call_number) {
		return $this->findPage(
			"[[Category:Items]][[Call_Number::" . $call_number ."]]");
	}

	private function findAuthor($name) {
		return $this->findPage(
			"[[Category:Authors]][[Name::" . $name ."]]");
	}

	private function findKeyword($name) {
		return $this->findPage(
			"[[Category:Keywords]][[Name::" . $name ."]]");
	}

	private function addPage($namespace, $pagename, $text) {
		if ($pagename == false) {
			$id = 0;
			global $wgExtraNamespaces;
 			do {
				$id++;
				$pagename = $wgExtraNamespaces[$namespace] . ":" .	 $id;
				$title = Title::newFromText($pagename);
			} while ($title->exists());
			$summary = 'Created Page.';
			$flag = EDIT_NEW;
			$ret = $this->RETURN_CREATED_PAGE;
		} else {
			$title = Title::newFromText($pagename);
			$summary = 'Overwrote Page.';
			$flag = EDIT_UPDATE;
			$ret = $this->RETURN_DUPLICATE_OVERWRITTEN;
		}
		$page = new WikiPage($title);
		$page->doEdit($text, $summary, $flag);
		return array($ret, $pagename);
	}

	private function parseAuthors($authors) {

		if (strlen($authors) == 0) {
			return "";
		}

		$author_list = "";

		$num_matches = preg_match_all("/<author>(.*)<\/author>/U", $authors,
			$matches);
		if ($num_matches == false || $num_matches == 0) {
			return "";
		}

		foreach ($matches[1] as $author) {

			$author = preg_replace('/\s+/', ' ', $author);
			$author = trim($author);
			$author = preg_replace('/[\s.,]*$/', ' ', $author);

			if (strlen($author) > 0) {
				$pagename = $this->findAuthor($author);
				if ($pagename == false) {
					list($ret, $pagename) =
						$this->addPage(NS_COLLECTION_AUTHOR, $pagename,
						"{{Author|Name=" . $author . "}}");
				}
				if (strlen($author_list) != 0) {
					$author_list .= ",";
				}
				$author_list .= $pagename;
			}
		}

		return $author_list;
	}

	private function parseKeywords($keywords) {
 
		if (strlen($keywords) == 0) {
			return "";
		}

		$keyword_list = "";

		$num_matches = preg_match_all("/<keyword>(.*)<\/keyword>/U", $keywords,
			$matches);
		if ($num_matches == false || $num_matches == 0) {
			return "";
		}

		foreach ($matches[1] as $keyword) {

			$keyword = preg_replace('/\s+/', ' ', $keyword);
			$keyword = trim($keyword);
			$keyword = preg_replace('/[\s.,]*$/', ' ', $keyword);

			if (strlen($keyword) > 0) {
				$pagename = $this->findKeyword($keyword);
				if ($pagename == false) {
					list($ret, $pagename) =
						$this->addPage(NS_COLLECTION_KEYWORD, $pagename,
						"{{Keyword|Name=" . $keyword . "}}", false);
				}
				if (strlen($keyword_list) != 0) {
					$keyword_list .= ",";
				}
				$keyword_list .= $pagename;
			}
		}

		return $keyword_list;
	}

	public function execute() {

		$params = $this->extractRequestParams();

		$overwrite = $params['overwrite'];
		if (!$overwrite) {
			$overwrite = false;
		} else {
			$overwrite = true;
		}

		list($call_number, $wikitext, $authors, $keywords) =
			$this->parseItem($params);
		if ($call_number == false) {
			$ret = array ($this->RETURN_ERROR_BAD_REQUEST,
				"missing call number");
			$this->getResult()->addValue(null, 'add_item',
				$ret);
			return;
		}

		$pagename = $this->findItem($call_number);
		if ($pagename != false && !$overwrite) {
				$ret = array ($this->RETURN_DUPLICATE_NOOP, $pagename);
				$this->getResult()->addValue(null, 'add_item',
					$ret);
				return;
		}

		$wikitext = "{{Item" . $wikitext;

		$author_list = $this->parseAuthors($authors);
		if (strlen($author_list) > 0) {
			$wikitext .= "|Authors=" . $author_list;
		}

		$keyword_list = $this->parseKeywords($keywords);
		if (strlen($keyword_list) > 0) {
			$wikitext .= "|Keywords=" . $keyword_list;
		}

		$wikitext .= "}}";
		list($ret, $pagename) = $this->addPage(NS_COLLECTION_ITEM, $pagename,
			$wikitext);

		$this->getResult()->addValue(null, 'add_item',
			array ($ret, $call_number));
	}
}

class ImportCollection extends SpecialPage {

	private $overwrite = false;

	public function __construct() {
		parent::__construct('ImportCollection', 'importcollection');
	}

	public function execute($par) {

		if (!$this->userCanExecute($this->getUser())) {
			$this->displayRestrictionError();
			return;
		}

		$request = $this->getRequest();
		$this->setHeaders();
 
		$this->phase = $request->getText('phase');
		if (is_null($this->phase) || strlen($this->phase == 0)) {
			$this->showForm();
		} else {
			$this->overwrite = $request->getBool('overwrite', false);
			$this->importCollection();
		}
	}

	private function showForm() {
		global $wgScript;
		$html = Html::openElement('form', array(
				'method' => 'post',
				'action' => $wgScript,
				'enctype' => 'multipart/form-data',
				'id' => 'ImportCollection')
			) .
			Html::openElement('fieldset') .
			Html::hidden( 'title', $this->getTitle()->getPrefixedText() ) .
			Html::hidden( 'phase', 2 ) .
			Html::element('legend', null, 'Import from an EndNote XML file:') .
			'<table><tbody>';
		list($label, $input) =
			Xml::inputLabelSep('Filename:', 'fname', 'fname', 50, '',
			array ('type' => 'file'));
		$html .= '<tr><td>' . $label . '</td><td>' . $input . '</td></tr>';
		list($label, $input) =
			Xml::inputLabelSep('Overwrite duplicate pages?:', 'overwrite',
				'overwrite', 0, 'true', array ('type' => 'checkbox'));
		$html .= '<tr><td>' . $label . '</td><td>' . $input . '</td></tr>';
		$html .=
			'<tr><td>' . Xml::submitButton('Go') . '</td></tr>' .
			'</tbody></table>' .
			Html::closeElement('fieldset') .
			Html::closeElement('form');
		$this->getOutput()->addHTML($html);
	}

	private function importCollection() {

		$output = $this->getOutput();

		$output->addHTML("<br /> Importing Endnote XML from file: <b>" .
			$_FILES["fname"]["name"] . "</b><br /><br />");

		if ($_FILES["fname"]["error"] > 0) {
			$output->addHTML("Error " . $_FILES["fname"]["error"] .
				" uploading file.<br /><br />" .
				"Check /etc/php.ini to make sure:<br />" .
				"<blockquote>" .
				"post_max_size = <b>&lt;larger than file size&gt;</b><br />" .
				"file_uploads = <b>On</b><br />" .
				"upload_max_filesize = <b>&lt;larger than file size&gt;</b>" .
				"</blockquote>");
			return;
		} else if ($_FILES["fname"]["type"] != "text/xml") {
			$output->addHTML("Error: file does not contain XML");
			return;
		}

		$output->addModules('ext.Collection');
	
		$divname = "ImportCollection_div";
		$out = <<<EOT
<div id="$divname"> </div>
EOT;
		$output->addHtml($out);

		global $wgServer, $wgScriptPath;
		$apiurl = $wgServer . $wgScriptPath .	'/api.php';

		$xml = json_encode(file_get_contents($_FILES["fname"]["tmp_name"]));

		if ($this->overwrite) {
			$overwrite = 'true';
		} else {
			$overwrite = 'false';
		}
		$script =<<<END
mw.loader.using(['ext.Collection'], function () {
	importCollection('$divname', '$apiurl', $xml, $overwrite);
});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";
		$output->addScript($script);
	}
}
