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

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/VikiDynamicPages/VikiDynamicPages.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (!defined('VIKIJS_VERSION')) {
	die("<b>Error:</b> The extension VikiDynamicPages requires VikiJS to be installed first. Be sure that VikiJS is included on a line ABOVE the line where you've included VikiDynamicPages.");
}

if (version_compare($wgVersion, '1.22', 'lt')) {
	die('<b>Error:</b> This version of VikiDynamicPages is only compatible with MediaWiki 1.22 or above.');
}

if ( !defined( 'SMW_VERSION' ) ) {
	die( '<b>Error:</b> You need to have <a href="https://semantic-mediawiki.org/wiki/Semantic_MediaWiki">Semantic MediaWiki</a> installed in order to use VikiTitleIcon.' );
}

if(version_compare(SMW_VERSION, '1.9', '<')) {
	die('<b>Error:</b> VikiTitleIcon is only compatible with Semantic MediaWiki 1.9 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'VikiDynamicPages',
	'version' => '1.1',
	'author' => 'Jason Ji',
	'descriptionmsg' => 'vikidynamicpages-desc'
);

$wgExtensionMessagesFiles['VikiDynamicPages'] =
	__DIR__ . '/VikiDynamicPages.i18n.php';

$wgResourceModules['ext.VikiDynamicPages'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'VikiDynamicPages',
	'scripts' => array(
		'VikiDynamicPages.js'
	)
);

global $VikiJS_Function_Hooks;

if(!isset($VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks = array();

if(array_key_exists('BeforeVisitNodeHook', $VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks['BeforeVisitNodeHook'][] = 'VIKI.VikiDynamicPages.processQueryString';
else
	$VikiJS_Function_Hooks['BeforeVisitNodeHook'] = array('VIKI.VikiDynamicPages.processQueryString');

if(array_key_exists('NewWikiNodeCreatedHook', $VikiJS_Function_Hooks))
	$VikiJS_Function_Hooks['NewWikiNodeCreatedHook'][] = 'VIKI.VikiDynamicPages.checkForSelfLink';
else
	$VikiJS_Function_Hooks['NewWikiNodeCreatedHook'] = array('VIKI.VikiDynamicPages.checkForSelfLink');

$wgHooks['ParserFirstCallInit'][] = 'efVikiDynamicPages_AddResource';

function efVikiDynamicPages_AddResource (& $parser) {

	VikiJS::addResourceModule("ext.VikiDynamicPages");
	VikiJS::addPHPHook("efVikiDynamicPages_Setup", array(&$parser));
	return true;

}

function efVikiDynamicPages_Setup($params) {
	global $egVikiDynamicPagePropertyName;
	global $wgOut;

	$script = <<<END
mw.loader.using('ext.VikiDynamicPages', function() {
	VIKI.VikiDynamicPages.parseDynamicPagePropertyName("$egVikiDynamicPagePropertyName");	
});
END;

	$script = '<script type="text/javascript">' . $script . '</script>';
	$wgOut->addScript($script);
}