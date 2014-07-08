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

class ConfigEmailAuthorization extends SpecialPage {

	function __construct() {
		parent::__construct('ConfigEmailAuthorization',
			'configemailauthorization');
	}

	function execute($par) {
		if (!$this->userCanExecute($this->getUser())) {
			$this->displayRestrictionError();
			return;
		}

		$request = $this->getRequest();
		$this->setHeaders();
 
		$search = self::searchemail($request->getText('searchemail'));
		self::addEmail($request->getText('addemail'));
		self::revokeEmail($request->getText('revokeemail'));
		self::showAuthorizedUsers($request->getText('authoffset'));
		self::showAllUsers($request->getText('alloffset'));

		$title = Title::newFromText("Special:ConfigEmailAuthorization");
		$url = $title->getFullURL();

		self::showSearchForm($url);

		if (is_null($search)) {
			$defaultAddEmail = trim($request->getText('revokeemail'));
		} else if (!$search) {
			$defaultAddEmail = trim($request->getText('searchemail'));
		}
		self::showAddForm($url, $defaultAddEmail);

		if (is_null($search)) {
			$defaultRevokeEmail = trim($request->getText('addemail'));
		} else if ($search) {
			$defaultRevokeEmail = trim($request->getText('searchemail'));
		}
		self::showRevokeForm($url, $defaultRevokeEmail);

		self::showAuthorizedUsersForm($url);
		self::showAllUsersForm($url);
	}

	private function searchEmail($email) {
		if (!is_null($email) && strlen($email) > 0) {
			$email = mb_strtolower(htmlentities(trim($email)));
			if (self::isEmailAuthorized($email)) {
				$wikitext = $email . " is authorized.";
				$this->getOutput()->addHTML($wikitext);
				return true;
			} else {
				$wikitext = $email . " is not authorized.";
				$this->getOutput()->addHTML($wikitext);
				return false;
			}
		}
		return null;
	}

	private function addEmail($email) {
		if (!is_null($email) && strlen($email) > 0) {
			$email = mb_strtolower(htmlentities(trim($email)));
			if (self::insertEmail($email)) {
				$wikitext = 'successfully added ' . $email;
				$this->getOutput()->addHTML($wikitext);
				return true;
			} else {
				$wikitext = $email . " is already authorized.";
				$this->getOutput()->addHTML($wikitext);
			}
		}
		return false;
	}

	private function revokeEmail($email) {
		if (!is_null($email) && strlen($email) > 0) {
			$email = mb_strtolower(htmlentities(trim($email)));
			if (self::deleteEmail($email)) {
				$wikitext = 'successfully revoked authorization from ' . $email;
				$this->getOutput()->addHTML($wikitext);
				return true;
			} else {
				$wikitext = $email . " was not authorized.";
				$this->getOutput()->addHTML($wikitext);
			}
		}
		return false;
	}

	private function showAuthorizedUsers($autoffset) {


		if (is_null($autoffset) || strlen($autoffset) == 0 ||
			!is_numeric($autoffset) || $autoffset < 0) {
			return;
		}

		$limit = 20;

		$emails = self::getAuthorizedEmails($limit + 1, $autoffset);
		$next = false;

		if (!$emails->valid()) {
			$autoffset = 0;
			$emails = self::getAuthorizedEmails($limit + 1, $autoffset);
			if (!$emails->valid()) {
				$wikitext = "no authorized email addresses found";
				$this->getOutput()->addHTML($wikitext);
				return;
			}
		}

		$this->getOutput()->addHtml("<table style='width:100%;'><tr><td>");
		$wikitext .= '{| class="wikitable" style="width:100%;"' . PHP_EOL;
		$wikitext .= "!Email" . PHP_EOL;
		$wikitext .= "!Username" . PHP_EOL;
		$wikitext .= "!Real Name" . PHP_EOL;
		$wikitext .= "!User Page" . PHP_EOL;

		$index = 0;
		$more = false;
		foreach ($emails as $email) {
			if ($index < $limit) {
				$wikitext .= "|-" . PHP_EOL;
				$wikitext .= "|" . $email->email . PHP_EOL;
				$user = self::getUserInfo($email->email);
				if (is_null($user)) {
					$wikitext .= "| &nbsp;" . PHP_EOL;
					$wikitext .= "| &nbsp;" . PHP_EOL;
					$wikitext .= "| &nbsp;" . PHP_EOL;
				} else {
					$wikitext .= "|" . $user->user_name . PHP_EOL;
					$wikitext .= "|" . $user->user_real_name . PHP_EOL;
					$wikitext .= "|[[User:" . $user->user_name . "]]" . PHP_EOL;
				}
				$index ++;
			} else {
				$more = true;
			}
		}

		$wikitext .= "|}" . PHP_EOL;
		$this->getOutput()->addWikiText($wikitext);

		if ($autoffset > 0 || $more) {

			$title = Title::newFromText("Special:ConfigEmailAuthorization");
			$url = $title->getFullURL();

			$this->getOutput()->addHtml("</td></tr><tr><td>");
			$this->getOutput()->addHtml("<table style='width:100%;'><tr><td>");

			if ($autoffset > 0) {
				$html = '<a href="' . $url .
					'?autoffset=' .  ($autoffset - $limit) .  '">Previous</a>';
				$this->getOutput()->addHtml($html);
			}

			$this->getOutput()->addHtml("</td><td style='text-align:right;'>");

			if ($more) {
				$html = '<a href="' . $url . '?autoffset=' .
					($autoffset + $limit) .  '">Next</a>';
				$this->getOutput()->addHtml($html);
			}

			$this->getOutput()->addHtml("</td></tr></table>");
		}

		$this->getOutput()->addHtml("</td></tr></table>");
	}

