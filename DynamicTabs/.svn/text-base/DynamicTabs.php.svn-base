<?php
 
/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/DynamicTabs/DynamicTabs.php");
*/

if (!defined('MEDIAWIKI')) {
  die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.19', 'lt')) {
  die('<b>Error:</b> This version of SFQuerySelectPage is only compatible with MediaWiki 1.19 or above.');
}

# credits
$wgExtensionCredits['parserhook'][] = array (
  'name' => 'DynamicTabs',
  'version' => '1.0',
  'author' => "Cindy Cicalese",
  'description' => "Displays content in named tabs using jQuery and the MediaWiki API"
);
 
$wgResourceModules['ext.DynamicTabs'] = array(
  'localBasePath' => dirname(__FILE__),
  'remoteExtPath' => 'DynamicTabs',
  'scripts' => 'DynamicTabs.js',
  'dependencies' => 'jquery.ui.tabs'
);

$wgHooks['LanguageGetMagic'][] = 'wfExtensionDynamicTabs_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efDynamicTabsParserFunction_Setup';

function efDynamicTabsParserFunction_Setup (& $parser) {
  $parser->setFunctionHook('dynamictabs', 'dynamictabs');
  return true;
}

function wfExtensionDynamicTabs_Magic(& $magicWords, $langCode) {
  $magicWords['dynamictabs'] = array (0, 'dynamictabs');
  return true;
}

function dynamictabs($parser) {
  $params = func_get_args();
  array_shift($params); // first is $parser; strip it
  $dynamictabs = new DynamicTabs;
  $output = $dynamictabs->init($parser, $params);
  $parser->disableCache();
  return array($parser->insertStripItem($output, $parser->mStripState),
    'noparse' => false);
}

class DynamicTabs {

  private $separator = ',';
  private $extraResources = null;
  private static $divnum = 0;

  function init($parser, $params) {

    $this->parseParameters($params);

    global $wgOut;
    $wgOut->addModules('ext.DynamicTabs');
    foreach ($this->extraResources as $extra) {
      $wgOut->addModules($extra);
    }
 
    $divname = "DynamicTabs_div" . self::$divnum;
    $script =<<<END
mw.loader.using(['ext.DynamicTabs'], function () {
  DynamicTabs_init('$divname');
});
END;

    $script = '<script type="text/javascript">' . $script . "</script>";
    $wgOut->addScript($script);

    global $wgServer, $wgScriptPath;
    $apiurl = $wgServer . $wgScriptPath . "/api.php";

    $out = <<<EOT
<div id="$divname">
  <ul>
EOT;

    global $wgTitle;
    $tabnum = 0;
    $templates = array();
    foreach ($params as $param) {
      $tabdata = array_map('trim', explode($this->separator, $param));
      if (count($tabdata) > 1) {
        $tabref = "#" . $divname . "_" . $tabnum;
        $template = "{{" . $tabdata[1];
        $templateparams = array_slice($tabdata, 2);
        foreach ($templateparams as $templateparam) {
          $template .= "|" . $templateparam;
        }
        $template .= "|pagename=" . $wgTitle . "}}";
        $templates[$tabnum] = $template;
        $tabname = $parser->recursiveTagParse($tabdata[0]);
        $out .= <<<EOT
    <li><a href="$tabref">$tabname</a></li>
EOT;
        $tabnum++;
      }
    }

    $out .= <<<EOT
  </ul>
EOT;
    for ($i = 0; $i < $tabnum; $i++) {
      $tabdiv = $divname . "_" . $i;
      $template = $templates[$i];
      $out .= <<<EOT
    <div id="$tabdiv" apiurl="$apiurl" template="$template"></div>
EOT;
    }
    $out .= <<<EOT
</div>
EOT;

    self::$divnum++;
    return $out;
  }

  private function parseParameters(&$params) {
    $queryParams = array();
    foreach ($params as $param) {
      if (preg_match("/^ *sep *= *(.*)$/", $param, $matches) === 1) {
        $this->separator = str_replace(" ", "_", $matches[1]);
      } else if (preg_match("/^ *load *= *(.*)$/", $param, $matches) === 1) {
        $this->extraResources = array_map('trim', explode(",", $matches[1]));
      } else {
        $queryParams[] = $param;
      }
    }
    $params = $queryParams;
  }

}
