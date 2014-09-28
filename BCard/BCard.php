<?php

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'BCard',
	'version' => '1.8',
	'author' => 'Cindy Cicalese',
	'descriptionmsg' => 'bcard-desc',
	'url' => 'http://gestalt.mitre.org/gestaltd/index.php/BCard'
);

$wgHooks['ParserFirstCallInit'][] = 'wfExtensionBCard_Setup';
$wgHooks['LanguageGetMagic'][] = 'wfExtensionBCard_Magic';

$wgExtensionMessagesFiles['BCard'] = __DIR__ . '/BCard.i18n.php';

function wfExtensionBCard_Setup(& $parser) {
	$parser->setFunctionHook('bcardfieldlist', 'bcardfieldlist');
	$parser->setFunctionHook('bcard', 'bcard');

	global $BCard_ServerName;
	if (!isset($BCard_ServerName)) {
		$BCard_ServerName = "ldapprod.mitre.org";
	}

	global $BCard_ServerPort;
	if (!isset($BCard_ServerPort)) {
		$BCard_ServerPort = 389;
	}

	global $BCard_UseTLS;
	if (!isset($BCard_UseTLS)) {
		$BCard_UseTLS = false;
	}

	global $BCard_SearchString;
	if (!isset($BCard_SearchString)) {
		$BCard_SearchString = "ou=People,o=mitre.org";
	}

	global $BCard_Filter;
	if (!isset($BCard_Filter)) {
		$BCard_Filter = "(|(uid=PERSON)(employeenumber=PERSON))";
	}

	return true;
}

function wfExtensionBCard_Magic(& $magicWords, $langCode) {
	$magicWords['bcardfieldlist'] = array (0, 'bcardfieldlist');
	$magicWords['bcard'] = array (0, 'bcard');
	return true;
}

function bcardfieldlist(&$parser) {
	$params = func_get_args();
	array_shift($params); // first is $parser; strip it
	$bcardfieldlist = BCard::getBCardFieldList($params);
	$parser->disableCache();
	return array($parser->insertStripItem($bcardfieldlist,
		$parser->mStripState), 'noparse' => false, 'isHTML' => true);
}

function bcard(&$parser) {
	$params = func_get_args();
	array_shift($params); // first is $parser; strip it
	$bcard = BCard::getBCard($params);
	$result = $parser->recursiveTagParse($bcard);
	$parser->disableCache();
	return array($parser->insertStripItem($result, $parser->mStripState),
		'noparse' => false, 'isHTML' => true);
}

class BCard {

	static function getBCardFieldList($params) {

		$paramArray = self::parseParameters($params);

		if (!array_key_exists("name", $paramArray)) {
			return "missing parameters";
		}

		$entries = self::setup(escapeshellcmd(trim($paramArray["name"])));

		if ($entries == false) {
			return "";
		}

		$fields = "";
		foreach ($entries as $key) {
			if (is_string($key)) {
				$fields .= $key . " ";
			}
		}
		return $fields;
	}

	static function getBCard($params) {

		$paramArray = self::parseParameters($params);

		if (!array_key_exists("name", $paramArray) ||
			!array_key_exists("fields", $paramArray)) {
			return "missing parameters";
		}

		$entries = self::setup(escapeshellcmd(trim($paramArray["name"])));

		if ($entries == false) {
			if (array_key_exists("default", $paramArray)) {
				return trim($paramArray["default"]);
			} else {
				return "";
			}
		}

		$fields = trim($paramArray["fields"]);

		if (array_key_exists("template", $paramArray)) {
			$field_array = array_map('trim', explode(',', $fields));
			$result = "{{" . trim($paramArray["template"]);
			foreach ($entries as $key => $value) {
				if (is_string($key) && in_array($key, $field_array)) {
					$result .= "|" . $key . '=' . $value[0];
				}
			}
			$result .= "}}";
		} else {
			$result = $fields;
			foreach ($entries as $key => $value) {
				$result =
					preg_replace("/\(\(\($key\)\)\)/", $value[0], $result);
			}
		}

		return $result;
	}

	private static function setup($person) {

		if (strlen($person) == 0) {
			return false;
		}

		global $BCard_ServerName, $BCard_ServerPort;
		$ldapconn = ldap_connect($BCard_ServerName, $BCard_ServerPort);
		if ($ldapconn == false) {
			return false;
		}

		ldap_set_option($ldapconn, LDAP_OPT_PROTOCOL_VERSION, 3);
		ldap_set_option($ldapconn, LDAP_OPT_REFERRALS, 0);

		global $BCard_UseTLS;
		if ($BCard_UseTLS) {
			ldap_start_tls($ldapconn);
		}

		global $BCard_SearchString;
		$searchstring = $BCard_SearchString;

		global $BCard_Filter;
		$filter = str_replace("PERSON", $person, $BCard_Filter);

		$result = ldap_search($ldapconn, $searchstring, $filter);

		if ($result == false) {
			ldap_unbind($ldapconn);
			return false;
		}

		$entries = ldap_get_entries($ldapconn, $result);
		ldap_unbind($ldapconn);

		if (count($entries) > 1) {
			return $entries[0];
		}

		return false;
	}

	static function parseParameters($params) {
		$paramArray = array();
		foreach ($params as $param) {
			$ret = preg_split('/=/', $param, 2);
			if (count($ret) > 1) {
				$paramArray[$ret[0]] = $ret[1];
			}
		}
		return $paramArray;
	}
}