	private function showAllUsers($alloffset) {


		if (is_null($alloffset) || strlen($alloffset) == 0 ||
			!is_numeric($alloffset) || $alloffset < 0) {
			return;
		}

		$limit = 20;

		$users = self::getUsers($limit + 1, $alloffset);
		$next = false;

		if (!$users->valid()) {
			$alloffset = 0;
			$users = self::getUsers($limit + 1, $alloffset);
			if (!$users->valid()) {
				$wikitext = "no users found";
				$this->getOutput()->addHTML($wikitext);
				return;
			}
		}

		$this->getOutput()->addHtml("<table style='width:100%;'><tr><td>");
		$wikitext .= '{| class="wikitable" style="width:100%;"' . PHP_EOL;
		$wikitext .= "!Email" . PHP_EOL;
		$wikitext .= "!Username" . PHP_EOL;
		$wikitext .= "!Real Name" . PHP_EOL;
		$wikitext .= "!User Page" . PHP_EOL;
		$wikitext .= "!Authorized" . PHP_EOL;

		$index = 0;
		$more = false;
		foreach ($users as $user) {
			if ($index < $limit) {
				$wikitext .= "|-" . PHP_EOL;
				$wikitext .= "|" . $user->user_email . PHP_EOL;
				$wikitext .= "|" . $user->user_name . PHP_EOL;
				$wikitext .= "|" . $user->user_real_name . PHP_EOL;
				$wikitext .= "|[[User:" . $user->user_name . "]]" . PHP_EOL;
				if (self::isEmailAuthorized($user->user_email)) {
					$wikitext .= "| style='text-align:center;' | yes" . PHP_EOL;
				} else {
					$wikitext .= "| style='text-align:center;' | no" . PHP_EOL;
				}
				$index ++;
			} else {
				$more = true;
			}
		}

		$wikitext .= "|}" . PHP_EOL;
		$this->getOutput()->addWikiText($wikitext);

		if ($alloffset > 0 || $more) {

			$title = Title::newFromText("Special:ConfigEmailAuthorization");
			$url = $title->getFullURL();

			$this->getOutput()->addHtml("</td></tr><tr><td>");
			$this->getOutput()->addHtml("<table style='width:100%;'><tr><td>");

			if ($alloffset > 0) {
				$html = '<a href="' . $url .
					'?alloffset=' .  ($alloffset - $limit) .  '">Previous</a>';
				$this->getOutput()->addHtml($html);
			}

			$this->getOutput()->addHtml("</td><td style='text-align:right;'>");

			if ($more) {
				$html = '<a href="' . $url . '?alloffset=' .
					($alloffset + $limit) .  '">Next</a>';
				$this->getOutput()->addHtml($html);
			}

			$this->getOutput()->addHtml("</td></tr></table>");
		}

		$this->getOutput()->addHtml("</td></tr></table>");
	}

