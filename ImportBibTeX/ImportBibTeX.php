<?php

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/ImportBibTeX/ImportBibTeX.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of Collection is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits[ 'specialpage' ][] = array(
	'name' => 'ImportBibTeX',
	'version' => '1.0',
	'author' => 'Kevin Forbes',
	'descriptionmsg' => 'importbibtex-desc'
);
 
$wgSpecialPages['ImportBibTeX'] = 'ImportBibTeX'; 
$wgSpecialPageGroups['ImportBibTeX'] = 'other';
$wgExtensionMessagesFiles['ImportBibTeX'] = __DIR__ . '/ImportBibTeX.i18n.php';

$wgResourceModules['ext.ImportBibTeX'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'ImportBibTeX',
	'scripts' => 'ImportBibTeX.js'
);

$wgAPIModules['add_bibtex'] = 'ApiAddBibTeXItem';

class ApiAddBibTeXItem extends ApiBase {

	private $RETURN_ERROR_BAD_REQUEST = -1;
	private $RETURN_CREATED_PAGE = 0;
	private $RETURN_DUPLICATE_OVERWRITTEN = 1;
	private $RETURN_DUPLICATE_NOOP = 2;

	public function __construct($main, $action) {
		parent::__construct($main, $action);
	}

	public function getAllowedParams() {
		return array(
			//'abbrev_source_title' => null,
			//'abstract' => null,
			//'added-at' => null,
			//'author' => null,
			//'author_keywords' => null,
			'bibtexJSON' => null
			//'biburl' => null,
			//'chemicals_cas' => null,
			//'correspondence_address1' => null,
			//'document_type' => null,
			//'doi' => null,
			//'injurytype' => null,
			//'interhash' => null,
			//'intrahash' => null,
			//'issn' => null,
			//'journal' => null,
			//'keywords' => null,
			//'language' => null,
			//'note' => null,
			//'overwrite' => null,
			//'pages' => null,
			//'references' => null,
			//'source' => null,
			//'timestamp' => null,
			//'title' => null,
			//'type' => null,
			//'url' => null,
			//'volume' => null,
			//'year' => null
		);
	}

	public function getVersion() {
		return __CLASS__ . ": 1.0";
	}

	public function getDescription() {
		return "add a bibtex item wiki page with the given fields";
	}

	/*private function parseItem($field_array) {

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
    */

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

	private function findItem($title) {
		return $this->findPage(
			"[[Category:Items]][[Full Title::" . $title ."]]");
	}

    /*
	private function findAuthor($name) {
		return $this->findPage(
			"[[Category:Authors]][[Name::" . $name ."]]");
	}

	private function findKeyword($name) {
		return $this->findPage(
			"[[Category:Keywords]][[Name::" . $name ."]]");
	}
*/

