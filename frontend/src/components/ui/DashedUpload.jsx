import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { dashedClass } from "./inputStyles.js";
import { cn } from "../../lib/cn.js";

// File picker styled as a dashed box. UI-only phase: files stay in the browser as previews.
function DashedUpload({ icon: Icon, label, multiple = false, name, className }) {
  const [files, setFiles] = useState([]);
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Revoke preview URLs only on unmount — revoking per render would blank previews still on screen.
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const handleChange = (e) => {
    const picked = Array.from(e.target.files ?? []).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setFiles((prev) => {
      if (!multiple) prev.forEach((f) => URL.revokeObjectURL(f.url));
      return multiple ? [...prev, ...picked] : picked;
    });
    e.target.value = "";
  };

  const remove = (url) => {
    URL.revokeObjectURL(url);
    setFiles((prev) => prev.filter((f) => f.url !== url));
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label className={dashedClass}>
        {Icon && <Icon size={16} />}
        {label}
        <input type="file" accept="image/*" multiple={multiple} name={name} onChange={handleChange} className="sr-only" />
      </label>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map(({ file, url }) => (
            <div key={url} className="relative size-20 overflow-hidden rounded-xl bg-base-300">
              <img src={url} alt={file.name} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label={`Remove ${file.name}`}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-primary/70 text-primary-content"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashedUpload;
