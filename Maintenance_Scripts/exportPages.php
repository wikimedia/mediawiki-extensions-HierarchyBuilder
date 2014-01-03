<?php

require_once("maintenance/commandLine.inc");

global $args;
foreach ($args as $arg) {
  exportPage($arg);
}

function exportPage($filename) {

  $title_array = process_title(basename($filename));
  $title = Title::makeTitleSafe($title_array["namespace"],
    $title_array["pagename"]);
  if (is_null($title)) {
    echo 'Invalid page title: ' . $title_array["pagename"] .
      ". Page not exported.\n";
    return;
  }

  if (!touch($filename)) {
    echo 'File not writable: ' . $filename . ". Page not exported.\n";
    return;
  }

  $article = new Article($title);
  global $wgTitle;
  $wgTitle = $title;
  if (!$article->exists()) {
    echo 'Page does not exist: ' . $title->getNsText() . ":" .
      $title->getText() . ". Page not exported.\n";
    return;
  }

  $wikitext = $article->getContent();

  if (file_put_contents($filename, $wikitext . "\n") === FALSE) {
    echo 'Could not write to file: ' . $filename . ". Page not exported.\n";
    return;
  }

  if ($title_array["namespace"] == NS_MAIN) {
    $namespace = "";
  } else {
    $namespace = $title->getNsText() . ":";
  }
  echo 'Exported page ' . $namespace .  $title->getText() . ".\n";
}

function process_title($title) {
  global $wgLegalTitleChars, $wgCanonicalNamespaceNames, $wgExtraNamespaces;
  $pattern = "/[" . $wgLegalTitleChars . "]/";
  $title = strtr($title, array ('___' => '/', '__' => ':', '[' => '(', '{' => '(',
    ']' => ')', '}' => ')'));
  $title_array = str_split($title);
  $title = '';
  foreach ($title_array as $c) {
    $i = preg_match($pattern, $c);
    if ($i != 0) {
      $title .= $c;
    }
  }
  foreach ($wgCanonicalNamespaceNames as $index => $namespace) {
    $pattern = "/^" . $namespace . ":/";
    $i = preg_match($pattern, $title);
    if ($i > 0) {
      $pagename = preg_replace($pattern, "", $title);
      return array("namespace" => $index, "pagename" => $pagename);
    }
  }
  foreach ($wgExtraNamespaces as $index => $namespace) {
    $pattern = "/^" . $namespace . ":/";
    $i = preg_match($pattern, $title);
    if ($i > 0) {
      $pagename = preg_replace($pattern, "", $title);
      return array("namespace" => $index, "pagename" => $pagename);
    }
  }
  return array ("namespace" => NS_MAIN, "pagename" => $title);
}
