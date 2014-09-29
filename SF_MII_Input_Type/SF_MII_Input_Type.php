<?php

if (!defined('MEDIAWIKI')) {
	die('<b>Error:</b> This file is part of a MediaWiki extension and cannot be run standalone.');
}

if (version_compare($wgVersion, '1.17', 'lt')) {
	die('<b>Error:</b> This version of SFF_MII_Input_Type is only compatible with MediaWiki 1.17 or above.');
}

if (!defined('SF_VERSION')) {
	die('<b>Error:</b> SFF_MII_Input_Type is a Semantic Forms extension so must be included after Semantic Forms.');
}

if (version_compare(SF_VERSION, '2.4.2', 'lt')) {
	die('<b>Error:</b> This version of SFF_MII_Input_Type is only compatible with Semantic Forms 2.4.1 or above.');
}

# credits
$wgExtensionCredits['semantic'][] = array (
	'name' => 'SF_MII_Input_Type',
	'version' => '1.4',
	'author' => "Cindy Cicalese",
	'description' => "Enter an MII SUI with LDAP help"
);

$wgHooks['ParserFirstCallInit'][] = 'efSF_MII_Input_TypeSetup';

$wgResourceModules['ext.SF_MII_Input_Type'] = array(
	'localBasePath' => dirname(__FILE__),
	'remoteExtPath' => 'SF_MII_Input_Type',
	'scripts' => 'sf_mii_input_type.js',
	'dependencies' => array(
		'ext.semanticforms.main'
	)
);

function efSF_MII_Input_TypeSetup (& $parser) {
	global $sfgFormPrinter;
	$sfgFormPrinter->registerInputType('SF_MII_Input_Type');
	return true;
}

$wgAPIModules['miisui'] = 'ApiMIISUI';

class ApiMIISUI extends ApiBase{

	public function __construct($main, $action) {
		parent::__construct($main, $action);
	}

	public function execute() {
		$params = $this->extractRequestParams();
		$value = $params['substr'];
		$limit = $params['limit'];
		$result = self::getMatchingMIISUIs($value, $limit);
		$this->getResult()->addValue(null, 'miisui', $result);
	}

	public function getAllowedParams() {
		return array(
			'substr' => null,
			'limit' => 20
		);
	}

	public function getParamDescription() {
		return array(
			'substr' => "the beginning of a surname or SUI",
			'limit' => "the maximum number of matches returned"
		);
	}

	public function getDescription() {
		return "get matching MII SUIs for provided parameter";
	}

	private function getMatchingMIISUIs($value, $limit) {
		$miisuis = array();
		if ($value == null || strlen($value) < 1) {
			return $miisuis;
		}

		$ldapconn = self::connect();
		if (!$ldapconn) {
			return $miisuis;
		}

		$value = escapeshellcmd($value);

		$searchstring = "ou=People,o=mitre.org";
		$searchfilter=
			"(|(sn=$value*)(mitrepreferredname=$value*)(givenname=$value*)(uid=$value*))";
		$returnfields =
			array("sn", "mitrepreferredname", "givenname", "uid");

		$ldap_result = @ldap_search($ldapconn, $searchstring, $searchfilter,
			$returnfields, 0, $limit);


		if (!$ldap_result) {
			ldap_unbind($ldapconn);
			return $miisuis;
		}

		$entries = ldap_get_entries($ldapconn, $ldap_result);
		if ($entries["count"] < $limit) {
			$limit = $entries["count"];
		}

		ldap_unbind($ldapconn);

		$choices = array();
		for ($i = 0; $i < $limit; $i++) {
			$sn = $entries[$i]['sn'][0];
			if (isset($entries[$i]['mitrepreferredname'])) {
				$fn = $entries[$i]['mitrepreferredname'][0];
				if ($fn == null || strlen($fn) < 1) {
					$fn = $entries[$i]['givenname'][0];
				}
			} else {
				$fn = $entries[$i]['givenname'][0];
			}
			$uid = $entries[$i]['uid'][0];
			$choices[$fn . " " . $sn . " (" . $uid . ")"] = $uid;
		}
		ksort($choices);
		foreach ($choices as $label => $value) {
			$miisuis[] = array(
				"label" => $label,
				"value" => $value
			);
		}

		return $miisuis;
	}

