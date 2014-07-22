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

	public static function userLoadFromSession($user, &$result) {

		// http://stackoverflow.com/questions/520237/how-do-i-expire-a-php-session-after-30-minutes

		if (!isset($GLOBALS['OpenIDConnect_Timetout'])) {
			$GLOBALS['OpenIDConnect_Timetout'] = 1800;
		}

		if ($GLOBALS['OpenIDConnect_Timetout'] > 0) {

			if (session_id() == '') {
				wfSetupSession();
			}

			$time = time();

			if (isset($_SESSION['LAST_ACTIVITY']) &&
				($time - $_SESSION['LAST_ACTIVITY'] >
					$GLOBALS['OpenIDConnect_Timetout'])) {
				session_unset();
				session_destroy();
			}
			$_SESSION['LAST_ACTIVITY'] = $time;

			if (!isset($_SESSION['CREATED'])) {
				$_SESSION['CREATED'] = $time;
			} else if ($time - $_SESSION['CREATED'] >
					$GLOBALS['OpenIDConnect_Timetout']) {
				session_regenerate_id(true);
				$_SESSION['CREATED'] = $time;
			}

		}

		$result = self::loadUser($user);
		if (isset($GLOBALS['OpenIDConnect_AutoLogin']) &&
			$GLOBALS['OpenIDConnect_AutoLogin']) {
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
				$result = self::login($user, false);
			}
		}
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

	public static function login($user, $forceLogin) {

		if (!array_key_exists('SERVER_PORT', $_SERVER)) {
			return false;
		}

		try {

			if (session_id() == '') {
				wfSetupSession();
			}

			if (isset($_SESSION['iss'])) {
				$iss = $_SESSION['iss'];

				if (isset($_REQUEST['code']) && isset($_REQUEST['status'])) {
					unset($_SESSION['iss']);
				}
	
				if (isset($GLOBALS['OpenIDConnect_Config'][$iss])) {

					$values = $GLOBALS['OpenIDConnect_Config'][$iss];

					if (!isset($values['clientID']) ||
						!isset($values['clientsecret'])) {
						$params = array(
							"uri" => urlencode($_SERVER['REQUEST_URI']),
							"query" => urlencode($_SERVER['QUERY_STRING'])
						);
						self::redirect("Special:SelectOpenIDConnectIssuer",
							$params);
					}

					$clientID = $values['clientID'];
					$clientsecret = $values['clientsecret'];

				}

	
			} else {

				if (!isset($GLOBALS['OpenIDConnect_Config'])) {
					return false;
				}
	
				$iss_count = count($GLOBALS['OpenIDConnect_Config']);
	
				if ($iss_count < 1) {
					return false;
				}
	
				if ($iss_count == 1) {
	
					$iss = array_keys($GLOBALS['OpenIDConnect_Config']);
					$iss = $iss[0];
	
					$values = array_values($GLOBALS['OpenIDConnect_Config']);
					$values = $values[0];
	
					if (!isset($values['clientID']) ||
						!isset($values['clientsecret'])) {
						return false;
					}
					$clientID = $values['clientID'];
					$clientsecret = $values['clientsecret'];
	
				} else {
	
					$params = array(
						"uri" => urlencode($_SERVER['REQUEST_URI']),
						"query" => urlencode($_SERVER['QUERY_STRING'])
					);
					self::redirect("Special:SelectOpenIDConnectIssuer",
						$params);
	
				}
			}

			$oidc = new OpenIDConnectClient($iss, $clientID, $clientsecret);
			if ($oidc->authenticate($forceLogin)) {
				$subject = $oidc->requestUserInfo('sub');
				$issuer = $oidc->requestUserInfo('iss');
				$realname = $oidc->requestUserInfo("name");
				$email = $oidc->requestUserInfo("email");
				$user->mId = self::getId($subject, $issuer);
				if (is_null($user->mId)) {
					$username = $oidc->requestUserInfo("preferred_username");
					$id = User::idFromName($username);
					if ($id && isset($GLOBALS['OpenIDConnect_MigrateUsers']) &&
						$GLOBALS['OpenIDConnect_MigrateUsers']) {
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
					self::setExtraProperties($user->mId, $subject, $issuer);
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
			wfRunHooks( 'UserLoginComplete', array( &$user, &$injected_html ) );
		} else {
			$returnto = 'Special:OpenIDConnectNotAuthorized';
			$params = array('name' => $user->mName);
		}
		session_regenerate_id(true); 
		self::redirect($returnto, $params);
		return $authorized;
	}

	public static function logout(&$user) {
		session_regenerate_id(true); 
		session_destroy();
		unset($_SESSION);
		if (isset($GLOBALS['OpenIDConnect_ForceLogout']) &&
			$GLOBALS['OpenIDConnect_ForceLogout']) {
			$returnto = 'Special:UserLogin';
			$params = array('forcelogin' => 'true');
			self::redirect($returnto, $params);
		}
		return true;
	}

	public static function redirect($page, $params = null) {
		$title = Title::newFromText($page);
		if (is_null($title)) {
			$title = Title::newMainPage();
		}
		$url = $title->getFullURL();
		if (is_array($params) && count($params) > 0) {
			$first = true;
			foreach ($params as $key => $value) {
				if ($first) {
					$first = false;
					$url .= '?';
				} else {
					$url .= '&';
				}
				$url .= $key . '=' . $value;
			}
		}
		$GLOBALS['wgOut']->redirect($url);
	}	

	private static function getId($subject, $issuer) {
		$dbr = wfGetDB(DB_SLAVE);
		$row = $dbr->selectRow('user',
			array('user_id'),
			array(
				'subject' => $subject,
				'issuer' => $issuer
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

	private static function setExtraProperties($id, $subject, $issuer) {
		$dbw = wfGetDB(DB_MASTER);
		$dbw->update('user',
			array( // SET
				'subject' => $subject,
				'issuer' => $issuer
			), array( // WHERE
				'user_id' => $id
			), __METHOD__
		);
	}

	public static function loadExtensionSchemaUpdates($updater) {
		$updater->addExtensionField('user', 'subject',
			__DIR__ . '/AddSubject.sql');
		$updater->addExtensionField('user', 'issuer',
			__DIR__ . '/AddIssuer.sql');
		return true;
	}

	public static function modifyLoginURLs(&$personal_urls, $title, $skin) {
		$urls = array(
			'createaccount',
			'anonlogin'
		);
		foreach ($urls as $u) {
			if (array_key_exists($u, $personal_urls)) {
				unset($personal_urls[$u]);
			}
		}
		if (isset($GLOBALS['OpenIDConnect_AutoLogin']) &&
			$GLOBALS['OpenIDConnect_AutoLogin']) {
			unset($personal_urls['login']);
			unset($personal_urls['logout']);
		}
		return true;
	}

	public static function modifyLoginSpecialPages(&$specialPagesList) {
		$specialpages = array(
			'CreateAccount'
		);
		foreach ($specialpages as $p) {
			if (array_key_exists($p, $specialPagesList)) {
				unset($specialPagesList[$p]);
			}
		}
		if (isset($GLOBALS['OpenIDConnect_AutoLogin']) &&
			$GLOBALS['OpenIDConnect_AutoLogin']) {
			unset($specialPagesList['Userlogin']);
			unset($specialPagesList['Userlogout']);
		}
		return true;
	}
}
