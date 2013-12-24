<?php

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/CreateUserPage/CreateUserPage.php");
*/

define('CUPOFL_VERSION', '1.0');

# credits
$wgExtensionCredits['parserhook'][] = array (
	'name' => 'CreateUserPage',
	'version' => CUPOFL_VERSION,
	'author' => "Cindy Cicalese",
	'description' => "Automatically create a user page for a user logging in if it does not exists already"
);

$wgHooks['UserLoginComplete'][] = 'wfUserLoginComplete';

$CreateUserPage_PageContent = "{{User}}";

function wfUserLoginComplete(&$user, &$inject_html) {
	$title = Title::newFromText('User:' . $user->mName);
	if (!is_null($title) && !$title->exists()) {
		$page = new WikiPage($title);
		global $CreateUserPage_PageContent;
		$page->doEdit($CreateUserPage_PageContent, 'create user page',
			EDIT_NEW);
	}
	return true;
}
