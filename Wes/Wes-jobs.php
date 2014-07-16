#!/usr/bin/php

<?php

fclose(STDOUT);
$STDOUT = fopen('/tmp/wes_jobs_application.log', 'wb');

echo ("Start of Wes log..." . "\n");

//Set path to your MediaWiki installation
$install_path = '/GESTALT/MEDIAWIKI/mediawiki-1.23';
chdir( $install_path );
require_once( '/GESTALT/WES/wes/MimeMailParser.class.php');
require_once( '/GESTALT/WES/wes/attachment.class.php');

//Grab the Email Content from STDIN
$parser = new MimeMailParser();
$parser->setStream(STDIN);
$to = $parser->getHeader('to');
$cc = $parser->getHeader('cc');
$from = $parser->getHeader('from');
$subject = $parser->getHeader('subject');
$text = $parser->getMessageBody('text');
$text = quoted_printable_decode($text);
$attachments = $parser->getAttachments();

//Parse Important Pieces from Email
$wikiuser = getWikiUser($from);
$originalSender = getOriginalSender($from);
$serverName = getServerName($to, $cc);

$wesEmail = getReturnEmail($to, $cc, $serverName);
$date = date("M j Y g:i:s A");
$isPost = isPostOrRequest($subject);
$overwrite = getOverwrite($subject);
$title = removeKeywords($subject);

echo ("ServerName: " . $serverName . "\n");
echo ("wesEmail: " . $wesEmail . "\n");

//Load Mediawiki Stuff
# Define us as being in MediaWiki
$_SERVER['WIKI_NAME']="$serverName";
//$wgServerName="$serverName";
echo ("Hi Kevin\n");

require_once( 'maintenance/commandLine.inc');
require_once( 'maintenance/importImages.inc' );

echo ("Hi Kevin2\n");

$user = User::newFromName( $wikiuser );
if( is_object( $user ) ) {
    $wgUser =& $user;
}


echo ("Hi Kevin3\n");
//Handle attachments
$save_dir = '/tmp/'; 
$attachmentResults = "\n===Attachments:===\n";
foreach($attachments as $attachment) { 
echo ("Processing Attachment...");
  // get the attachment name 
  $filename = $attachment->filename; 
  $filetitle = Title::makeTitleSafe( NS_FILE, $filename );
  echo ("filename: " . $filename);

  $content_type = $attachment->content_type;
  // write the file to the directory you want to save it in 
  if ($fp = fopen($save_dir.$filename, 'w')) { 
    while($bytes = $attachment->read()) { 
      fwrite($fp, $bytes); 
    } 
    fclose($fp); 
  }
  echo ("\nfile saved");

  if( !is_object( $filetitle ) ) {
    $attachmentResults .= "* Sorry there was an issue with attachment: $filename\n"; 
    exec( "rm " . $save_dir.$filename );
    continue;
  }
  echo ("\nfile is object");
 
  $image = wfLocalFile( $filetitle );
  if( $image->exists() ) {
    $attachmentResults .= "* Warning!  Attachment: [[$filetitle]] already exists. Your attachment was not posted. Link links to original file.\n"; 
    exec( "rm " . $save_dir.$filename );
    continue;
  }

  echo ("\nimage does not exist");

  $archive = $image->publish( $save_dir.$filename );
  echo ("\nimage post publish");

  if( !$archive->isGood() ) {
    $attachmentResults .= "* Archive: " . $archive->getWikiText();
    $attachmentResults .= "* Error posting: $filename. Archive not good. Attachment not posted.\n";
    exec( "rm " . $save_dir.$filename );
    continue;
  } 

  echo ("\nimage is good");

  if(! $image->recordUpload( $archive->value, "WES Uploaded File.", '') ) {
    $attachmentResults .= "* Error in recording upload: $filename. \n";
  }
  exec( "rm " . $save_dir.$filename );
  $attachmentResults .= "* [[$filetitle]]\n"; 
  echo ("\nimage upload complete\n");

}

if(count($attachments) > 0) {
  $text .= $attachmentResults;
}

echo("isPost: " . $isPost . "\n");

//Handle Posts and Requests
if($isPost) {

  //Handle Posts
  $foo = createTempFile($text, $wikiuser, $date);

  global $wgTitle;


  $wgTitle = Title::newFromText( $title, 0 );

  if( is_object( $wgTitle ) ) {
    $text = file_get_contents( $foo );
    $comment = 'Wiki post from MITRE Wiki Email Service (WES).';
    $flags = 0;
    $user = User::newFromName( $wikiuser );
    if( is_object( $user ) ) {
      $wgUser =& $user;
      //$article = new WikiPage( $wgTitle );
    
      echo("Text: " . $text . "\n");
      echo("Title: " . $title . "\n");
      echo("SERVER: " . $serverName . "\n");
      echo("Title->exists(): " . $wgTitle->exists() . "\n");
 
      //if( $title->isKnown() && !$overwrite) {
      //  $oldText = $article->getRawText();
      //  $text = $oldText . "\n----\n" . $text;
      //}
     
	  $text = getJobsTemplate($title, $wikiuser, $text) . "\n" . $text;
 
      echo ("text: " . $text . "\n");    
      
      //$article->doEdit( $text, $comment, $flags );
      //$url = $title->getFullURL();

	  $pagename = findItem($title);
	  $url = addPage($pagename, $text);
	  if($url != null) {
      	$url = str_replace("localhost", gethostname() . ".mitre.org", $url);
        emailResponse($originalSender, $wesEmail, $url);    

	  } else {
        $wgTitle = Title::newFromText($pagename);
      	$url = $wgTitle->getFullURL();
      	$url = str_replace("localhost", gethostname() . ".mitre.org", $url);
		
        emailPageExistsResponse($originalSender, $wesEmail, $url);    

	  }
      
    } else {
      echo( "invalid user.\n" );
    }
    
  } else {
	echo( "invalid title.\n" );
  }

  exec( "rm " . $foo );

} 

