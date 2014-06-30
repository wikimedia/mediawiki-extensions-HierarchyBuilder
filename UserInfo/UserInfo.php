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
	'name' => 'UserInfo',
	'version' => '1.0',
	'author' => "Cindy Cicalese",
	'description' => "List user information"
);
 
$wgExtensionMessagesFiles['UserInfo'] = __DIR__ . '/UserInfo.i18n.php';
$wgExtensionMessagesFiles['UserInfoAlias'] = __DIR__ . '/UserInfo.alias.php';

$wgSpecialPages['UserInfo'] = 'UserInfo';

class UserInfo extends SpecialPage {

	function __construct() {
		parent::__construct('UserInfo', 'userinfo');
	}

	function execute($par) {
		if (!$this->userCanExecute($this->getUser())) {
			$this->displayRestrictionError();
			return;
		}

		$request = $this->getRequest();
		$this->setHeaders();
 
		$limit = $request->getText('limit');
		if (is_null($limit) || strlen($limit) == 0 || !is_numeric($limit) ||
			$limit < 1) {
			$limit = 50;
		}

		$offset = $request->getText('offset');
		if (is_null($offset) || strlen($offset) == 0 || !is_numeric($offset) ||
			$offset < 0) {
			$offset = 0;
		}

		$users = self::getUsers($limit + 1, $offset);
		$next = false;

		if (!$users->valid()) {
			$offset = 0;
			$users = self::getUsers($limit + 1, $offset);
			if (!$users->valid()) {
				$wikitext = "no users found";
				$this->getOutput()->addHTML($wikitext);
				return;
			}
		}

		$this->getOutput()->addHtml("<table style='width:100%;'><tr><td>");
		$wikitext .= '{| class="wikitable" style="width:100%;"' . PHP_EOL;
		$wikitext .= "!Username" . PHP_EOL;
		$wikitext .= "!Real Name" . PHP_EOL;
		$wikitext .= "!Email" . PHP_EOL;
		$wikitext .= "!Groups" . PHP_EOL;
		$wikitext .= "!User Page" . PHP_EOL;

		$index = 0;
		$more = false;
		foreach ($users as $user) {
			if ($index < $limit) {
				$wikitext .= "|-" . PHP_EOL;
				$wikitext .= "|" . $user->user_name . PHP_EOL;
				$wikitext .= "|" . $user->user_real_name . PHP_EOL;
				$wikitext .= "|" . $user->user_email . PHP_EOL;
				$wikitext .= "|" . self::getGroups($user->user_id) . PHP_EOL;
				$wikitext .= "|[[User:" . $user->user_name . "]]" . PHP_EOL;
				$index ++;
			} else {
				$more = true;
			}
		}

		$wikitext .= "|}" . PHP_EOL;
		$this->getOutput()->addWikiText($wikitext);

		if ($offset > 0 || $more) {

			$title = Title::newFromText("Special:UserInfo");
			$url = $title->getFullURL();

			$this->getOutput()->addHtml("</td></tr><tr><td>");
			$this->getOutput()->addHtml("<table style='width:100%;'><tr><td>");

			if ($offset > 0) {
				$html = '<a href="' . $url . '?limit=' . $limit .
					'&offset=' .  ($offset - $limit) .  '">Previous</a>';
				$this->getOutput()->addHtml($html);
			}

			$this->getOutput()->addHtml("</td><td style='text-align:right;'>");

			if ($more) {
				$html = '<a href="' . $url . '?limit=' . $limit . '&offset=' .
					($offset + $limit) .  '">Next</a>';
				$this->getOutput()->addHtml($html);
			}

			$this->getOutput()->addHtml("</td></tr></table>");
		}

		$this->getOutput()->addHtml("</td></tr></table>");
	}

	private static function getUsers($limit, $offset) {
		$dbr = wfGetDB(DB_SLAVE);
		$users = $dbr->select('user',
			array(
				'user_id',
				'user_name',
				'user_real_name',
				'user_email'
			),
			'',
			__METHOD__,
			array ( // OPTIONS
				'LIMIT' => $limit,
				'OFFSET' => $offset
			)
		);
		return $users;
	}

	private static function getGroups($id) {
		$dbr = wfGetDB(DB_SLAVE);
		$groups = $dbr->select('user_groups',
			array(
				'ug_group'
			),
			array(
				'ug_user' => $id
			),
			__METHOD__
		);
		$group_array = array();
		foreach ($groups as $group) {
			$group_array[] = $group->ug_group;
		}
		return implode(", ", $group_array);
	}

}
