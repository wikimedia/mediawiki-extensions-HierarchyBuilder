<?php

/*
 * Copyright (c) 2014 The MITRE Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.23', 'lt')) {
	die('<b>Error:</b> This version of PluggableAuth is only compatible with MediaWiki 1.23 or above.');
}

$wgExtensionCredits['other'][] = array (
	'name' => 'PluggableAuth',
	'version' => '1.0',
	'author' => array(
		'[https://www.mediawiki.org/wiki/User:Cindy.cicalese Cindy Cicalese]'
	),
	'descriptionmsg' => 'pluggableauth-desc',
	'url' => 'https://www.mediawiki.org/wiki/Extension:PluggableAuth',
);

$wgAutoloadClasses['PluggableAuth'] = __DIR__ . '/PluggableAuth.class.php';
$wgExtensionMessagesFiles['PluggableAuth'] =
	__DIR__ . '/PluggableAuth.i18n.php';

$wgHooks['UserLoadFromSession'][] = 'PluggableAuth::userLoadFromSession';
$wgHooks['UserLogout'][] = 'PluggableAuth::logout';
$wgHooks['PersonalUrls'][] = 'PluggableAuth::modifyLoginURLs';
$wgHooks['SpecialPage_initList'][] = 'PluggableAuth::modifyLoginSpecialPages';

$wgSpecialPages['Userlogin'] = 'PluggableAuthLogin';
$wgAutoloadClasses['PluggableAuthLogin'] =
	__DIR__ . '/PluggableAuthLogin.class.php';

$wgSpecialPages['PluggableAuthNotAuthorized'] = 'PluggableAuthNotAuthorized';
$wgAutoloadClasses['PluggableAuthNotAuthorized'] =
	__DIR__ . '/PluggableAuthNotAuthorized.class.php';
$wgWhitelistRead[] = "Special:PluggableAuthNotAuthorized";
