import { inputClass } from "./inputStyles.js";

function TextArea({ look = "filled", rows = 3, ...props }) {
  return <textarea rows={rows} className={inputClass(look, "resize-y px-4 py-3 leading-relaxed")} {...props} />;
}

export default TextArea;
