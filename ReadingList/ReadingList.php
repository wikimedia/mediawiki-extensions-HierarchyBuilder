<?php
 
/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/ReadingList/ReadingList.php");
*/

if( !defined( 'MEDIAWIKI' ) ) die( "This is an extension to the MediaWiki 
	package and cannot be run standalone." );
 
# credits
$wgExtensionCredits['parserhook'][] = array (
	'name' => 'ReadingList',
	'version' => '3.0',
	'author' => "Cindy Cicalese",
	'description' => "Manage reading lists"
);
 
$wgHooks['ParserFirstCallInit'][] = 'efReadingListParserFunction_Setup';
$wgExtensionMessagesFiles['ReadingList'] =
	__DIR__ . '/ReadingList.i18n.php';
$wgExtensionMessagesFiles['AddToReadingListSpecialPage'] =
	__DIR__ . '/AddToReadingListSpecialPage.i18n.php';
$wgExtensionMessagesFiles['AddToReadingListSpecialPageAlias'] =
	__DIR__ . '/AddToReadingListSpecialPage.alias.php';

$wgSpecialPages['AddToReadingListSpecialPage'] = 'AddToReadingListSpecialPage';

function efReadingListParserFunction_Setup (& $parser) {
	$parser->setFunctionHook('addToReadingList', 'addToReadingList');
	return true;
}

function addToReadingList($parser) {
	$params = func_get_args();
	array_shift($params); // first is $parser; strip it
	$output = ReadingList::addToReadingList($parser, $params);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}

class ReadingList {

	static function addToReadingList($parser, $params) {

		$paramArray = self::parseParameters($params);

		if (array_key_exists("pagename", $paramArray)) {
			$pagename = $paramArray["pagename"];
		} else {
			return "missing pagename";
		}

		$wgUser = $GLOBALS["wgUser"];
		if ($wgUser->isAnon()) {
			return "";
		} else {
			$username = $wgUser->mName;
		}

		if (array_key_exists("template", $paramArray)) {
			$template = $paramArray["template"];
		} else {
			$template = "Reading List Item";
		}

		if (array_key_exists("anchor", $paramArray)) {
			$anchor = $paramArray["anchor"];
		}else {
			$anchor = "";
		}

		if (array_key_exists("category", $paramArray)) {
			$category = $paramArray["category"];
		}else {
			$category = "Reading Lists";
		}

		if (array_key_exists("userproperty", $paramArray)) {
			$userproperty = $paramArray["userproperty"];
		}else {
			$userproperty = "Reading List Owner";
		}

		if (array_key_exists("itemproperty", $paramArray)) {
			$itemproperty = $paramArray["itemproperty"];
		}else {
			$itemproperty = "Item";
		}

		if (array_key_exists("label", $paramArray)) {
			$label = $paramArray["label"];
		}else {
			$label = "Add to Reading List:";
		}

		if (array_key_exists("listnameproperty", $paramArray)) {
			$listnameproperty = $paramArray["listnameproperty"];
		}else {
			$listnameproperty = "";
		}

		$js = <<<EOT
<script type="text/javascript">
function addToReadingList(index) {
	window.location = index;
}
</script>
EOT;
		$parser->mOutput->addHeadItem($js);

		$store = smwfGetStore();

		$descriptions = array();

		$categoryTitle = Title::newFromText("Category:" . $category);
		$categoryPageDI= SMWDIWikiPage::newFromTitle($categoryTitle);
		$descriptions[] = new SMWClassDescription($categoryPageDI);

		$userPageTitle = Title::newFromText("User:" . $username);
		$userPageDI= SMWDIWikiPage::newFromTitle($userPageTitle);
		$userPropertyDI = SMWDIProperty::newFromUserLabel($userproperty);
		$descriptions[] = new SMWSomeProperty($userPropertyDI,
			new SMWValueDescription($userPageDI));

		$all = $store->getQueryResult(new SMWQuery(
			new SMWConjunction($descriptions)));

		$itemPageTitle = Title::newFromText($pagename);
		$itemPageDI= SMWDIWikiPage::newFromTitle($itemPageTitle);
		$itemPropertyDI = SMWDIProperty::newFromUserLabel($itemproperty);
		$descriptions[] = new SMWSomeProperty($itemPropertyDI,
			new SMWValueDescription($itemPageDI));

		$excluded = $store->getQueryResult(new SMWQuery(
			new SMWConjunction($descriptions)));

		if ($all->getCount() === $excluded->getCount()) {
			return "";
		}

		$special = Title::newFromText("Special:AddToReadingListSpecialPage");
		$url =  $special->getFullURL() . "?item=" . $pagename .	"&template=" .
			$template;

		if (strlen($anchor) > 0) {
			$url .= "&anchor=" . $anchor;
		}

		$url .= "&list=";

		$options = "";
		foreach ($all->getResults() as $page) {
			if (!in_array($page, $excluded->getResults())) {
				$text = $page->getTitle()->getPrefixedText();
				if (strlen($listnameproperty) > 0) {
					$data = $store->getSemanticData($page);
					$values = $data->getPropertyValues(
						SMWDIProperty::newFromUserLabel($listnameproperty));
					if (count($values) > 0) {
						$text = $values[0]->getString();
					}
				}
				$options .= "<option value=\"" . $url .
					$page->getTitle()->getPrefixedText() .  "\">" .
					$text . "</option>\n";
			}
		}

		$length = strlen($options);
		if ($length === 0) {
			$out = '';
		} else {
			$out = "<form>";
			$out .= "<select id='add' onchange='addToReadingList(this.value)'>";
			$out .= "<option disabled selected>$label</option>";
			$out .= $options;
			$out .= "</select>";
			$out .= "</form>";
		}
		return $out;
	}

	static function parseParameters($params) {
		$paramArray = array();
		foreach ($params as $param) {
			$ret = explode("=", $param, 2);
			if (count($ret) > 1) {
				$paramArray[$ret[0]] = $ret[1];
			}
		}
		return $paramArray;
	}
}

class AddToReadingListSpecialPage extends SpecialPage {
	function __construct() {
		parent::__construct('AddToReadingListSpecialPage');
	}

	function execute( $par ) {
		$item=$_GET["item"];
		$list=$_GET["list"];
		$template=$_GET["template"];
		$anchor=$_GET["anchor"];
		$title = Title::newFromText($list);
		if (!is_null($title)) {
			$ar = new Article($title);
			if ($ar->exists()) {
				$text = $ar->getContent() . '{{' . $template . '|' . $template .
					'=' .$item . '}}';
				$ar->doEdit($text, 'add item to reading list');
				$ar->purge();
			}
		}
		$title = Title::newFromText($item);
		if (!is_null($title)) {
			$url = $title->getFullURL();
			if ($anchor != null && strlen($anchor) > 0) {
				$url .= "#" . $anchor;
			}
			global $wgOut;
			$wgOut->redirect($url);
		}
	}
}
