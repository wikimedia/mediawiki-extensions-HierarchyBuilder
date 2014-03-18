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

class OpenIDConnect {

	public static function autoLogin($user, &$result) {
		$result = self::loadUser($user);
		if (!$result) {
			if (session_id() == '') {
				wfSetupSession();
			}
			$session_variable = wfWikiID() . "_returnto";
			if ((!array_key_exists($session_variable, $_SESSION) ||
				$_SESSION[$session_variable] === null) &&
				array_key_exists('title', $_REQUEST)) {
				$_SESSION[$session_variable] = $_REQUEST['title'];
			}
			$result = self::login($user);
		}
		return false;
	}

	public static function userLoadFromSession($user, &$result) {
		$result = self::loadUser($user);
		return false;
	}

	private static function loadUser($user) {
		if ( session_id() == '' ) {
			wfSetupSession();
		}
		$session_variable = wfWikiID() . "_userid";
		if (array_key_exists($session_variable, $_SESSION)) {
			$user->mId = $_SESSION[$session_variable];
			if ($user->loadFromDatabase()) {
				$user->saveToCache();
				return true;
			}
		}
		return false;
	}

	public static function login($user) {
		if (!array_key_exists('SERVER_PORT', $_SERVER)) {
			return false;
		}

		$oidc = null;
		try {
			global $OpenIDConnect_Provider, $OpenIDConnect_ClientID,
				$OpenIDConnect_ClientSecret;
			if (!isset($OpenIDConnect_Provider) ||
				!isset($OpenIDConnect_ClientID) ||
				!isset($OpenIDConnect_ClientSecret)) {
				return false;
			}
			$oidc = new OpenIDConnectClient(
				$OpenIDConnect_Provider,
				$OpenIDConnect_ClientID,
				$OpenIDConnect_ClientSecret);
			if ($oidc->authenticate()) {
				$subject = $oidc->requestUserInfo('sub');
				$provider = $oidc->getProviderURL();
				$realname = $oidc->requestUserInfo("name");
				$email = $oidc->requestUserInfo("email");
				$user->mId = self::getId($subject, $provider);
				if (is_null($user->mId)) {
					$username = $oidc->requestUserInfo("preferred_username");
					$id = User::idFromName($username);
					global $OpenIDConnect_MigrateUsers;
					if ($id && isset($OpenIDConnect_MigrateUsers) &&
						$OpenIDConnect_MigrateUsers) {
						$user->mId = $id;
						$user->loadFromDatabase();
						self::updateUser($user, $realname, $email);
						$user->saveToCache();
					} else {
						$name = self::getAvailableUsername($username);
						$user->loadDefaults($name);
						$user->mRealName = $realname;
						$user->mEmail = $email;
						$user->mEmailAuthenticated = wfTimestamp();
						$user->mTouched = wfTimestamp();
						$user->addToDatabase();
						self::updateName($user, $name);
						self::updateUser($user, $realname, $email);
					}
					self::setExtraProperties($user->mId, $subject,
						$provider);
				} else {
					$user->loadFromDatabase();
					self::updateUser($user, $realname, $email);
					$user->saveToCache();
				}
			} else {
				return false;
			}
		} catch (Exception $e) {
			return false;
		}

		$authorized = true;
		wfRunHooks('OpenIDConnectUserAuthorization', array($user,
			&$authorized));
		$returnto = null;
		$params = null;
		if ($authorized) {
			if (session_id() == '') {
				wfSetupSession();
			}
			$session_variable = wfWikiID() . "_userid";
			$_SESSION[$session_variable] = $user->mId;
			$session_variable = wfWikiID() . "_returnto";
			if (array_key_exists($session_variable, $_SESSION)) {
				$returnto = $_SESSION[$session_variable];
				unset($_SESSION[$session_variable]);
			}
		} else {
			$returnto = 'Special:OpenIDConnectNotAuthorized';
			$params = array('name' => $user->mName);
		}
		global $wgOut;
		self::redirect($returnto, $wgOut, $params);
		return $authorized;
	}

	public static function logout() {
		if ( session_id() == '' ) {
			wfSetupSession();
		}
		$session_variable = wfWikiID() . "_userid";
		if (array_key_exists($session_variable, $_SESSION)) {
			unset($_SESSION[$session_variable]);
		}
	}

