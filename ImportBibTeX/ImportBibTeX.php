<?php

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/ImportBibTeX/ImportBibTeX.php");
* in your PostConfiguration.php file:
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
$wgExtensionMessagesFiles['ImportBibTeXAlias'] = __DIR__ . '/ImportBibTeX.alias.php';

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
			'bibtexJSON' => null
		);
	}

	public function getVersion() {
		return __CLASS__ . ": 1.0";
	}

	public function getDescription() {
		return "add a bibtex item wiki page with the given fields";
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

	private function findItem($title) {
		return $this->findPage(
			"[[Category:Items]][[Full Title::" . $title ."]]");
	}

	private function addPage($pagename, $text) {
		if ($pagename == false) {
			$id = 0;
			global $wgExtraNamespaces;
 			do {
				$id++;
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
		$loggedInUser = $this->getUser();
		if (!$loggedInUser->isLoggedIn()) {
           $this->displayRestrictionError();
           return;
       }

		$params = $this->extractRequestParams();
		$bibtexParams = json_decode($params['bibtexJSON'], true);

		if(isset($params['overwrite'])) { 
			$overwrite = $params['overwrite'];
		} else {
			$overwrite = 'false';
		}


		if ($overwrite == 'true') {
			$overwrite = true;
		} else {
			$overwrite = false;
		}

        if($bibtexParams['title'] == null) {
			$ret = array ($this->RETURN_ERROR_BAD_REQUEST, $bibtexParams['title']);
			$this->getResult()->addValue(null, 'add_bibtex', $ret);
			return;

		}
		$title = $bibtexParams['title'];
		$pagename = $this->findItem($title);

		if ($pagename != false && !$overwrite) {
				$wgTitle = Title::newfromText($pagename, 10);
				$url = $wgTitle->getFullURL();
				$ret = array ($this->RETURN_DUPLICATE_NOOP, "<a href=\"$url\">" . $title . "</a>");


				$this->getResult()->addValue(null, 'add_bibtex',
					$ret);
				return;
		}

		$wikitext = "{{Item";

		$keywordsCache = "";

		foreach ($bibtexParams as $key => $value) {
			if($key == "author") {
				$wikitext .= "\n|authors=" . $this->parseAuthors($value);
			} else if($key == "keywords") {
				$keywordsCache .= "," .$value;
			} else {
				$wikitext .= "\n|" . $key . "=" . $value;
			}
		
		}
		$keywordsCache = str_replace(";", ",", $keywordsCache);

		$wikitext .= "\n|keywords=" . substr($keywordsCache, 1);

		$wikitext .= "\n}}";
		list($ret, $pagename) = $this->addPage($pagename,
			$wikitext);
		$wgTitle = Title::newfromText($pagename, 10);
		$url = $wgTitle->getFullURL();

		$this->getResult()->addValue(null, 'add_bibtex',
			array ($ret, "<a href=\"$url\">" . $title . "</a>", $url));
        return;
		
	}
}


class ImportBibTeX extends SpecialPage {

	private $overwrite = false;

	public function __construct() {
		parent::__construct('ImportBibTeX', 'importbibtex');
	}

	public function execute($par) {
		$loggedInUser = $this->getUser();
		if (!$loggedInUser->isLoggedIn()) {
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
				'id' => 'ImportBibTeX')
			) .
			Html::openElement('fieldset') .
			Html::hidden( 'title', $this->getTitle()->getPrefixedText() ) .
			Html::hidden( 'phase', 2 ) .
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
		$html .= '<tr><td>(Comma seperated list of values) </td></tr>';
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