function findPage($query) {
        $params = array();
        $params[] = $query;
        $params[] = "headers=hide";
        $params[] = "link=none";
        $params[] = "searchlabel=";
        $params[] = "limit=1";
        $params[] = "default=";
        $output = SMWQueryProcessor::getResultFromFunctionParams($params,
            SMW_OUTPUT_WIKI);
        $output = trim($output);
        if (strlen($output) > 0) {
                return $output;
        }
        return false;
}


function findItem($title) {
        return findPage(
            "[[Category:Jobs]][[Name::" . $title ."]]");
}



function addPage($pagename, $text) {
        if ($pagename == false) {
            $id = 0;
            do {
                $id++;
                $pagename = "Job:" . $id;
                $title = Title::newFromText($pagename);
            } while ($title->exists());
            $summary = 'Created Page.';
            $flag = EDIT_NEW;
        	$page = new WikiPage($title);
        	$page->doEdit($text, $summary, $flag);
      		$url = $title->getFullURL();
			return $url;
        }
		return null;
}


function getJobsTemplate($subject, $wikiuser, $text) {
	$template = "{{Job\n" .
				"|Name=" . $subject . "\n" . 
				"|Status=Open\n" . 
				"|POC=" . $wikiuser . "\n" .
				"|Expertise=" . getExpertise($text) . "\n}}\n";

	return $template;
}

function getExpertise($text) {
	$store = smwfGetStore();

	$property = SMWDIProperty::newFromUserLabel("Expertise");

	$values = $store->getPropertyValues(null, $property);

	$lowerText = strtolower($text);
	$expertise = "";

	foreach($values as $value) {
		$label = $value->getString();
		$lowerLabel = strtolower($label);

		if (strpos($lowerText, $lowerLabel) !== false) {
			$expertise = $label . "," . $expertise;	
		}
	}

	$length = strlen($expertise);
	return substr($expertise, 0, $length-1);
}


function getWikiUser($from) {
  $idx = strpos($from, "<");
  $idx++;
  $temp = substr($from, $idx);
  $len = strpos($temp, "@");
  $user = substr($temp, 0, $len);
  return $user;
}

function getOriginalSender($from) {
  $idx = strpos($from, "<");
  $idx++;
  $temp = substr($from, $idx);
  $idx = strpos($temp, ">");
  $sender = substr($temp, 0, $idx);
  return $sender;
}

function getReturnEmail($to, $cc, $serverName ) {
   $temp = $to;
   $idx1 = strpos($to, "\"wes@");
   $idx2 = strpos($cc, "\"wes@");
  
   if(($idx1 === false) && ($idx2 === false)) {

      return $serverName . "@" . gethostname() . ".mitre.org";

   } else {
      return "wes@gestalt.mitre.org";
   }

}

function getServerName($to, $cc ) {
   $temp = $to;
   $idx1 = strpos($to, "\"wes@");
   $idx2 = strpos($cc, "\"wes@");
  
 
   if(($idx1 === false) && ($idx2 === false)) {
       return getServerNameUsingWiki($to, $cc);
   } else {
       return getServerNameOrig($to, $cc);
   }
}

function getServerNameUsingWiki($to, $cc) {
   $filename = "/GESTALT/WES/wes-jobs-wikis.txt";
   $listOfWikis = file($filename, FILE_IGNORE_NEW_LINES);

   foreach($listOfWikis as $wikiname) {
     
      $address = strtolower("\"$wikiname@");
      
      $idx1 = strpos($to, $address);
      $idx2 = strpos($cc, $address);
      if(!(($idx1 === false) && ($idx2 === false))) {
        return $wikiname;
      } 
   } 
  
   return null;
 
}

function getServerNameOrig($to, $cc) {
  $temp = $to;
  $idx = strpos($temp, "\"wes@");

  if($idx === false) {
    $temp = $cc;
    $idx = strpos($temp, "\"wes@");
  }

  if($idx === false) {
    return false;
  }

  $idx += 5;
  $temp = substr($temp, $idx);
  $idx = strpos($temp, ".");
  $server = substr($temp, 0, $idx);
  return $server;
}

function isPostOrRequest($subject) {
  $idx = strpos($subject, "REQUEST: ");
  if($idx === false)
    return true;
  
  if($idx === 0)
    return false;
  else 
    return true;
}

