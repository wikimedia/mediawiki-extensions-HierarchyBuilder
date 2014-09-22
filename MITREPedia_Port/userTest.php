#!/usr/bin/php

<?php

fclose(STDOUT);
$STDOUT = fopen('/tmp/userTest_application.log', 'wb');

echo ("Start of importXML log..." . "\n");
//Set path to your MediaWiki installation
$install_path = '/GESTALT/MEDIAWIKI/mediawiki-1.23';
chdir( $install_path );

//Load Mediawiki Stuff
# Define us as being in MediaWiki
$_SERVER['WIKI_NAME']="mitrepedia";

require_once( 'maintenance/commandLine.inc');
require_once( 'maintenance/importImages.inc' );

echo ("Beginning import...\n");
echo (date('l jS \of F Y h:i:s A'). "\n");
$globalStartIndex = 0;
$globalLimitCount = 10;

$urlBase = "http://mitrepedia.mitre.org/index.php/Special:Export?pages=";
$namespaceIndex = 1;
$namespaces = array(0);

$userAndIds = array();
$userAndOrigIds = array();
$userNeedles = array();
$userReplaceText = array();

foreach($namespaces as $namespaceIndex) {
  $globalStartIndex = 0;
  $size = 0;
  $startPage = "!";
  $urlPagesBase = "http://mitrepedia.mitre.org/api.php?action=query&format=xml&apnamespace=" . $namespaceIndex . "&list=allpages&aplimit=" . $globalLimitCount . "&apfrom=";

echo ("Starting namespace: " . $namespaceIndex . "\n");

while($globalStartIndex < 10) {

echo ("Migrating pages: " . $globalStartIndex . " to " . ($globalStartIndex + $globalLimitCount) . "\n");


$urlPages = $urlPagesBase . $startPage;

$xmlPages = file_get_contents($urlPages);

$pagesP = xml_parser_create();
xml_parse_into_struct($pagesP, $xmlPages, $pagesValues, $pagesTags);
xml_parser_free($pagesP);

//echo "Index array\n";
//print_r($pagesTags);
//echo "\nVals array\n";
//print_r($pagesValues);

$size = sizeof($pagesTags['P']);
for($index=0; $index < $size; $index++) {
   	$title = urlencode($pagesValues[$pagesTags['P'][$index]]['attributes']['TITLE']);
   	//echo ("Page title:" . $title .  "\n");

	$startPage = $title;
   	$url = $urlBase . $title . "&history";
   	$xml = file_get_contents($url);
   	//echo ("Page text:" . $xml .  "\n");

	//$myfile = fopen("/tmp/wikifile.txt", "w");
	//fwrite($myfile, $xml);
	//fclose($myfile);

	//exec( "php /GESTALT/MEDIAWIKI/mediawiki-1.23/maintenance/importDump.php /tmp/wikifile.txt");


	if(strpos($xml, "IPB")) {

		$xmlP = xml_parser_create();
		xml_parse_into_struct($xmlP, $xml, $pagesValues2, $pagesTags2);
		xml_parser_free($xmlP);

		$pageUsers = array();
		$pageNeedles = array();
		$pageReplaceText = array();
		echo "Index array\n";
		print_r($pagesTags2['USERNAME']);
		foreach($pagesTags2['USERNAME'] as $userIndex) {
			$wikiuser = $pagesValues2[$userIndex]['value'];
			$wikiuserOrigId = $pagesValues2[$userIndex+2]['value'];
			$user = User::newFromName( $wikiuser );
			if( is_object( $user)) {
				if(!$user->isLoggedIn()) {
					echo "Adding new user: " . $wikiuser . "\n";
					$user->addToDatabase();
				}
				$userId = $user->getId();

				if(!array_key_exists($wikiuser, $userAndIds)) {
					$userAndIds[$wikiuser] = $userId;
					$userAndOrigIds[$wikiuser] = $wikiuserOrigId;
					$userNeedles[$wikiuser] = "<username>".$wikiuser."</username>\n        <id>".$wikiuserOrigId;
					$userReplaceText[$wikiuser] = "<username>".$wikiuser."</username>\n        <id>".$userId;
				
				}

				if(!array_key_exists($wikiuser, $pageUsers)) {
					array_push($pageUsers, $wikiuser);
					array_push($pageNeedles, $userNeedles[$wikiuser]);
					array_push($pageReplaceText, $userReplaceText[$wikiuser]);
				}

				print_r($wikiuser . " " . $wikiuserOrigId . " " . $userId . "\n");
				

			}
		}

		$xml = str_replace($pageNeedles, $pageReplaceText, $xml);
		$myfile = fopen("/tmp/wikifile.txt", "w");
		fwrite($myfile, $xml);
		fclose($myfile);


	exec( "php /GESTALT/MEDIAWIKI/mediawiki-1.23/maintenance/importDump.php /tmp/wikifile.txt");

		//echo "\nVals array\n";
		//print_r($pagesValues2);

		break;
	} else {
	    //unlink("/tmp/wikifile.txt");
	}
}

$globalStartIndex += $size;

if( $size < $globalLimitCount) {
	break;
}
}

echo ("Migration Complete. Processed " . $globalStartIndex . " pages."); 
echo (date('l jS \of F Y h:i:s A'). "\n");

}


$filename = "/tmp/mitrepedia_user_table.txt";
foreach ($userAndIds as $userKey => $userValue) {
	$string = $userKey . "," . $userAndOrigIds[$userKey] . "," . $userValue . "\n";
	file_put_contents($filename, $string, FILE_APPEND);
}


