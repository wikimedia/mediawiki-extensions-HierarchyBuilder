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

if( !defined( 'MEDIAWIKI' ) ) die( "This is an extension to the MediaWiki 
	package and cannot be run standalone." );
 
# credits
$wgExtensionCredits['special'][] = array (
	'name' => 'EmailAuthorization',
	'version' => '1.0',
	'author' => "Cindy Cicalese",
	'description' => "Configure authorization by email address"
);
 
$wgGroupPermissions['sysop' ]['configemailauthorization'] = true;

$wgAutoloadClasses['EmailAuthorization'] =
	__DIR__ . '/EmailAuthorization.class.php';
$wgAutoloadClasses['ConfigEmailAuthorization'] =
	__DIR__ . '/ConfigEmailAuthorization.class.php';

$wgExtensionMessagesFiles['ConfigEmailAuthorization'] =
	__DIR__ . '/ConfigEmailAuthorization.i18n.php';
$wgExtensionMessagesFiles['ConfigEmailAuthorizationAlias'] =
	__DIR__ . '/ConfigEmailAuthorization.alias.php';

$wgHooks['LoadExtensionSchemaUpdates'][] =
	'EmailAuthorization::loadExtensionSchemaUpdates';

$wgSpecialPages['ConfigEmailAuthorization'] = 'ConfigEmailAuthorization';
