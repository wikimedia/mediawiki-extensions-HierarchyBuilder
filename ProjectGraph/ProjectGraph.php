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
* include_once("$IP/extensions/ProjectGraph/ProjectGraph.php");
*/

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.21', 'lt')) {
	die('<b>Error:</b> This version of ProjectGraph is only compatible with MediaWiki 1.21 or above.');
}

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'ProjectGraph',
	'version' => '1.3.1',
	'author' => "Cindy Cicalese",
	'descriptionmsg' => 'projectgraph-desc'
);
 
$wgExtensionMessagesFiles['ProjectGraph'] =
	__DIR__ . '/ProjectGraph.i18n.php';

$wgResourceModules['ext.ProjectGraph'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'ProjectGraph',
	'styles' => array(
		'ProjectGraph.css'
	),
	'scripts' => array(
		'd3.v3.min.js',
		'queries.js',
		'ProjectGraph.js'
	)
);

$wgHooks['LanguageGetMagic'][] = 'wfExtensionProjectGraph_Magic';
$wgHooks['ParserFirstCallInit'][] = 'efProjectGraphParserFunction_Setup';

function efProjectGraphParserFunction_Setup (& $parser) {
	$parser->setFunctionHook('projectgraph', 'projectgraph');
	$parser->setFunctionHook('stafftags', 'stafftags');
	$parser->setFunctionHook('projecttags', 'projecttags');
	return true;
}

function wfExtensionProjectGraph_Magic(& $magicWords, $langCode) {
	$magicWords['projectgraph'] = array (0, 'projectgraph');
	$magicWords['stafftags'] = array (0, 'stafftags');
	$magicWords['projecttags'] = array (0, 'projecttags');
	return true;
}

function projectgraph($parser, $projects, $people, $years) {
	$projectgraph = new ProjectGraph;
	$output = $projectgraph->display($parser, $projects, $people, $years);
	$parser->disableCache();
	return array($parser->insertStripItem($output, $parser->mStripState),
		'noparse' => false);
}

function stafftags($parser, $employeenumber) {
	$tagGetter = new TagGetter;
	$output = $tagGetter->get("employee", $employeenumber);
	$parser->disableCache();
	return $output;
}

function projecttags($parser, $projectnumber) {
	$tagGetter = new TagGetter;
	$output = $tagGetter->get("project", $projectnumber);
	$parser->disableCache();
	return $output;
}

class ProjectGraph {

	private static $pqnum = 0;

	function display($parser, $projects, $people, $years) {

		global $wgOut;
		$wgOut->addModules('ext.ProjectGraph');
 
		$div = "ProjectGraph_" . self::$pqnum++;
		$graphdiv = $div . "_graph";
		$detailsdiv = $div . "_details";

		$output = <<<EOT
<table>
<tr><td><div class="detail-panel" id="$detailsdiv">
</div></td></tr>
<tr><td><div class="graph-container" id="$graphdiv">
</div></td></tr>
</table>
EOT;

		if($people) {
			$people_json = addslashes(json_encode(array_map('trim', explode(',', $people))));
			$names = $this->getNamesFromLDAP($people);
			$names_json = addslashes(json_encode($names));
		}
		else {
			$names_json = "[]";
			$people_json = "[]";
		}

		global $wgServer;
		global $wgScriptPath;
		$imagePath = $wgServer . $wgScriptPath .  '/extensions/ProjectGraph/';
		$script =<<<END
mw.loader.using(['ext.ProjectGraph'], function () {
	ProjectGraph.drawGraph("$projects", "$people_json", "$years", "$graphdiv",
		"$detailsdiv", "$imagePath", "$names_json", 1200, 600);
});
END;

		$script = '<script type="text/javascript">' . $script . "</script>";
		$wgOut->addScript($script);
 
		return $output;
	}

	function getNamesFromLDAP($people) {
		wfErrorLog("people: $people\n", "/var/www/html/DEBUG_ProjectGraph.out");
		$ldapconn = @ldap_connect("ldap://ldap-int1.mitre.org:3890");
		if(!$ldapconn)
			wfErrorLog("no ldapconn\n", "/var/www/html/DEBUG_ProjectGraph.out");
		else {
			wfErrorLog("ldapconn successful \n", "/var/www/html/DEBUG_ProjectGraph.out");

			@ldap_set_option($ldapconn, LDAP_OPT_PROTOCOL_VERSION, 3);
			@ldap_set_option($ldapconn, LDAP_OPT_REFERRALS, 0);

			$employee_array = array_map('trim', explode(",",$people));
			
			wfErrorLog("array count: ", "/var/www/html/DEBUG_ProjectGraph.out");
			wfErrorLog(count($employee_array), "/var/www/html/DEBUG_ProjectGraph.out");
			wfErrorLog("\n", "/var/www/html/DEBUG_ProjectGraph.out");
			$names = array();
			foreach($employee_array as $person) {
				wfErrorLog("current employee: $person\n", "/var/www/html/DEBUG_ProjectGraph.out");
				$filter = "(|(employeenumber=$person))";
				$result = @ldap_search($ldapconn, "ou=People, o=mitre.org", $filter);
				if(!$result)
					wfErrorLog("no result\n", "/var/www/html/DEBUG_ProjectGraph.out");
				else {
					wfErrorLog("result: $result\n", "/var/www/html/DEBUG_ProjectGraph.out");
					$entries = @ldap_get_entries($ldapconn, $result);

					$new_name = $entries[0][cn][0];
					$new_name = str_replace(",", ", ", $new_name);
					array_push($names, $new_name);
					wfErrorLog("name: $new_name\n", "/var/www/html/DEBUG_ProjectGraph.out");
					
				}
			}
			wfErrorLog("Final names array:\n", "/var/www/html/DEBUG_ProjectGraph.out");
			wfErrorLog(count($names), "/var/www/html/DEBUG_ProjectGraph.out");
			foreach($names as $var)
				wfErrorLog("\t$var\n", "/var/www/html/DEBUG_ProjectGraph.out");

			@ldap_close();
		}

		return $names;
	}
}

class TagGetter {

	function get($entityType, $entityKey) {
		$url = "http://info.mitre.org/tags/entity/$entityType/$entityKey.json";
		$json = json_decode(Http::get($url));
		$output = implode(",", $json->{"tags"});
		return $output;
	}
}
