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

$wgExtensionCredits['parserhook'][] = array (
	'name' => 'MagicWords',
	'version' => '1.2',
	'author' => 'Keven Ring, based on the Variables extension (not to be confused with the VariablesExtension!)',
	'description' => 'Defines additional Magic Words for use in pages',
	'url' => 'http://gestalt.mitre.org/wiki/Extension:MagicWords'
);

$wgCustomVariables = array('CURRENTUSER','LOGO','REFITEM');
 
$wgHooks['MagicWordMagicWords'][]          = 'wfAddCustomVariable';
$wgHooks['MagicWordwgVariableIDs'][]       = 'wfAddCustomVariableID';
$wgHooks['LanguageGetMagic'][]             = 'wfAddCustomVariableLang';
$wgHooks['ParserGetVariableValueSwitch'][] = 'wfGetCustomVariable';
 
function wfAddCustomVariable(&$magicWords) {
	foreach($GLOBALS['wgCustomVariables'] as $var) $magicWords[] = "MAG_$var";
	return true;
	}
 
function wfAddCustomVariableID(&$variables) {
	foreach($GLOBALS['wgCustomVariables'] as $var) $variables[] = "MAG_$var";
	return true;
	}
 
function wfAddCustomVariableLang(&$langMagic, $langCode = 0) {
	foreach($GLOBALS['wgCustomVariables'] as $var) {
		$magic = "MAG_$var";
		$langMagic[defined($magic) ? constant($magic) : $magic] = array(0,$var);
		}
	return true;
	}
 
function wfGetCustomVariable(&$parser,&$cache,&$index,&$ret) {
	switch ($index) {
 
		case "MAG_CURRENTUSER":
			$parser->disableCache(); # Mark this content as uncacheable
			$wgUser = $GLOBALS['wgUser'];
			if ($wgUser->isAnon()) {
				$ret = '';
			} else {
				$ret = $wgUser->mName;
			}
			break;
 
		case "MAG_LOGO":
			$ret = $GLOBALS['wgLogo'];
			break;
			
		case "MAG_REFITEM":
			$ret = strstr($GLOBALS['wgTitle'] , '(Article ' );
			break;
 
		}
	return true;
	}
