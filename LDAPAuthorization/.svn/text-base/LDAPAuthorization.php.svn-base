<?php

$wgExtensionCredits['other'][] = array (
	'name' => 'LDAPAuthorization',
	'version' => '1.0',
	'author' => 'Cindy Cicalese',
	'descriptionmsg' => 'ldaploginfilter-desc',
	'url' => 'http://gestalt.mitre.org/wiki/Extension:LDAPAuthorization'
);

$wgHooks['AbortLogin'][] = 'wfExtensionLDAPAuthorization_AbortLogin';

$wgExtensionMessagesFiles['LDAPAuthorization'] =
	__DIR__ . '/LDAPAuthorization.i18n.php';

$LDAPAuthorization_SearchString = "ou=People,o=mitre.org";
$LDAPAuthorization_Filter = "(uid=USERNAME)";
$LDAPAuthorization_ServerNames = "ldap://ldap-int1.mitre.org:3890";
$LDAPAuthorization_UseTLS = false;
$LDAPAuthorization_Auth = array("departmentnumber" => "J85D");

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

		global $LDAPAuthorization_ServerNames;
		$ldapconn = @ldap_connect($LDAPAuthorization_ServerNames);
		if ($ldapconn == false) {
			return false;
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
		$filter = str_replace("USERNAME", $username, $LDAPAuthorization_Filter);

		$result = @ldap_search($ldapconn, $searchstring, $filter);

		if ($result == false) {
			@ldap_unbind($ldapconn);
			return false;
		}

		$entries = @ldap_get_entries($ldapconn, $result);
		@ldap_unbind($ldapconn);

		if (count($entries) > 0) {
			foreach ($entries[0] as $key => $value) {
				global $LDAPAuthorization_Auth;
				foreach ($LDAPAuthorization_Auth as $authkey => $authvalue) {
					if ($key == $authkey && $value[0] == $authvalue) {
						return true;
					}
				}
			}
		}
		return false;
	}
}