	private function connect() {
		global $SF_MII_Input_Type_ServerName;
		if (!isset($SF_MII_Input_Type_ServerName)) {
			$SF_MII_Input_Type_ServerName = "ldap-prod.mitre.org";
		}
	
		global $SF_MII_Input_Type_ServerPort;
		if (!isset($SF_MII_Input_Type_ServerPort)) {
			$SF_MII_Input_Type_ServerPort = 389;
		}
	
		global $SF_MII_Input_Type_UseTLS;
		if (!isset($SF_MII_Input_Type_UseTLS)) {
			$SF_MII_Input_Type_UseTLS = false;
		}
	
		$ldapconn = ldap_connect($SF_MII_Input_Type_ServerName,
			$SF_MII_Input_Type_ServerPort);
		if ($ldapconn == false) {
			return false;
		}
		
		ldap_set_option($ldapconn, LDAP_OPT_PROTOCOL_VERSION, 3);
		ldap_set_option($ldapconn, LDAP_OPT_REFERRALS, 0);
		
		global $SF_MII_Input_Type_UseTLS;
		if ($SF_MII_Input_Type_UseTLS) {
			ldap_start_tls($ldapconn);
		}
	
		return $ldapconn;
	}
}

class SF_MII_Input_Type extends SFFormInput {

	public static function getName() {
		return 'miisui';
	}

	public static function getDefaultPropTypes() {
		return array(
			'_wpg' => array()
		);
	}

	public static function getOtherPropTypesHandled() {
		return array('_str');
	}

	public static function getDefaultPropTypeLists() {
		return array(
			'_wpg' => array('is_list' => true, 'size' => 100)
		);
	}

	public static function getOtherPropTypeListsHandled() {
		return array('_str');
	}

	public static function getParameters() {
		$params = parent::getParameters();
		$params['list'] = array(
			'name' => 'list',
			'type' => 'boolean',
			'description' => wfMessage('sf_forminputs_list')->text()
		);
		$params['size'] = array(
			'name' => 'size',
			'type' => 'int',
			'description' => wfMessage('sf_forminputs_size')->text()
		);
		return $params;
	}

	public static function getHTML($cur_value, $input_name, $is_mandatory,
		$is_disabled, $other_args) {

		global $wgOut;
		$wgOut->addModules('ext.SF_MII_Input_Type');

		global $sfgFieldNum;
		$input_id = 'input_' . $sfgFieldNum;

		$is_list = (array_key_exists('is_list', $other_args)
			&& $other_args['is_list'] == true);

		if (array_key_exists('size', $other_args)) {
			$size = $other_args['size'];
		} elseif ($is_list) {
			$size = '100';
		} else {
			$size = '35';
		}

		$className = ($is_mandatory) ? 'miisui mandatoryField' :
			'miisui createboxInput';
		if (array_key_exists('class', $other_args)) {
			$className .= ' ' . $other_args['class'];
		}

		global $wgServer, $wgScriptPath;
		$apiurl = $wgServer . $wgScriptPath . "/api.php";

		global $sfgTabIndex;
		$inputAttrs = array(
			'id' => $input_id,
			'tabindex' => $sfgTabIndex,
			'class' => $className,
			'size' => $size,
			'apiurl' => $apiurl
		);
		if ($is_list) {
			$inputAttrs['list'] = true;
		}
		if ($is_disabled) {
			$inputAttrs['disabled'] = true;
		}
		$text = "\n\t" .
			Html::input($input_name, $cur_value, 'text', $inputAttrs) . "\n";

		$spanClass = 'inputSpan';
		if ($is_mandatory) {
			$spanClass .= ' mandatoryFieldSpan';
		}
		$text = "\n" .
			Html::rawElement('span', array('class' => $spanClass), $text);

		return $text;
	}
}
