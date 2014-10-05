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

class OpenIDConnect extends PluggableAuth {

	var $realname;
	var $email;
	var $preferred_username;
	var $subject;
	var $issuer;

	public function authenticate(&$user) {

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
						return false;
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
					$this->redirect("Special:SelectOpenIDConnectIssuer",
						$params);
					return false;
	
				}
			}

			$oidc = new OpenIDConnectClient($iss, $clientID, $clientsecret);
			if (isset($_REQUEST['forcelogin'])) {
				$oidc->addAuthParam(array('prompt' => 'login'));
			}
			if ($oidc->authenticate()) {
				$this->realname = $oidc->requestUserInfo("name");
				$this->email = $oidc->requestUserInfo("email");
				$this->preferred_username =
					$oidc->requestUserInfo("preferred_username");
				$this->subject = $oidc->requestUserInfo('sub');
				$this->issuer = $oidc->getProviderURL();
				$user->mId = $this->getId($this->subject, $this->issuer);
				return true;
			} else {
				return false;
			}
		} catch (Exception $e) {
			return false;
		}
	}

	public function deauthenticate(&$user) {
		if (isset($GLOBALS['OpenIDConnect_ForceLogout']) &&
			$GLOBALS['OpenIDConnect_ForceLogout']) {
			$returnto = 'Special:UserLogin';
			$params = array('forcelogin' => 'true');
			self::redirect($returnto, $params);
		}
		return true;
	}

	public function getRealName() {
		return $this->realname;
	}

	public function getEmail() {
		return $this->email;
	}

	public function getPreferredUsername() {
		return $this->preferred_username;
	}

	public function setExtraProperties($user) {
		$dbw = wfGetDB(DB_MASTER);
		$dbw->update('user',
			array( // SET
				'subject' => $this->subject,
				'issuer' => $this->issuer
			), array( // WHERE
				'user_id' => $user->mId
			), __METHOD__
		);
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

	public static function loadExtensionSchemaUpdates($updater) {
		$updater->addExtensionField('user', 'subject',
			__DIR__ . '/AddSubject.sql');
		$updater->addExtensionField('user', 'issuer',
			__DIR__ . '/AddIssuer.sql');
		return true;
	}
}
