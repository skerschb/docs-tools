import fett
import re
from docutils.parsers.rst import Directive, directives
from docutils import statemachine
from docutils.utils.error_reporting import ErrorString

URIWRITER_TEMPLATE = fett.Template('''
.. raw:: html

   <p class="uriwriter"><FORM NAME="myform" ACTION="" METHOD="GET">
Enter something in the box: <BR>
<INPUT TYPE="text" NAME="inputbox" VALUE=""><P>
<INPUT TYPE="button" NAME="button" Value="Click" onClick="testResults(this.form)">
</FORM>{{ url }}
   </p>
''')

LEADING_WHITESPACE = re.compile(r'^\n?(\x20+)')
PAT_KEY_VALUE = re.compile(r'([a-z_]+):(.*)', re.M)




def parse_keys(lines):
    """docutils field list parsing is busted. Just do this ourselves."""
    result = {}
    print lines
    text = '\n'.join(lines).replace('\t', '    ')
    print text
    for match in PAT_KEY_VALUE.finditer(text):
        if match is None:
            continue
        value = match.group(2)
        print "value" + value
        print match
        indentation_match = LEADING_WHITESPACE.match(value)
        if indentation_match is None:
            value = value.strip()
        else:
            indentation = len(indentation_match.group(1))
            lines = [line[indentation:] for line in value.split('\n')]
            if lines[-1] == '':
                lines.pop()

            value = '\n'.join(lines)

        result[match.group(1)] = value

    return result


class UriwriterDirective(Directive):
    has_content = True
    required_arguments = 0
    optional_arguments = 0
    final_argument_whitespace = True
    
    
      

    def run(self):
        print self.content
        options = parse_keys(self.content)
        print options
        rendered = URIWRITER_TEMPLATE.render(options)
        rendered_lines = statemachine.string2lines(
            rendered, 4, convert_whitespace=1)
        self.state_machine.insert_input(rendered_lines, '')

        return []


def setup(app):
    app.add_directive('uriwriter', UriwriterDirective)

    return {
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