	public static function redirect($returnto, $oidc, $params = null) {
		$redirectTitle = Title::newFromText($returnto);
		if (is_null($redirectTitle)) {
			$redirectTitle = Title::newMainPage();
		}
		$redirectURL = $redirectTitle->getFullURL();
		if (is_array($params) && count($params) > 0) {
			$first = true;
			foreach ($params as $key => $value) {
				if ($first) {
					$first = false;
					$redirectURL .= '?';
				} else {
					$redirectURL .= '&';
				}
				$redirectURL .= $key . '=' . $value;
			}
		}
		$oidc->redirect($redirectURL);
	}	

	private static function getId($subject, $provider) {
		$dbr = wfGetDB(DB_SLAVE);
		$row = $dbr->selectRow('user',
			array('user_id'),
			array(
				'subject' => $subject,
				'provider' => $provider
			), __METHOD__
		);
		if ($row === false) {
			return null;
		} else {
			return $row->user_id;
		}
	}

	public static function getAvailableUsername($name) {
		$nt = Title::makeTitleSafe(NS_USER, $name);
		if (is_null($nt)) {
			$name = "User";
		} else if (is_null(User::idFromName($name))) {
			return $nt->getText();
		}
		$count = 1;
		while (!is_null(User::idFromName($name . $count))) {
			$count++;
		}
		return $name . $count;
	}

	private static function updateName($user, $name) {
		if ($user->mName != $name) {
			$user->mName = $name;
			$dbw = wfGetDB(DB_MASTER);
			$dbw->update('user',
				array( // SET
					'user_name' => $name,
				), array( // WHERE
					'user_id' => $user->mId
				), __METHOD__
			);
		}
	}

	private static function updateUser($user, $realname, $email) {
		if ($user->mRealName != $realname || $user->mEmail != $email) {
			$user->mRealName = $realname;
			$user->mEmail = $email;
			$dbw = wfGetDB(DB_MASTER);
			$dbw->update('user',
				array( // SET
					'user_real_name' => $realname,
					'user_email' => $email
				), array( // WHERE
					'user_id' => $user->mId
				), __METHOD__
			);
		}
	}

	private static function setExtraProperties($id, $subject, $provider) {
		$dbw = wfGetDB(DB_MASTER);
		$dbw->update('user',
			array( // SET
				'subject' => $subject,
				'provider' => $provider
			), array( // WHERE
				'user_id' => $id
			), __METHOD__
		);
	}

	public static function loadExtensionSchemaUpdates($updater) {
		$updater->addExtensionField('user', 'subject',
			__DIR__ . '/AddSubject.sql');
		$updater->addExtensionField('user', 'provider',
			__DIR__ . '/AddProvider.sql');
		return true;
	}

	public static function modifyLoginURLs(&$personal_urls, &$title) {
		$urls = array(
			'createaccount',
			'login',
			'anonlogin',
			'logout'
		);
		foreach ($urls as $u) {
			if (array_key_exists($u, $personal_urls)) {
				unset($personal_urls[$u]);
			}
		}
		global $OpenIDConnect_AutoLogin;
		if (!isset($OpenIDConnect_AutoLogin) || !$OpenIDConnect_AutoLogin) {
			// replace with skin parameter in MW 1.23
			global $wgOut;
			$skin = $wgOut->getSkin();
			if ($skin->getUser()->isLoggedIn()) {
				$href = Title::newFromText('Special:OpenIDConnectLogout')->
					getFullURL() . '?returnto=' . $title->getPrefixedText();
				$personal_urls['openidconnectlogout'] = array(
					'text' => wfMessage('openidconnectlogout')->text(),
					'href' => $href
				);
			} else {
				$href = Title::newFromText('Special:OpenIDConnectLogin')->
					getFullURL();
				$returnto = $title->getPrefixedText();
				if ($returnto != "Special:Badtitle") {
					$href .= '?returnto=' . $returnto;
				}
				$personal_urls['openidconnectlogin'] = array(
					'text' => wfMessage('openidconnectlogin')->text(),
					'href' => $href
				);
			}
		}
		return true;
	}

	public static function modifyLoginSpecialPages(&$specialPagesList) {
		$specialpages = array(
			'Userlogin',
			'CreateAccount',
			'Userlogout'
		);
		foreach ($specialpages as $p) {
			if (array_key_exists($p, $specialPagesList)) {
				unset($specialPagesList[$p]);
			}
		}
		return true;
	}
}
