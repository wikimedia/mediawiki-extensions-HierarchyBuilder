<?php

//Set path to your MediaWiki installation
$install_path = '/usr/share/mediawiki-1.21.1';
chdir( $install_path );
require_once( 'maintenance/wes/MimeMailParser.class.php');
require_once( 'maintenance/wes/attachment.class.php');

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
$wesEmail = "wes@" . $serverName;
$date = date("M j Y g:i:s A");
$isPost = isPostOrRequest($subject);
$overwrite = getOverwrite($subject);
$title = removeKeywords($subject);


//Load Mediawiki Stuff
# Define us as being in MediaWiki
$_SERVER['SERVER_NAME']="$serverName";
$wgServerName="$serverName";
require_once( 'maintenance/commandLine.inc');
require_once( 'maintenance/importImages.inc' );

$user = User::newFromName( $wikiuser );
if( is_object( $user ) ) {
    $wgUser =& $user;
}


//Handle attachments
$save_dir = '/tmp/'; 
$attachmentResults = "\n===Attachments:===\n";
foreach($attachments as $attachment) { 
  // get the attachment name 
  $filename = $attachment->filename; 
  $filetitle = Title::makeTitleSafe( NS_FILE, $filename );

  $content_type = $attachment->content_type;
  // write the file to the directory you want to save it in 
  if ($fp = fopen($save_dir.$filename, 'w')) { 
    while($bytes = $attachment->read()) { 
      fwrite($fp, $bytes); 
    } 
    fclose($fp); 
  }

  if( !is_object( $filetitle ) ) {
    $attachmentResults .= "* Sorry there was an issue with attachment: $filename\n"; 
    exec( "rm " . $save_dir.$filename );
    continue;
  }
 
  $image = wfLocalFile( $filetitle );
  if( $image->exists() ) {
    $attachmentResults .= "* Warning!  Attachment: [[$filetitle]] already exists. Your attachment was not posted. Link links to original file.\n"; 
    exec( "rm " . $save_dir.$filename );
    continue;
  }

  $archive = $image->publish( $save_dir.$filename );
  //$archive = $image->publish( "/usr/share/mediawiki/maintenance/wes/Picture_1.jpg" );
  if( WikiError::isError( $archive ) ) {
    $attachmentResults .= "* Error posting: $filename. WikiError. Attachment not posted.\n";
    continue;
  }

  if( !$archive->isGood() ) {
    $attachmentResults .= "* Archive: " . $archive->getWikiText();
    $attachmentResults .= "* Error posting: $filename. Archive not good. Attachment not posted.\n";
    exec( "rm " . $save_dir.$filename );
    continue;
  } 

  if(! $image->recordUpload( $archive->value, "WES Uploaded File.", '') ) {
    $attachmentResults .= "* Error in recording upload: $filename. \n";
  }
  exec( "rm " . $save_dir.$filename );
  $attachmentResults .= "* [[$filetitle]]\n"; 
  //$foo2 = createTempFile($filename, $content_type, $filetitle);

}

if(count($attachments) > 0) {
  $text .= $attachmentResults;
}

//Handle Posts and Requests
if($isPost) {
  //Handle Posts
  $foo = createTempFile($text, $wikiuser, $date);

  $title = Title::newFromUrl( $title );
  global $wgTitle;
  $wgTitle = $title;

  if( is_object( $title ) ) {
    $text = file_get_contents( $foo );
    $comment = 'Wiki post from MITRE Wiki Email Service (WES).';
    $flags = 0;
    $user = User::newFromName( $wikiuser );
    if( is_object( $user ) ) {
      $wgUser =& $user;
      $article = new WikiPage( $title );
      
      if( $title->exists() && !$overwrite) {
        $oldText = $article->getRawText();
        $text = $oldText . "\n----\n" . $text;
      }
      
      echo ("text: " . $text);    
      
      echo ("comment: " . $comment);    
      $article->doEdit( $text, $comment, $flags );
      
      echo ("title: " . $article->getRawText());    
      $url = $title->getFullURL();
      emailResponse($originalSender, $wesEmail, $url);    
      
    } else {
      echo( "invalid user.\n" );
    }
  } else {
    echo( "invalid title.\n" );
  }
  
  exec( "rm " . $foo );

} else { 
  //Handle Requests
  if( $title == "Templates" ) {
     $page = SpecialPage::getPage( "Templates");
     $name = $page->name;
     $title = $page->getTitle();
     $url = $title->getFullURL();

     $dbr = wfGetDB( DB_SLAVE );
     $sql = "SELECT page_title from page where page_namespace = '10';";
     $res = $dbr->query( $sql );
     $rows = $dbr->numRows( $res );

     $links = "<TABLE border=\"1\" cellpadding=\"5\" cellspacing=\"10\">\n";
     if( $dbr->numRows( $res ) != 0 ) {
        while( $row = $dbr->fetchObject( $res ) ) {

           $title = $row->page_title;
           $title = Title::newFromText( $title, 10 );
           $article = new Article( $title );
           global $wgTitle;
           $wgTitle = $title;
           $text = $article->getRawText();
           $template = grabTemplate( $text, $wesEmail, "Email Wes" );
           if($template != "") {
              $links .= "<TR>\n";
              $links .= "<TD>" . makeLink($title->getFullURL(), $title->getText()) . "</td>\n";
              $links .= "<TD>" . $template . "</td>\n</tr>\n";
           }
        }
     } else {
        $links = "No Templates Found\n";
     }
     $dbr->freeResult($res);
     $links .= "</TABLE><BR>\n";
     emailRequestResponse($originalSender, $wesEmail, $url, $links);
  }

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

function getServerName($to, $cc) {
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

function createTempFile($text, $user, $date) {
  $foo = exec('mktemp /tmp/wikimail.XXXXXX');
  $fw = fopen($foo, 'w');

  fwrite($fw, $text);
  fwrite($fw, "\n{{Wes Signature\n|name=");
  fwrite($fw, $user);
  fwrite($fw, "\n|date=");
  fwrite($fw, $date);
  fwrite($fw, "\n}}\n");
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
