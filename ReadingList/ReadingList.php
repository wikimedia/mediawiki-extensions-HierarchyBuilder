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
	'version' => '2.1',
	'author' => "Cindy Cicalese",
	'description' => "Manage reading lists"
);
 
$wgHooks['LanguageGetMagic'][] = 'wfExtensionReadingList_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efReadingListParserFunction_Setup';
$dir = dirname(__FILE__) . '/';
$wgExtensionMessagesFiles['AddToReadingListSpecialPage'] =
	$dir . 'AddToReadingListSpecialPage.i18n.php';
$wgExtensionAliasesFiles['AddToReadingListSpecialPage'] =
	$dir . 'AddToReadingListSpecialPage.alias.php';

$wgSpecialPages['AddToReadingListSpecialPage'] = 'AddToReadingListSpecialPage';

function efReadingListParserFunction_Setup (& $parser) {
	$parser->setFunctionHook('addToReadingList', 'addToReadingList');
	return true;
}

function wfExtensionReadingList_Magic(& $magicWords, $langCode) {
	$magicWords['addToReadingList'] = array (0, 'addToReadingList');
	return true;
}

function addToReadingList($parser, $pagename, $username, $template,
	$anchor = '', $category = 'Reading Lists', $userproperty = 'Reader',
	$itemproperty = 'Item', $label = 'Add to Reading List:') {
	$readingList = new ReadingList;
	$output = $readingList->addToReadingList($parser, $pagename, $username,
		$template, $anchor, $category, $userproperty, $itemproperty, $label);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}

class ReadingList {

	function addToReadingList($parser, $pagename, $username, $template,
		$anchor, $category, $userproperty, $itemproperty, $label) {
		$js = <<<EOT
<script type="text/javascript">
function addToReadingList(index) {
	window.location = index;
}
</script>
EOT;
		$parser->mOutput->addHeadItem($js);

		$params = array();
		$params[] =
			"[[Category:$category]][[$userproperty::User:" . $username . "]]" .
			"[[$itemproperty::" . $pagename . "]]";
		$params[] = "format=ul";
		$params[] = "link=none";
		$result = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI);
		$excludelist = array();
		if (preg_match_all("/<li>(.*)<\/li>/", $result, $matches) !== 0) {
			foreach ($matches[1] as $match) {
				$excludelist[] = $match;
			}
		}

		global $wgServer, $wgScriptPath, $wgScriptExtension;
		$url = $wgServer . $wgScriptPath . "/index" . $wgScriptExtension .
			"/Special:AddToReadingListSpecialPage?item=" . $pagename .	"&template=" .
			$template;
		if (strlen($anchor) > 0) {
			$url .= "&anchor=" . $anchor;
		}
		$url .= "&list=";

		$params = array();
		$params[] =
			"[[Category:$category]][[$userproperty::User:" . $username . "]]" .
		$params[] = "?Name";
		$params[] = "format=ul";
		$params[] = "link=none";
		$params[] = "headers=hide";
		$result = SMWQueryProcessor::getResultFromFunctionParams($params,
			SMW_OUTPUT_WIKI);
		$options = '';
		if (preg_match_all("/<li>(.*) \((.*)\)<\/li>/", $result, $matches,
			PREG_SET_ORDER) !== 0) {
			foreach ($matches as $match) {
				if (!in_array($match[1], $excludelist)) {
					$index = strrpos($match[1], "/");
					$options .= "<option value=\"" .	$url . $match[1] . "\">"	.
						$match[2] . "</option>\n";
				}
			}
		}
		$length = strlen($options);
		if ($length === 0) {
			$out = '';
		} else {
			$out = "<form><select id='add' onchange='addToReadingList(this.value)'>";
			$out .= "<option disabled selected>$label</option>";
			$out .= $options;
			$out .= "</select></form>";
		}
		return $out;
	}
}

class AddToReadingListSpecialPage extends SpecialPage {
	function __construct() {
		parent::__construct('AddToReadingListSpecialPage', '', false);
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
				$ar->doEdit($text, 'add collection item to reading list');
				$ar->purge();
			}
		}
		global $wgServer, $wgScriptPath, $wgScriptExtension, $wgOut;
		$url = $wgServer . $wgScriptPath . "/index" . $wgScriptExtension .
			'/' . $item;
		if ($anchor != null && strlen($anchor) > 0) {
			$url .= "#" . $anchor;
		}
		$wgOut->redirect($url);
	}
}
