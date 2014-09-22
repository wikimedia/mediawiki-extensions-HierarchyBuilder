#!/usr/bin/php

<?php

fclose(STDOUT);
$STDOUT = fopen('/tmp/verifyImages_application.log', 'wb');

echo ("Start of importImages log..." . "\n");

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
$globalLimitCount = 500;
$missingFiles = array();

//$startPage = "%28U%29_Enterprise_Production_Management_BPM_%281-page%29.pdf";
//$startPage = "AISSWArchitecture.JPG";
$startPage = "!";
$urlPagesBase = "http://mitrepedia.mitre.org/api.php?action=query&format=xml&list=allimages&ailimit=" . $globalLimitCount . "&aifrom=";
$urlBase = "http://mitrepedia.mitre.org/index.php/Special:Export?pages=";


chdir( "/GESTALT/WES/mitrepediaport/imagesForMitrepedia" );
$saveDir = "./";


while($globalStartIndex < 1000000) {

echo ("Migrating pages: " . $globalStartIndex . " to " . ($globalStartIndex + $globalLimitCount) . "\n");


$urlPages = $urlPagesBase . $startPage;

$xmlPages = file_get_contents($urlPages);

$pagesP = xml_parser_create();
xml_parse_into_struct($pagesP, $xmlPages, $pagesValues, $pagesTags);
xml_parser_free($pagesP);

/*echo "Index array\n";
print_r($pagesTags);
echo "\nVals array\n";
print_r($pagesValues);
*/

$size = sizeof($pagesTags['IMG']);
for($index=0; $index < $size; $index++) {
   	$title = $pagesValues[$pagesTags['IMG'][$index]]['attributes']['URL'];
   	echo ("FileURL:" . $title .  "\n");
	$pos = strrpos($title, "/");


   	//$xml = file_get_contents($title);
	$name = substr($title, $pos+1);
	$startPage = $name;
	$filename = $saveDir . urldecode($name);
	//file_put_contents($filename, $xml);
	if(!file_exists($filename)) {
	   echo("***** FILE NOT FOUND: " . $filename. "\n");
	   array_push($missingFiles, $filename);
	}

}

$globalStartIndex += $size;

if( $size < $globalLimitCount) {
	break;
}

}

echo ("Migration Complete. Processed " . $globalStartIndex . " files."); 
echo (date('l jS \of F Y h:i:s A'). "\n");

foreach($missingFiles as $missingFile) {
   echo("Missing: " . $missingFile . "\n");
}
echo("Count:" . count($missingFiles) . "\n");
