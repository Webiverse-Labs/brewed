import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputClass } from "./inputStyles.js";

function PasswordInput({ look = "filled", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={inputClass(look, "h-11 pr-12 pl-4")} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-secondary hover:bg-base-300/60"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default PasswordInput;
