<?php
 
// Take credit for your work, in the "api" category.
$wgExtensionCredits['api'][] = array(
 
   'path' => __FILE__,
 
   // The name of the extension, which will appear on Special:Version.
   'name' => 'Sample API Function',
 
   // A description of the extension, which will appear on Special:Version.
   'description' => 'A simple sample API extension',
 
   // Alternatively, you can specify a message key for the description.
   'descriptionmsg' => 'sampleapiextension-desc',
 
   // The version of the extension, which will appear on Special:Version.
   // This can be a number or a string.
   'version' => 1, 
 
   // Your name, which will appear on Special:Version.
   'author' => 'Me',
 
   // The URL to a wiki page/web page with information about the extension,
   // which will appear on Special:Version.
   'url' => 'https://www.mediawiki.org/wiki/API:Extensions',
 
);
 
// Map class name to filename for autoloading
$wgAutoloadClasses['ApiSample'] = __DIR__ . '/ApiWikiIWAPI.php';
 

// This must be where the 'action' is defined for the API
// Map module name to class name
$wgAPIModules['iwlinks'] = 'ApiSample';
 
// Load the internationalization file
$wgExtensionMessagesFiles['myextension'] = __DIR__ . '/ApiWikiIWAPI.i18n.php';
 
// Return true so that MediaWiki continues to load extensions.
return true;
