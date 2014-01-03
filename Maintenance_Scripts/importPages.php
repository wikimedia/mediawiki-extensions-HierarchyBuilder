<?php

require_once("maintenance/commandLine.inc");

global $args;
foreach ($args as $arg) {
  importPage($arg);
}

function importPage($filename) {

  if (!is_file($filename)) {
    echo 'Invalid file: ' . $filename . ". Page not created.\n";
    return;
  }
  if (!is_readable($filename)) {
    echo 'File not readable: ' . $filename . ". Page not created.\n";
    return;
  }
  $title_text = process_title(basename($filename));
  $title = Title::makeTitleSafe($title_text["namespace"],
    $title_text["pagename"]);
  if (is_null($title)) {
    echo 'Invalid page title: ' . $title_text . ". Page not created.\n";
    return;
  } else {
    $article = new Article($title);
    $text = file_get_contents($filename);
    global $wgTitle;
    $wgTitle = $title;
    if ($article->exists()) {
      $summary = 'Overwrote Page.';
      $article->doEdit($text, $summary, EDIT_UPDATE);
      echo $filename . ": overwrote page\n";
    } else {
      $summary = 'Created Page.';
      $article->doEdit($text, $summary, EDIT_NEW);
      echo $filename . ": created page\n";
    }
  }
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
