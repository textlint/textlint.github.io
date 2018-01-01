// LICENSE : MIT
"use strict";
import {element} from 'decca'
import debounce from "lodash.debounce"
import CodeMirrorEditor from "./CodeMirrorEditor"
import {updateRuleErrors, updateText} from "../../actions/textlintActions"
import {TextLintCore} from "textlint"
import textlintToCodeMirror from "textlint-message-to-codemirror";
require("codemirror/addon/mode/overlay.js");
require("codemirror/mode/xml/xml.js");
require("codemirror/mode/markdown/markdown.js");
require("codemirror/mode/gfm/gfm.js");
require("codemirror/mode/javascript/javascript.js");
require("codemirror/mode/css/css.js");
require("codemirror/mode/htmlmixed/htmlmixed.js");
require("codemirror/mode/clike/clike.js");
require("codemirror/mode/meta.js");
require("codemirror/addon/edit/continuelist.js");
require("codemirror/addon/lint/lint.js");
// for Mobile
var userAgent = window.navigator.userAgent.toLowerCase()
if (userAgent.indexOf('iphone') != -1 || userAgent.indexOf('ipad') != -1 || userAgent.indexOf('android') != -1) {
  const origOnKeyPress = cm.display.input.onKeyPress
  cm.display.input.onKeyPress = function(e) {
    if(e.which >= 0x10000) {
      return
    }

    if(!cm.display.input.composing) {
      cm.keyPressTimer = setTimeout( () => {
        origOnKeyPress.call(this, e)
      }, 30)
    }
  }

  const inputArea = cm.display.input.div || cm.display.input.textarea
  inputArea.addEventListener('compositionstart', (_cm, e) => {
    if(cm.keyPressTimer) {
      clearTimeout(cm.keyPressTimer)
    }
  }, false)

  const inputField = cm.display.input.getField()
  window.addEventListener('keydown', function(e){
    if(e.target == inputField && cm.display.input.composing) {
      e.stopPropagation()
    }
  }, true)

  inputField.addEventListener('blur', function(e){
    if(e.relatedTarget) {
      return
    }
    e.stopPropagation()

    if (cm.display.input.composing) {
      inputField.focus()
      setTimeout(function(){
        inputField.blur()
      }, 1)
    }
  }, false)
}
const textlint = new TextLintCore();
const createValidator = ({rules, rulesOption}) => {
    textlint.setupRules(rules, rulesOption);
    return (text, callback) => {
        if (!text) {
            callback([]);
            return;
        }
        textlint.lintText(text, ".md").then(result => {
            const lintMessages = result.messages;
            const lintErrors = lintMessages.map(textlintToCodeMirror);
            callback(lintErrors);
        }).catch(error => {
            console.error(error);
        });
    };
};
const onChange = (dispatch) => {
    return (text) => {
        const value = text;
        textlint.lintMarkdown(value).then(result => {
            dispatch(updateRuleErrors(result.messages));
            return result;
        });
    }
};
export default {
    render({props, dispatch}){
        const {enabledRules} = props;
        const rules = enabledRules.reduce((rules, rule) => {
            rules[rule.name] = rule.rule;
            return rules;
        }, {});
        const rulesOption = enabledRules.reduce((rules, rule) => {
            rules[rule.name] = rule.options || true;
            return rules;
        }, {});
        const validator = createValidator({
            rules,
            rulesOption
        });

        const options = {
            lineNumbers: true,
            lineWrapping: true,
            mode: "gfm",
            gutters: ["CodeMirror-lint-markers"],
            lint: {
                "getAnnotations": validator,
                "async": true
            }
        };
        const onChangeHandler = debounce(onChange(dispatch), 1000);
        return <div class="TextlintEditor">
            <CodeMirrorEditor defaultValue={props.value} options={options} onChange={(cm) => {
                return onChangeHandler(cm.getValue());
            }}/>
        </div>
    }
}
