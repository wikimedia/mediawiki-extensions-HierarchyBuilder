#!/usr/bin/python
from email.mime.text import MIMEText
import hashlib
import maintenance
import os
import re
import smtplib
from subprocess import Popen, PIPE
import urllib2
from urlparse import urlparse

HOST_THRESHOLD = 2 

HASH = 'hash'

VERSION = 'version'

UPDATE_FLAG_NORMAL = '^\|possible update=false$'

UPDATE_FLAG_UPDATED = '|possible update=true'

NEW_VERSION_STRING = '(CTS has detected a possible update)'

# Proxy information
HTTP_PROXY = 'gatekeeper-w.mitre.org:80'

USE_PROXY = True 

HEADERS = { 'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:23.0) Gecko/20100101 Firefox/23.0' }

# For sending email
COMMASPACE = ', '

FROM_ADDRESS = 'cts@mitre.org'

TO_ADDRESS = ['dbeck@mitre.org']

EMAIL_SUBJECT = 'Possible updated CTS tools'

SMTP_SERVER = 'smtp-mclean.mitre.org'

CTS_PREFIX = 'http://gestalt-cts.mitre.org/cts/index.php/'


# Really just want a C-like struct to store info about a tool
# Could make this OO...
class ToolData(object):
    __slots__= "page_content", "hostname", "blank_hash", "updated_version"

    def __init__(self, page_content, hostname, blank_hash):
        self.page_content = page_content
        self.hostname = hostname
        self.blank_hash = blank_hash
        self.updated_version = False

def update_version(host_count,page_content):
    # If multiple tools on the same site have changed hashes, the site was 
    # probably updated, so we don't update the version.
    # TODO: separate the 'heuristics' from the version update logic.
    if (host_count[page_content.hostname] < HOST_THRESHOLD and not
            page_content.blank_hash):
        page_content.updated_version = True
        p = re.compile(UPDATE_FLAG_NORMAL, re.M)
        page_content.page_content = p.sub(UPDATE_FLAG_UPDATED, page_content.page_content)
    return page_content

def update_save_data(page_content,hash_field,new_save_data):
    page_content = page_content.replace(hash_field,"DPsaveddata=" + new_save_data)
    return page_content

def check_version(page):
    prog = re.compile(r"((v|V)\d+\.\d+)")
    result = prog.search(page)
    return result.group(1) 

def check_hash(page):
    m = hashlib.md5()
    m.update(page)
    return m.hexdigest()

def check_page(page_content):
    prog = re.compile(r"\|downloadpage=(.+)\n\|method=(.*)\n\|(DPsaveddata=(.*))\n",re.MULTILINE)
    result = prog.search(page_content)

    if result:
        url = result.group(1)
        method = result.group(2)
        hash_field = result.group(3)
        current_save_data = result.group(4) 
        try:
            #request = urllib2.Request(url,headers=HEADERS)
            #page_data = urllib2.urlopen(request,timeout=60)
            page_data = urllib2.urlopen(url,timeout=60)

            if (method == HASH):
                new_save_data = check_hash(page_data.read())
            else:
                new_save_data = check_version(page_data.read())

            # If saved data has changed, we need to update the wiki page for the tool.
            if (new_save_data != current_save_data):
                blank_hash = current_save_data == ""
                page_content = update_save_data(page_content, hash_field, new_save_data)
                p = ToolData(page_content, urlparse(url).hostname, blank_hash)
                return False, p
            else:
                return False, None
        except urllib2.HTTPError as e:
            error = "Error %s while trying to retrieve %s" % (e, url)
            return True, error
        except urllib2.URLError as e:
            error = "Error %s while trying to retrieve %s" % (e, url)
            return True, error
    return True, None

def email_updated_tools(tool_data, errors, missing):
    text = ""

    if tool_data != {}:
        text += "\n\nThe following tools may have been updated:\n\n"
    for tool in tool_data.keys():
        if tool_data[tool].updated_version:
            text += '%s (%s%s)\n' % (tool, CTS_PREFIX, tool) 

    if errors != {}:
        text += "\n\nThere were errors when attempting to update these tools:\n\n"
    for tool in errors.keys():
        text += '%s (%s%s):\n' % (tool, CTS_PREFIX, tool) 
        text += '%s\n\n' % (errors[tool])

    if missing != {}:
        text += "\n\nThese tool pages have missing or malformed update information:\n"
    for tool in missing.keys():
        text += '%s (%s%s):\n' % (tool, CTS_PREFIX, tool) 

    if text is not "":  
        msg = MIMEText(text)
        msg['Subject'] = EMAIL_SUBJECT 
        msg['From'] = FROM_ADDRESS
        msg['To'] = COMMASPACE.join(TO_ADDRESS)

        s = smtplib.SMTP(SMTP_SERVER)
        s.sendmail(FROM_ADDRESS, TO_ADDRESS, msg.as_string())
        s.quit()

def initialize():
    os.environ["WIKI_NAME"] = "cts"
    if USE_PROXY:
        proxy = urllib2.ProxyHandler({'http': HTTP_PROXY, 'https': HTTP_PROXY})
        opener = urllib2.build_opener(proxy)
        urllib2.install_opener(opener)

def main():
    initialize()

    tool_list = maintenance.get_pages()
    tool_data = {}
    host_count = {}
    errors = {}
    missing = {}

    # Build dict of possibly updated tools, indexed by tool name
    for tool in tool_list :
        print tool
        page = maintenance.get_page(tool)
        (error, tool_page_content) = check_page(page)
        if error:
            if tool_page_content is not None:
                errors[tool] = tool_page_content
            else:
                missing[tool] = tool_page_content
        else:
            if tool_page_content is not None:
                tool_data[tool] = tool_page_content
                host_count[tool_page_content.hostname] = 1 if tool_page_content.hostname not in host_count else host_count[tool_page_content.hostname] + 1

    # Update pages for possibly updated tools
    for tool in tool_data.keys():
        tool_data[tool] = update_version(host_count,tool_data[tool])
        maintenance.update_page(tool,tool_data[tool].page_content)
        #print "Updated: %s\n" % tool
    email_updated_tools(tool_data, errors, missing)

if __name__ == "__main__":
    main()