	private function showSearchForm($url) {
		$html = Html::openElement('form', array(
				'method' => 'post',
				'action' => $url,
				'id' => 'SearchEmail')
			) .
			Html::openElement('fieldset') .
			Html::element('legend', null, 'Search for email address:');
		list($label, $input) =
			Xml::inputLabelSep('Email address:', 'searchemail', 'searchemail',
			50);
		$html .= $label . ' ' . $input . ' ' . Xml::submitButton('Search') .
			Html::closeElement('fieldset') .
			Html::closeElement('form');
		$this->getOutput()->addHTML($html);
	}

	private function showAddForm($url, $default) {
		$html = Html::openElement('form', array(
				'method' => 'post',
				'action' => $url,
				'id' => 'AddEmail')
			) .
			Html::openElement('fieldset') .
			Html::element('legend', null, 'Add authorized email address:');
		list($label, $input) =
			Xml::inputLabelSep('Email address:', 'addemail', 'addemail', 50,
			$default);
		$html .= $label . ' ' . $input . ' ' . Xml::submitButton('Add') .
			Html::closeElement('fieldset') .
			Html::closeElement('form');
		$this->getOutput()->addHTML($html);
	}

	private function showRevokeForm($url, $default) {
		$html = Html::openElement('form', array(
				'method' => 'post',
				'action' => $url,
				'id' => 'RevokeEmail')
			) .
			Html::openElement('fieldset') .
			Html::element('legend', null, 'Revoke authorized email address:');
		list($label, $input) =
			Xml::inputLabelSep('Email address:', 'revokeemail', 'revokeemail',
			50, $default);
		$html .= $label . ' ' . $input . ' ' . Xml::submitButton('Revoke') .
			Html::closeElement('fieldset') .
			Html::closeElement('form');
		$this->getOutput()->addHTML($html);
	}

	private function showAuthorizedUsersForm($url) {
		$html = Html::openElement('form', array(
				'method' => 'post',
				'action' => $url,
				'id' => 'ShowAuthorizedUsers')
			) .
			Html::hidden('authoffset', 0) .
			Xml::submitButton('Show Authorized Users') .
			Html::closeElement('form') .
			Html::element('br');
		$this->getOutput()->addHTML($html);
	}

	private function showAllUsersForm($url) {
		$html = Html::openElement('form', array(
				'method' => 'post',
				'action' => $url,
				'id' => 'ShowAllUsers')
			) .
			Html::hidden('alloffset', 0) .
			Xml::submitButton('Show All Users') .
			Html::closeElement('form');
		$this->getOutput()->addHTML($html);
	}

	private static function getAuthorizedEmails($limit, $authoffset) {
		$dbr = wfGetDB(DB_SLAVE);
		$emails = $dbr->select('emailauth',
			array(
				'email'
			),
			'',
			__METHOD__,
			array ( // OPTIONS
				'LIMIT' => $limit,
				'OFFSET' => $authoffset
			)
		);
		return $emails;
	}

	private static function getUsers($limit, $alloffset) {
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
				'OFFSET' => $alloffset,
				'ORDER BY' => 'user_name'
			)
		);
		return $users;
	}

	private static function isEmailAuthorized($email) {
		$dbr = wfGetDB(DB_SLAVE);
		$row = $dbr->selectRow('emailauth',
			array(
				'email'
			),
			array(
				'email' => $email
			), __METHOD__
		);
		if ($row === false) {
			return false;
		} else {
			return true;
		}
	}

	private static function getUserInfo($email) {
		$dbr = wfGetDB(DB_SLAVE);
		$row = $dbr->selectRow('user',
			array(
				'user_name',
				'user_real_name'
			),
			array(
				'user_email' => $email
			), __METHOD__
		);
		if ($row === false) {
			return null;
		} else {
			return $row;
		}
	}

	private static function insertEmail($email) {
		$dbw = wfGetDB(DB_MASTER);
		$dbw->insert('emailauth',
			array(
				'email' => $email
			), __METHOD__,
			array(
				'IGNORE'
			)
		);
		if ($dbw->affectedRows() === 1) {
			return true;
		} else {
			return false;
		}
	}

	private static function deleteEmail($email) {
		$dbw = wfGetDB(DB_MASTER);
		$dbw->delete('emailauth',
			array(
				'email' => $email
			), __METHOD__,
			array(
				'IGNORE'
			)
		);
		if ($dbw->affectedRows() === 1) {
			return true;
		} else {
			return false;
		}
	}
}
