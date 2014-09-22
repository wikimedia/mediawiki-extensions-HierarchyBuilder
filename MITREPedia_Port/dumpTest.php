#!/usr/bin/php

<?php

fclose(STDOUT);
$STDOUT = fopen('/tmp/importXML_application.log', 'wb');

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
   	echo ("Page title:" . $title .  "\n");

	$startPage = $title;
   	$url = $urlBase . $title . "&history";
   	$xml = file_get_contents($url);
   	echo ("Page text:" . $xml .  "\n");

	$myfile = fopen("/tmp/wikifile.txt", "w");
	fwrite($myfile, $xml);
	fclose($myfile);

	exec( "php /GESTALT/MEDIAWIKI/mediawiki-1.23/maintenance/importDump.php /tmp/wikifile.txt");


	//if(strpos($xml, "IPB")) {
	//	break;
	//} else {
	    unlink("/tmp/wikifile.txt");
	//}
}

$globalStartIndex += $size;

if( $size < $globalLimitCount) {
	break;
}
}

echo ("Migration Complete. Processed " . $globalStartIndex . " pages."); 
echo (date('l jS \of F Y h:i:s A'). "\n");

}