function getOverwrite($subject) {
  $idx = strpos($subject, "OVERWRITE: ");
  if($idx === false)
    return false;
  
  if($idx === 0)
    return true;
  else
    return false;
}

function removeKeywords($subject) {
  $idx = strpos($subject, "OVERWRITE: ");
  if($idx !== false) {
    if($idx == 0) {
      $temp = substr($subject, 11);
      return $temp;
    }
  } 

  $idx = strpos($subject, "CREATE: ");
  if($idx !== false) {
    if($idx == 0) {
      $temp = substr($subject, 8);
      return $temp;
    }
  }

  $idx = strpos($subject, "APPEND: ");
  if($idx !== false) {
    if($idx == 0) {
      $temp = substr($subject, 8);
      return $temp;
    }
  }


  $idx = strpos($subject, "REQUEST: ");
  if($idx !== false) {
    if($idx == 0) {
      $temp = substr($subject, 9);
      return $temp;
    }
  }

  $idx = strpos($subject, "FW: ");
  if($idx !== false) {
    if($idx == 0) {
      $temp = substr($subject, 4);
      return $temp;
    }
  }

  $idx = strpos($subject, "RE: ");
  if($idx !== false) {
    if($idx == 0) {
      $temp = substr($subject, 4);
      return $temp;
    }
  }


  return $subject;
}

function emailResponse($mailTo, $mailFrom, $url) {
  $mailSubject = "Wes Results: Wes says, 'Good News!'";

  $mailBody = "This email is an auto-generated response from Wes.\n\n";
  $mailBody .= "Wes received your last posting and your updated article can be";
  $mailBody .= " found here:\n";
  $mailBody .= $url;
  $mailBody .= "\n\nThanks from Wes!";

  $mailHeaders = "From: " . $mailFrom . "\n";
  $replyTo = "'-f" . $mailFrom . "'";
  mail($mailTo, $mailSubject, $mailBody, $mailHeaders, $replyTo);
}

function emailPageExistsResponse($mailTo, $mailFrom, $url) {
  $mailSubject = "Wes Results: Wes says, 'Hmmm...'";

  $mailBody = "This email is an auto-generated response from Wes.\n\n";
  $mailBody .= "Wes received your last posting and it looks like your page already exists.";
  $mailBody .= "Your update last email post was not processed, but the existing page can be found  found here:\n";
  $mailBody .= $url;
  $mailBody .= "\n\nThanks from Wes!";

  $mailHeaders = "From: " . $mailFrom . "\n";
  $replyTo = "'-f" . $mailFrom . "'";
  mail($mailTo, $mailSubject, $mailBody, $mailHeaders, $replyTo);
}

function createTempFile($text, $user, $date) {
  $foo = exec('mktemp /tmp/wikimail.XXXXXX');
  $fw = fopen($foo, 'w');

  fwrite($fw, $text);
  /*fwrite($fw, "\n{{Wes Signature\n|name=");
  fwrite($fw, $user);
  fwrite($fw, "\n|date=");
  fwrite($fw, $date);
  fwrite($fw, "\n}}\n");
  */
  fclose($fw);

  return $foo;
}

function grabTemplate($text, $email, $title) {
   $t = $text;

   $forWes = strpos($t, "[[Category:Wes Template]]");
   if($forWes == false) {
     return "";
   }

   $idx = strpos($t, "<pre>");

   if($idx == false) {
     return "";
   }

   $idx2 = strpos($t, "</pre>");
   $idx += 5;
   $len = $idx2 - $idx;
   $template = substr($t, $idx, $len);
   $template = trim($template);
   $template = str_replace(" ", "%20", $template);
   $template = str_replace("\n", "%0D%0A", $template);

   $link = "<a href=\"mailto:" . $email . "?subject=<Enter%20Page%20Title%20Here>&body=" . $template . "%0D%0A%0D%0A<Enter%20content%20here.>\">" . $title . "</a>\n";

   return $link;
}

function makeLink($ref, $text) {
  $link = "<a href=\"" . $ref . "\">" . $text . "</a>";
  return $link;
}

function emailRequestResponse($mailTo, $mailFrom, $url, $links) {
  $mailSubject = "Wes Results: Wes says, 'So you wanted Templates... huh?'";

  $mailBody = "This email is an auto-generated response from Wes.\n<br><br>\n";
  $mailBody .= "Here are all the templates I found on your wiki:\n<br>";
  $mailBody .= $links;
  $mailBody .= "The first link will take you to the wiki page for that template. The second link will start an email to Wes with that template.\n<br><br>";
  $mailBody .= "All the links are also available on wiki itself here:\n";
  $mailBody .= $url;
  $mailBody .= "\n<br><br>\nRegards,\n<br>Wes!";

  $mailHeaders = "MIME-Version: 1.0\r\n";
  $mailHeaders .= "Content-type: text/html; charset=iso-8859-1\r\n";
  $mailHeaders .= "From: " . $mailFrom . "\r\n";
  $replyTo = "'-f" . $mailFrom . "'";
  mail($mailTo, $mailSubject, $mailBody, $mailHeaders, $replyTo);
}

?>
