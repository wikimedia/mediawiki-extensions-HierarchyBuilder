<?php

/*
 * Copyright (c) 2013 The MITRE Corporation
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

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of OpenIDConnect is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['semantic'][] = array (
	'name' => 'OpenID Connect Authorization',
	'version' => '1.0',
	'author' => array(
		'[https://www.mediawiki.org/wiki/User:Cindy.cicalese Cindy Cicalese]'
	),
	'descriptionmsg' => 'openidconnectauthorization-desc',
	'url' => 'https://www.mediawiki.org/wiki/Extension:OpenID_Connect_Authorization',
);

$wgAutoloadClasses['OpenIDConnectAuthorization'] =
	__DIR__ . '/OpenIDConnectAuthorization.class.php';

$wgExtensionMessagesFiles['OpenIDConnectAuthorization'] =
	__DIR__ . '/OpenIDConnectAuthorization.i18n.php';

$wgSpecialPages['OpenIDConnectNotAuthorized'] = 'OpenIDConnectNotAuthorized';
$wgAutoloadClasses['OpenIDConnectNotAuthorized'] =
	__DIR__ . '/OpenIDConnectNotAuthorized.class.php';

$wgHooks['LoadExtensionSchemaUpdates'][] =
	'OpenIDConnectAuthorization::loadExtensionSchemaUpdates';
$wgHooks['OpenIDConnectUserAuthorization'][] =
	'OpenIDConnectAuthorization::authorize';