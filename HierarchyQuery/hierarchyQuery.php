<?php

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/HierarchyQuery/walk.php");
*/

$wgExtensionCredits['parserhook'][] = array (
  'name' => 'Hierarchy Query',
  'version' => '1.4',
  'author' => 'Cindy Cicalese',
  'description' => 'Walk a hierarchy formed by Page properties and return a list of the resulting pages',
);

$wgHooks['ParserFirstCallInit'][] = 'efHierarchyQueryExtension_Setup';
$wgHooks['LanguageGetMagic'][] = 'wfHierarchyQueryExtension_Magic';

function efHierarchyQueryExtension_Setup (&$parser) {
  $parser->setFunctionHook('hierarchyQuery', 'hierarchyQuery');
  return true;
}

function wfHierarchyQueryExtension_Magic(&$magicWords, $langCode) {
  $magicWords['hierarchyQuery'] = array (0, 'hierarchyQuery');
  return true;
}

function hierarchyQuery($parser, $queryPage, $hierarchyProperty,
  $separator = "||") {

  if (strlen(trim($separator)) < 1) {
    $separator = "||";
  }
  $hq = new HierarchyQuery;
  $output = $hq->run($queryPage, $hierarchyProperty, $separator);
  $parser->disableCache();
  return $output;
}

class HierarchyQuery {

  function run($queryPage, $hierarchyProperty, $separator) {

    $queryPage = trim($queryPage);

    if (strlen($queryPage) < 1) {
      return "";
    }

    $pagesInHierarchy = array();
    $queryPageArray[] = $queryPage;
  
    while (count($queryPageArray) > 0) {
      $params = array();
      $params[] = "[[" . $hierarchyProperty . "::" .
        array_shift($queryPageArray) .  "]]";
      $params[] = "link=none";
      $results = SMWQueryProcessor::getResultFromFunctionParams($params,
        SMW_OUTPUT_WIKI);
      if (strlen($results) > 0) {
        $resultArray = preg_split("/[\s]*,[\s]*/", $results);
        foreach ($resultArray as $result) {
          $result = trim($result);
          if (!in_array($result, $pagesInHierarchy)) {
            $pagesInHierarchy[] = $result;
            $queryPageArray[] = $result;
          }
        }
      }
    }

    return implode($separator, $pagesInHierarchy);
  }
}