	private function addPage($namespace, $pagename, $text) {
		if ($pagename == false) {
			$id = 0;
			global $wgExtraNamespaces;
 			do {
				$id++;
				//$pagename = $wgExtraNamespaces[$namespace] . ":" .	 $id;
				$pagename = "Item:" . $id;
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
/*
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
*/

    public function parseAuthors($authors) {
		$people = explode(" and ", $authors);
		$result = "";
		foreach($people as $person) {

			$index = strpos($person, ",");
			if($index == false) {
				$result .= "{{Author|author=" . trim($person) . "}}";
			} else {
                $last = trim(substr($person, 0, $index));
				$first = trim(substr($person, ($index + 1)));
				$result .= "{{Author|author=" . $first . " " . $last . "}}";
			}
		}	
		return $result;
	}


    public function parseKeywords($keywords) {
		$words = explode(";", $keywords);
		$result = "";
		foreach($words as $word) {
			$result .= "{{Keyword|keyword=" . trim($word) . "}}";
		}
		return $result;
    }

	public function execute() {

		$params = $this->extractRequestParams();
		//$params = $this->extractRequestParams();
		$bibtexParams = json_decode($params['bibtexJSON'], true);


		$overwrite = $params['overwrite'];
		if ($overwrite == 'false') {
			$overwrite = false;
		} else {
			$overwrite = true;
		}

		/*list($call_number, $wikitext, $authors, $keywords) =
			$this->parseItem($params);
		if ($call_number == false) {
			$ret = array ($this->RETURN_ERROR_BAD_REQUEST,
				"missing call number");
			$this->getResult()->addValue(null, 'add_item',
				$ret);
			return;
		}
        */

        if($bibtexParams['title'] == null) {
			$ret = array ($this->RETURN_ERROR_BAD_REQUEST, $bibtexParams['title']);
			$this->getResult()->addValue(null, 'add_bibtex', $ret);
			return;

		}
		$title = $bibtexParams['title'];
		$pagename = $this->findItem($title);

		if ($pagename != false && !$overwrite) {
				$ret = array ($this->RETURN_DUPLICATE_NOOP, $title);
				$this->getResult()->addValue(null, 'add_bibtex',
					$ret);
				return;
		}

		$wikitext = "{{Item" . $wikitext;

		foreach ($bibtexParams as $key => $value) {
			if($key == "author") {
				$wikitext .= "\n|authors=" . $this->parseAuthors($value);
			} else {
				$wikitext .= "\n|" . $key . "=" . $value;
			}
		
		}

		/*$wikitext .= "\n|title=" . $title;
		$wikitext .= "\n|added-at=" . $bibtexParams['added-at'];
		$wikitext .= "\n|authors=" . $this->parseAuthors($bibtexParams['author']);
		$wikitext .= "\n|url=" . $bibtexParams['biburl'];
		$wikitext .= "\n|injurytypes=" . $bibtexParams['injurytypes'];
		$wikitext .= "\n|interhash=" . $bibtexParams['interhash'];
		$wikitext .= "\n|intrahash=" . $bibtexParams['intrahash'];
		$wikitext .= "\n|keywords=" . $bibtexParams['keywords'];
		$wikitext .= "\n|timestamp=" . $bibtexParams['timestamp'];
		$wikitext .= "\n|type=" . $bibtexParams['type'];
		$wikitext .= "\n|year=" . $bibtexParams['year'];
*/

		$wikitext .= "\n}}";
		list($ret, $pagename) = $this->addPage(NS_COLLECTION_ITEM, $pagename,
			$wikitext);

		$this->getResult()->addValue(null, 'add_bibtex',
			array ($ret, $title));
        return;
		
	}
}


class ImportBibTeX extends SpecialPage {

	private $overwrite = false;

	public function __construct() {
		parent::__construct('ImportBibTeX', 'importbibtex');
	}

	public function execute($par) {

		/*if (!$this->userCanExecute($this->getUser())) {
			$this->displayRestrictionError();
			return;
		}
                */

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
				'id' => 'ImportBibTeX')
			) .
			Html::openElement('fieldset') .
			Html::hidden( 'title', $this->getTitle()->getPrefixedText() ) .
			Html::hidden( 'phase', 2 ) .
			//Html::hidden( 'overwrite', false ) .
			Html::element('legend', null, 'Import from a list of BibTeX entries file:') .
			'<table><tbody>';
		$html .= '<tr><td valign="top"><label for="bibtexarea">Copy/Paste BibTeX entry here:</label></td><td><textarea cols="80" rows="10" name="bibtexarea"></textarea></td></tr>';
		list($label, $input) =
			Xml::inputLabelSep('or Choose BibTeX file for upload:', 'fname', 'fname', 50, '',
			array ('type' => 'file'));
		$html .= '<tr><td>' . $label . '</td><td>' . $input . '</td></tr>';

		list($label, $input) =
			Xml::inputLabelSep('Injury Type:', 'injurytype',
				'injurytype', 50, '', array ('type' => 'text'));
		$html .= '<tr><td>' . $label . '</td><td>' . $input . '</td></tr>';
		$html .= '<tr><td>(Semicolon seperated list of values) </td></tr>';
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
		$request = $this->getRequest();
		$injurytype = $request->getText('injurytype');
		$bibtexFromArea = $request->getText('bibtexarea');


		if (is_null($bibtexFromArea) || strlen($bibtexFromArea) == 0) {
			$output->addHTML("<br /> Importing BibTeX from file: <b>" .
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
			}

			$xml = json_encode(file_get_contents($_FILES["fname"]["tmp_name"]));
		} else {
			$xml = json_encode($bibtexFromArea);
		} 

		$output->addModules('ext.ImportBibTeX');
	
		$divname = "ImportBibTeX_div";
		$out = <<<EOT
<div id="$divname"> </div>
EOT;
		$output->addHtml($out);

		global $wgServer, $wgScriptPath;
		$apiurl = $wgServer . $wgScriptPath .	'/api.php';

		//$xml = json_encode(file_get_contents($_FILES["fname"]["tmp_name"]));

		//$output->addHTML("<br /> File Contents: <b>" . $xml . "</b><br /><br />");
		//$output->addHTML("<br /> APIURL: <b>" . $apiurl . "</b><br /><br />");
		if ($this->overwrite) {
			$overwrite = 'true';
		} else {
			$overwrite = 'false';
		}
		$script =<<<END
mw.loader.using(['ext.ImportBibTeX'], function () {
	importBibTeX('$divname', '$apiurl', $xml, $overwrite, '$injurytype');
});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";
		$output->addScript($script);
	}
}
