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

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/InactivityTimeout/InactivityTimeout.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.20', 'lt')) {
	die('<b>Error:</b> This version of InactivityTimeout is only compatible with MediaWiki 1.20 or above.');
}

# credits
$wgExtensionCredits['other'][] = array (
	'name' => 'InactivityTimeout',
	'version' => '1.0',
	'author' => "Cindy Cicalese",
	'descriptionmsg' => 'inactivitytimeout-desc'
);
 
$wgResourceModules['ext.InactivityTimeout'] = array(
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'InactivityTimeout',
	'scripts' => 'InactivityTimeout.js',
	'styles' => 'InactivityTimeout.css'
);

$wgExtensionMessagesFiles['InactivityTimeout'] =
  __DIR__ . '/InactivityTimeout.i18n.php';

$wgHooks['ParserFirstCallInit'][] = 'efInactivityTimeoutSetup';

$wgInactivityTimeout_Timeout = 60 * 60 * 1000; // one hour

function efInactivityTimeoutSetup (& $parser) {
	global $wgHooks;
	$wgHooks['BeforePageDisplay'][] = 'InactivityTimeout::setup';
	return true;
}

class InactivityTimeout {
	static function setup(&$out, &$skin) {
		$out->addModules('ext.InactivityTimeout');
		global $wgInactivityTimeout_Timeout;
		$message = wfMessage('inactivitytimeout-warning')->parse();
		$script =<<<END
mw.loader.using(['ext.InactivityTimeout'], function () {
	mw.extInactivityTimeout.setup($wgInactivityTimeout_Timeout, "$message");
});
END;
		$script = '<script type="text/javascript">' . $script . "</script>";
		$out->addScript($script);
		return true;
	}
}
