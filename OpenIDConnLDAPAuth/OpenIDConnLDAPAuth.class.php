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

class OpenIDConnLDAPAuth {

	public static function defaultLDAPSetup() {
	
		global $LDAPAuthorization_SearchString;
		if (!isset($LDAPAuthorization_SearchString)){
			$LDAPAuthorization_SearchString = "ou=People,o=mitre.org";
		}

		global $LDAPAuthorization_Filter;
		if (!isset($LDAPAuthorization_Filter)){
			$LDAPAuthorization_Filter = "(uid=USERNAME)";
		}

		global $LDAPAuthorization_ServerNames;
		if (!isset($LDAPAuthorization_ServerNames)){
			$LDAPAuthorization_ServerNames = "ldap://ldap-int1.mitre.org:3890";
		}

		global $LDAPAuthorization_UseTLS;
		if (!isset($LDAPAuthorization_UseTLS)){
			$LDAPAuthorization_UseTLS = false;
		}
		global $LDAPAuthorization_Auth;
		if (!isset($LDAPAuthorization_Auth)){
			$LDAPAuthorization_Auth = array("departmentnumber" => "J85D");
		}

	}

	public static function authorize($user, &$authorized) {

		OpenIDConnLDAPAuth::defaultLDAPSetup();

		if (strlen($user) == 0) {
			$authorized = false;
			return $authorized;
		}

		global $LDAPAuthorization_ServerNames;

		$ldapconn = @ldap_connect($LDAPAuthorization_ServerNames);
		if ($ldapconn == false) {
			$authorized = false;
			return $authorized;
		}

		@ldap_set_option($ldapconn, LDAP_OPT_PROTOCOL_VERSION, 3);
		@ldap_set_option($ldapconn, LDAP_OPT_REFERRALS, 0);

		global $LDAPAuthorization_UseTLS;
		if ($LDAPAuthorization_UseTLS) {
			@ldap_start_tls($ldapconn);
		}

		global $LDAPAuthorization_SearchString;
		$searchstring = $LDAPAuthorization_SearchString;

		global $LDAPAuthorization_Filter;
		$filter = str_replace("USERNAME", $user, $LDAPAuthorization_Filter);

		$result = @ldap_search($ldapconn, $searchstring, $filter);
		if ($result == false) {
			@ldap_unbind($ldapconn);
			$authorized = false;
			return $authorized;
		}

		$entries = @ldap_get_entries($ldapconn, $result);
		@ldap_unbind($ldapconn);

		if (count($entries) > 0) {
			$tmpArray = $entries[0];
			global $LDAPAuthorization_Auth;
			foreach ($LDAPAuthorization_Auth as $authkey => $authvalue) {
				if(array_key_exists($authkey, $tmpArray)){
					$tmpKey = $tmpArray[$authkey];
					if ($tmpKey[0] != $authvalue){
						$authorized = false;
						return $authorized;
					}
				} else {
					$authorized = false;
					return $authorized;
				}	
			}
		} else {
			$authorized = false;
			return $authorized;
		}
	

		return $authorized;

	}

}
