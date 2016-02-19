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

if ( function_exists( 'wfLoadExtension' ) ) {
	wfLoadExtension( 'HierarchyBuilder' );
	// Keep i18n globals so mergeMessageFileList.php doesn't break
	$wgMessagesDirs['HierarchyBuilder'] = __DIR__ . "/i18n";
	$wgExtensionMessagesFiles['HierarchyBuilder'] = __DIR__ . '/HierarchyBuilder.i18n.php';
	$wgExtensionMessagesFiles['HierarchyBuilderMagic'] = __DIR__ . '/HierarchyBuilder.i18n.magic.php';
	wfWarn(
		'Deprecated PHP entry point used for HierarchyBuilder extension. ' .
		'Please use wfLoadExtension instead, see ' .
		'https://www.mediawiki.org/wiki/Extension_registration for more details.'
	);
	return;
}

if ( !defined( 'MEDIAWIKI' ) ) {
	die( '<b>Error:</b> This file is part of a MediaWiki extension and cannot' .
		' be run standalone.' );
}

if ( version_compare( $wgVersion, '1.21', 'lt' ) ) {
	die( '<b>Error:</b> This version of HierarchyBuilder is only compatible ' .
		'with MediaWiki 1.21 or above.' );
}

if ( !defined( 'SF_VERSION' ) ) {
	die( '<b>Error:</b> HierarchyBuilder is a Semantic Forms extension so must' .
		' be included after Semantic Forms.' );
}

if ( version_compare( SF_VERSION, '2.5.2', 'lt' ) ) {
	die( '<b>Error:</b> This version of HierarchyBuilder is only compatible with' .
		' Semantic Forms 2.5.2 or above.' );
}

define( 'HB_VERSION', '3.2.1' );

# credits
$wgExtensionCredits['parserhook'][] = array (
	'path' => __FILE__,
	'name' => 'HierarchyBuilder',
	'version' => HB_VERSION,
	'author' => array(
		'[https://www.mediawiki.org/wiki/User:Cindy.cicalese Cindy Cicalese]',
		'[https://www.mediawiki.org/wiki/User:Kevin.ji Kevin Ji]'
	),
	'descriptionmsg' => 'hierarchybuilder-desc',
	'url' => 'https://www.mediawiki.org/wiki/Extension:HierarchyBuilder'
);

$wgHooks['ParserFirstCallInit'][] = 'HierarchyBuilderHooks::efHierarchyBuilderSetup';

$wgAutoloadClasses['HierarchyBuilder'] = __DIR__ . '/HierarchyBuilder_body.php';
$wgAutoloadClasses['HierarchyBuilderHooks'] = __DIR__ . '/HierarchyBuilder.hooks.php';
$wgAutoloadClasses['HierarchyFormInput'] = __DIR__ . '/includes/HierarchyFormInput.php';
$wgAutoloadClasses['HierarchySelectFormInput'] = __DIR__ . '/includes/HierarchySelectFormInput.php';
$wgAutoloadClasses['HierarchyTree'] = __DIR__ . '/includes/HierarchyTree.php';
$wgAutoloadClasses['TreeNode'] = __DIR__ . '/includes/TreeNode.php';

$wgMessagesDirs['HierarchyBuilder'] = __DIR__ . "/i18n";
$wgExtensionMessagesFiles['HierarchyBuilder'] = __DIR__ . '/HierarchyBuilder.i18n.php';
$wgExtensionMessagesFiles['HierarchyBuilderMagic'] =
	__DIR__ . '/HierarchyBuilder.i18n.magic.php';

$wgResourceModules['ext.HierarchyBuilder.jstree'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'HierarchyBuilder',
	'styles' => 'themes/apple/style.css',
	'scripts' => '/includes/jquery.jstree.js'
);

$wgResourceModules['ext.HierarchyBuilder.render'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'HierarchyBuilder',
	'scripts' => '/includes/renderHierarchy.js',
	'styles' => '/includes/renderHierarchy.css',
	'dependencies' => array(
		'ext.HierarchyBuilder.jstree'
	)
);

$wgResourceModules['ext.HierarchyBuilder.renderSelected'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'HierarchyBuilder',
	'scripts' => '/includes/renderHierarchySelected.js',
	'dependencies' => array(
		'ext.HierarchyBuilder.jstree'
	)
);

$wgResourceModules['ext.HierarchyBuilder.edit'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'HierarchyBuilder',
	'scripts' => '/includes/editHierarchy.js',
	'styles' => '/includes/editHierarchy.css',
	'dependencies' => array(
		'ext.HierarchyBuilder.jstree',
		'ext.semanticforms.main'
	)
);

$wgResourceModules['ext.HierarchyBuilder.select'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'HierarchyBuilder',
	'scripts' => '/includes/selectFromHierarchy.js',
	'styles' => '/includes/selectFromHierarchy.css',
	'dependencies' => array(
		'ext.HierarchyBuilder.jstree',
		'ext.semanticforms.main'
	)
);
