import { ChevronDown } from "lucide-react";
import { inputClass } from "./inputStyles.js";

function Select({ look = "filled", options, ...props }) {
  return (
    <div className="relative">
      <select className={inputClass(look, "h-11 appearance-none pr-10 pl-4")} {...props}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2" />
    </div>
  );
}

export default Select;
