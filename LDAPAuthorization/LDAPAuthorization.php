<?php

$wgExtensionCredits['other'][] = array (
	'name' => 'LDAPAuthorization',
	'version' => '1.1',
	'author' => 'Cindy Cicalese',
	'descriptionmsg' => 'ldaploginfilter-desc',
	'url' => 'http://gestalt.mitre.org/wiki/Extension:LDAPAuthorization'
);

$wgHooks['AbortLogin'][] = 'wfExtensionLDAPAuthorization_AbortLogin';

$wgExtensionMessagesFiles['LDAPAuthorization'] =
	__DIR__ . '/LDAPAuthorization.i18n.php';

function wfExtensionLDAPAuthorization_AbortLogin($username, $password, &$retval,
	&$retmsg) {
	$filter = new LDAPAuthorization;
	$retmsg = 'ldaploginfilter-notauth';
	return $filter->check($username);
}

class LDAPAuthorization {

	public static function check($username) {

		if (strlen($username) == 0) {
			return false;
		}

		$ldapconn = self::connect();

		global $LDAPAuthorization_SearchString;
		if (!isset($LDAPAuthorization_SearchString)) {
			$LDAPAuthorization_SearchString = "ou=People,o=mitre.org";
		}

		$searchstring = $LDAPAuthorization_SearchString;

		global $LDAPAuthorization_Filter;
		if (!isset($LDAPAuthorization_Filter)) {
			$LDAPAuthorization_Filter = "(uid=USERNAME)";
		}
		$filter = str_replace("USERNAME", $username, $LDAPAuthorization_Filter);

		$result = @ldap_search($ldapconn, $searchstring, $filter);

		if ($result == false) {
			ldap_unbind($ldapconn);
			return false;
		}

		$entries = ldap_get_entries($ldapconn, $result);
		ldap_unbind($ldapconn);

		if (count($entries) > 0) {
			foreach ($entries[0] as $key => $value) {
				global $LDAPAuthorization_Auth;
				if (!isset($LDAPAuthorization_Auth)) {
					$LDAPAuthorization_Auth =
						array("departmentnumber" => "J85D");
				}
				foreach ($LDAPAuthorization_Auth as $authkey => $authvalue) {
					if ($key == $authkey && $value[0] == $authvalue) {
						return true;
					}
				}
			}
		}
		return false;
	}

	private function connect() {
		global $LDAPAuthentication_ServerName;
		if (!isset($LDAPAuthentication_ServerName)) {
			$LDAPAuthentication_ServerName = "ldap-prod.mitre.org";
		}
	
		global $LDAPAuthentication_ServerPort;
		if (!isset($LDAPAuthentication_ServerPort)) {
			$LDAPAuthentication_ServerPort = 389;
		}
	
		global $LDAPAuthentication_UseTLS;
		if (!isset($LDAPAuthentication_UseTLS)) {
			$LDAPAuthentication_UseTLS = false;
		}
	
		$ldapconn = ldap_connect($LDAPAuthentication_ServerName,
			$LDAPAuthentication_ServerPort);
		if ($ldapconn == false) {
			return false;
		}
		
		ldap_set_option($ldapconn, LDAP_OPT_PROTOCOL_VERSION, 3);
		ldap_set_option($ldapconn, LDAP_OPT_REFERRALS, 0);
		
		global $LDAPAuthentication_UseTLS;
		if ($LDAPAuthentication_UseTLS) {
			ldap_start_tls($ldapconn);
		}
	
		return $ldapconn;
	}
}
