#!/usr/bin/php

<?php

fclose(STDOUT);
$STDOUT = fopen('/tmp/verifyXML_application.log', 'wb');

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
$globalLimitCount = 100;

$urlBase = "http://mitrepedia.mitre.org/index.php/Special:Export?pages=";
//$namespaceIndex = 0;
//$namespaces = array( 0 );
$namespaces = array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 100, 101, 102, 104, 274);

$missingPages = array();
$userAndIds = array();
$userAndOrigIds = array();
$userNeedles = array();
$userReplaceText = array();

//Adding MITREPEDIABOT
//$user = User::newFromName( "MITREPEDIABOT" );
//if( is_object( $user)) {
//    if(!$user->isLoggedIn()) {
//         $user->addToDatabase();
//    }
//}

foreach($namespaces as $namespaceIndex) {
  $globalStartIndex = 0;
  $size = 0;
  $startPage = "!";
  $urlPagesBase = "http://mitrepedia.mitre.org/api.php?action=query&format=xml&apnamespace=" . $namespaceIndex . "&list=allpages&aplimit=" . $globalLimitCount . "&apfrom=";

echo ("Starting namespace: " . $namespaceIndex . "\n");

while($globalStartIndex < 1000000) {

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
	$wgTitle = Title::newFromText( urldecode($title), $namespaceIndex);
	if( is_object( $wgTitle)) {
		if($wgTitle->isKnown()) {
			//echo("Page found: " . $title . "\n");
			continue;
		}
	}
	echo("***** PAGE NOT FOUND: " . $title . "\n");
        array_push($missingPages, $title); 

}

$globalStartIndex += $size;

if( $size < $globalLimitCount) {
	break;
}

}

echo ("Migration Complete. Processed " . $globalStartIndex . " pages."); 
echo (date('l jS \of F Y h:i:s A'). "\n");

}

foreach($missingPages as $missingPage) {
    echo ("Missing: " . $missingPage . "\n");
}
echo ("Count:" . count($missingPages) . "\n");
