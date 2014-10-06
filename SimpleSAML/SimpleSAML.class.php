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


class SimpleSAML extends PluggableAuth {

	public function authenticate(&$id, &$username, &$realname, &$email) {

		$saml = $this->getSAMLClient();
		$saml->requireAuth();
		$attr = $saml->getAttributes();

		global $wgSamlRealnameAttr;
		if (isset($wgSamlRealnameAttr) &&
			array_key_exists($wgSamlRealnameAttr, $attr)) {
			$realname = $attr[$wgSamlRealnameAttr][0];
		} else {
			return false;
		}

		global $wgSamlMailAttr;
		if (isset($wgSamlMailAttr) &&
			array_key_exists($wgSamlMailAttr, $attr)) {
			$email = $attr[$wgSamlMailAttr][0];
		} else {
			return false;
		}

		global $wgSamlUsernameAttr;
		if (isset($wgSamlUsernameAttr) &&
			array_key_exists($wgSamlUsernameAttr, $attr)) {
			$username = strtolower($attr[$wgSamlUsernameAttr][0]);
			$nt = Title::makeTitleSafe(NS_USER, $username);
			if (is_null($nt)) {
				wfDebug("bad username" . PHP_EOL);
				return false;
			}
			$username = $nt->getText();
			$id = User::idFromName($username);
			return true;
		}

		return false;
	}

	public function deauthenticate(&$user) {
		$saml = $this->getSAMLClient();
		$saml->logout();
		return true;
	}

	public function saveExtraAttributes($id) {
		// intentionally left blank
	}

	private function getSAMLClient() {
		global $wgSamlSspRoot, $wgSamlAuthSource;
		require_once rtrim( $wgSamlSspRoot, DIRECTORY_SEPARATOR ) .
			DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . '_autoload.php';
		return new SimpleSAML_Auth_Simple( $wgSamlAuthSource );
	}
}
