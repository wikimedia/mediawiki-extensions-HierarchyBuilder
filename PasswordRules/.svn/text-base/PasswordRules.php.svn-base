<?php

/*
 * Copyright (c) 2013 The MITRE Corporation
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/**
* To activate the functionality of this extension include the following
* in your LocalSettings.php file:
* include_once("$IP/extensions/PasswordRules/PasswordRules.php");
*/

if( !defined( 'MEDIAWIKI' ) ) {
	echo "Not an entry point!\n";
	die( 1 );
}

$wgValidPasswords = array(
	'minlength' => 12,
	'lowercase' => true, #Should we require at least one lowercase letter?
	'uppercase' => true, #Should we require at least one uppercase letter?
	'digit'     => true, #Should we require at least one digit?
	'special'   => true, #Should we require at least one special character (punctuation, etc.)?
	'usercheck' => true, #Should we disallow passwords that are the same as the username?
	'wordcheck' => function_exists( 'pspell_check' ), #Should we check the password against a dictionary to make sure that it is not a word?
);

$wgExtensionCredits['other'][] = array(
	'path'           => __FILE__,
	'name'           => 'PasswordRules',
	'author'         => 'Cindy Cicalese',
	'version'        => '1.0',
	'description'    => 'This evolved from the password validation part of https://www.mediawiki.org/wiki/Extension:SecurePasswords',
);

$wgExtensionMessagesFiles['PasswordRules'] = dirname( __FILE__ ) . '/PasswordRules.i18n.php';

$wgHooks['isValidPassword'][] = 'efPasswordRules_Validate';

function efPasswordRules_Validate( $password, &$result, $user ) {
	// if the password matches the user's current password, then don't check for validity
	// this way users with passwords that don't fit the criteria can still log in :)
	if( ( $id = $user->getId() ) !== 0 ) {
		$dbr = wfGetDB( DB_SLAVE );
		$hash = $dbr->selectField( 'user', 'user_password', 'user_id=' . $id );
		if( User::comparePasswords( $hash, $password, $id ) ) {
			$result = true;
			return false;
		}
	}

	$ok = true;
	$conds = array();

	global $wgValidPasswords, $wgContLang, $wgLang, $wgUser;
	$lang = $wgContLang->getPreferredVariant( false );

	if( strlen( $password ) < $wgValidPasswords['minlength'] ) {
		$ok = false;
		$conds[] = wfMsgExt( 'passwordrules-minlength',
			array( 'parsemag' ), $wgValidPasswords['minlength'] );
	}
	
	if( $wgValidPasswords['lowercase'] &&
		!preg_match( '/[a-z]/', $password ) ) {
		$ok = false;
		$conds[] = wfMsg( 'passwordrules-lowercase' );
	}
	
	if( $wgValidPasswords['uppercase'] &&
		!preg_match( '/[A-Z]/', $password ) ) {
		$ok = false;
		$conds[] = wfMsg( 'passwordrules-uppercase' );
	}
	
	if( $wgValidPasswords['digit'] &&
		!preg_match( '/[0-9]/', $password ) ) {
		$ok = false;
		$conds[] = wfMsg( 'passwordrules-digit' );
	}
	
	if( $wgValidPasswords['special']) {
		$symbols = preg_replace('/[a-zA-Z0-9]/', '', $password);
		if (strlen($symbols) < 1) {
			$ok = false;
			$conds[] = wfMsg( 'passwordrules-special' );
		}
	}

	if( $wgValidPasswords['usercheck'] &&
		$wgContLang->lc( $password ) ==
			$wgContLang->lc( $user->getName() ) ) {
		$ok = false;
		$conds[] = wfMsgExt( 'passwordrules-username',
			array( 'parsemag' ), $wgUser->getName() );
	}

	if( $wgValidPasswords['wordcheck'] &&
		function_exists( 'pspell_check' ) ) {
		$found_word = false;
		$link = pspell_new( $lang, '', '', '',
			( PSPELL_FAST | PSPELL_RUN_TOGETHER ) );
		if( $link && pspell_check( $link, $password ) ) {
			$ok = false;
			$conds[] = wfMsg( 'passwordrules-word' );
			$found_word = true;
		}
		if( !$found_word && $lang != 'en' ) {
			$link = pspell_new( 'en', '', '', '',
				( PSPELL_FAST | PSPELL_RUN_TOGETHER ) );
			if( $link && pspell_check( $link, $password ) ) {
				$ok = false;
				$conds[] = wfMsg( 'passwordrules-word' );
			}
		}
	}

	if ( !$ok ) {
		$result = array( 'passwordrules-valid',
			$wgLang->listToText( $conds ) );
		return false;
	}

	$result = true;
	return false;
}
