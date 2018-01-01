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
