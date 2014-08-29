import os
import re
from subprocess import Popen, PIPE

# For running maintenance scripts
PHP = '/usr/bin/php'

SCRIPT_PATH = '/GESTALT/MEDIAWIKI/mediawiki-1.23/maintenance/'

SQL_SCRIPT = 'sql.php'
GET_TEXT_SCRIPT = 'getText.php'
EDIT_SCRIPT = 'edit.php'

FILE_DIR = os.path.dirname(__file__) + "/"
SQL_FILE = 'tool_pages_query.sql'


def run_command(command, shell=True):
    process = Popen(command, shell=shell, stdout=PIPE, stderr=PIPE)
    (stdout, stderr) = process.communicate()
    return stderr, stdout

def get_pages():
    command = '%s %s%s %s%s' % (PHP, SCRIPT_PATH, SQL_SCRIPT, FILE_DIR, SQL_FILE)
    print(command)
    (stderr, stdout) = run_command(command)
    lines = stdout.split('\n')

    prog = re.compile(r"\[page_title\] => (.*)")

    page_list = []
    for line in lines:
        name = prog.search(line)
        if name:
            page_list.append("Tool:" + name.group(1).replace('\n',''))
    return page_list

def get_page(title):
    command = '%s %s%s \"%s\"' % (PHP, SCRIPT_PATH, GET_TEXT_SCRIPT, title)
    (stderr, stdout) = run_command(command)
    #print stderr
    return stdout

def update_page(title, content):
    escaped_content = content.replace('"','\\"')
    command = '%s %s%s \"%s\" <<< \"%s\"' % (PHP, SCRIPT_PATH, EDIT_SCRIPT, title, escaped_content)
    (stderr, stdout) = run_command(command)
