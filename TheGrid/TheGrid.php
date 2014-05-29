<?php
/**
 * This is an example extension. It doesn't actually do anything useful, but
 * can be copied to provide the basis for your own extension.
 */

/** 
 * Prevent a user from accessing this file directly and provide a helpful 
 * message explaining how to install this extension.
 */
if ( !defined( 'MEDIAWIKI' ) ) { 
	if ( !defined( 'MEDIAWIKI' ) ) {
    	exit( 1 );
	}
}

// Extension credits that will show up on Special:Version
$wgExtensionCredits[ 'other' ][] = array(
        'path' => __FILE__,
	'name' => 'The Grid',
	'author' =>'Kevin Forbes', 
	'url' => 'https://www.mediawiki.org/wiki/Extension:TheGrid', 
	'description' => 'This extension is an example extension',
	'version'  => 1.0,
);

// Find the full directory path of this extension
$current_dir = dirname( __FILE__ ) . '/';

$wgExtensionFunctions[] = "TheGrid::theGridSetHook";

class TheGrid {
        public static function theGridSetHook() {
                global $wgParser;
                $wgParser->setHook( "theGrid",
                        "TheGrid::renderTheGrid" );
        }


        public static function getNumberOfSubpages( $category ) {
          $query = 'SELECT count(*) FROM categorylinks WHERE cl_to = "' . $category . '"';
          $result = mysql_query($query) or die('Query failed: ' . mysql_error()  . "\n");
          while ($row = mysql_fetch_array($result))
            $res[] = $row[0];
          return $res[0];
        }

        public static function hasProperties($title, $properties) {
	    $store = smwfGetStore();
            $subject = SMWDIWikiPage::newFromTitle($title);
            $data = $store->getSemanticData($subject);
            $array = array();
           
            foreach ($properties as $p) {            
                $property = SMWDIProperty::newFRomUserLabel($p);
                $values = $data->getPropertyValues($property);
                $array[] = count($values);
            }
         
            return $array;
        }

        public static function renderTheGrid( $input, $params, $parser ) {
            if ( !isset( $params['cat'] ) ) { // No category selected
                return '';
            }
            $cat = $params['cat'];
            $cat = str_replace ( ' ', '_', ucfirst( $params['cat'] ) );
            $category = Category::newFromName( $cat);
            $pages = $category->getMembers();

            $propertiesArray = explode(',', $params['properties']);

            $text = "";
            $text = $text . "\n<table border=\"1\">\n";
           
            $text = $text . "<col width=\"100\">\n";
            foreach ($propertiesArray as $propertyName) {
                $text = $text . "<col width=\"20\">\n";
            }          

            $text = $text . "<tr>\n<th>\n" . 'Number of Pages: ' . TheGrid::getNumberOfSubpages( $cat ) . "</th>\n";

            foreach ($propertiesArray as $propertyName) {
                $text = $text . "<th>$propertyName</th>\n";
            }
            $text = $text . "</tr>\n";
            
            foreach ($pages as $page) {
   
                $text = $text . "<tr><td nowrap>" . $page->getBaseText() . "</td>\n";
                
                $title = $page;
                $array = TheGrid::hasProperties( $title, $propertiesArray);

                foreach($array as $present) {
                   if($present == 0) {
                       $text = $text . "<td bgcolor=\"#CDCDCD\">&nbsp;</td>\n";
                   } else {
                       $text = $text . "<td bgcolor=\"#00FF00\">&nbsp;</td>\n";
                   }
                }
                $text = $text . "</tr>\n";
            }
            $text = $text . "</table>";
            $output = $text;
            return $output;

        }        


}
