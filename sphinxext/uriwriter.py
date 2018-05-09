import fett
import re
from docutils.parsers.rst import Directive, directives
from docutils import statemachine
from docutils.utils.error_reporting import ErrorString


URIWRITER_TEMPLATE = '''
.. raw:: html

   <p class="uriwriter">
   <form class="uriwriter__form" id="uriwriter" autocomplete="off">
     <div class="uriwriter__form__instructions">Select your server deployment type:</div>
     <div id="userinfo flex-container" class="row">
        <fieldset>
                <ul class="uriwriter__form__toggle">
                    <li class="uriwriter__form__toggle__item">on-premise MongoDB</li>
                    <li class="uriwriter__form__toggle__item">on-premise MongoDB with replica set</li>
                    <li class="uriwriter__form__toggle__item">Atlas (Cloud)</li>
                </ul>
        </fieldset>
        <div class="uriwriter__form__atlascontrols">
            <div class="uriwriter__form__atlascontrols--statusmessage">
            </div>
            <div class="uriwriter__form__atlascontrols--detailsmessage">
            </div>
            <div class="uriwriter__form__atlascontrols--button" id="close">X</div>
            <div class="uriwriter__form__atlascontrols--button" id="success">check</div>
            <div class="uriwriter__form__atlascontrols--wrapper">
                <div class="form_instructions">Paste your connection string here:</div>
                    <textarea class="uriwriter__form__atlascontrols--paste" id="uriwriter_atlaspaste" rows="4" cols="100">
                    </textarea>
            </div>
        </div>
        <div id="userinfo_form">
            <fieldset>
                <input class="uriwriter__form__input" id="uriwriter_username" value='' data-toggle="tooltip" title="username you will use to connect" type="text" name="username" required>
                <label class="uriwriter__form__input__label" for="username">Username</label>
            </fieldset>
            <fieldset>
                <input class="uriwriter__form__input" id="uriwriter_db" value='' type="text" name="db" required>
                <label class="uriwriter__form__input__label" for="db">Database name</label>
            </fieldset>
            <div class="uriwriter__form__options" id="options"></div>
                <div class="uriwriter__form__instructions">Add Servers:</div>
                    <div class="uriwriter__form__container">
                        <fieldset class="uriwriter__form__input--hostgrid">
                            <input class="input-uriwriter" id="hostname" type="text" name="hostname">
                            <label for="hostname">Hostname or IP</label>
                        </fieldset>
                        <fieldset class="uriwriter__form__input--hostgrid">
                            <input class="input-uriwriter" id="port" type="number" name="port">
                            <label for="port">Port</label>
                        </fieldset>
                        <fieldset class="uriwriter__form__input--button">
                            <button id="uriwriter_act">+</button>
                        </fieldset>
                    </div>
                    <div id="uriwriter__form__buttonlist">
                        <ul id="hostlist" style="uriwriter__form__buttonlist__item">
                        </ul>
                    </div>
                </div>
            </div>
        </div>
  </form>
   </p>
'''

class UriwriterDirective(Directive):
    has_content = True
    required_arguments = 0
    optional_arguments = 0
    final_argument_whitespace = True

    def run(self):
        rendered = URIWRITER_TEMPLATE
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
