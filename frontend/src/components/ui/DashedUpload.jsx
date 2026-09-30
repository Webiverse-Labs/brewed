import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { dashedClass } from "./inputStyles.js";
import { cn } from "../../lib/cn.js";
import { shrinkImage } from "../../lib/shrinkImage.js";

// File picker styled as a dashed box with previews. The input is cleared after each pick (so the
// same file can be re-added), which means a surrounding <form> can't read the files: the parent
// gets them through `onChange(files)` and appends them to its FormData.
function DashedUpload({ icon: Icon, label, multiple = false, max = 6, onChange, className }) {
  const [files, setFiles] = useState([]);
  //the current list, updated with every change; shrinking is async, so a pick must not build on the list
  //from when it started (a photo removed meanwhile would come back, and overlapping picks would drop each other)
  const filesRef = useRef(files);

  // Revoke preview URLs only on unmount — revoking per render would blank previews still on screen.
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const update = (next) => {
    filesRef.current = next;
    setFiles(next);
    onChange?.(next.map((f) => f.file));
  };

  const handleChange = async (e) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = "";
    //big photos are shrunk here, so the previews and the upload use the smaller file
    const picked = (await Promise.all(chosen.map(shrinkImage))).map((file) => ({ file, url: URL.createObjectURL(file) }));
    const current = filesRef.current;
    if (!multiple) current.forEach((f) => URL.revokeObjectURL(f.url));
    const next = multiple ? [...current, ...picked] : picked;
    next.slice(max).forEach((f) => URL.revokeObjectURL(f.url));
    update(next.slice(0, max));
  };

  const remove = (url) => {
    URL.revokeObjectURL(url);
    update(filesRef.current.filter((f) => f.url !== url));
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label className={dashedClass}>
        {Icon && <Icon size={16} />}
        {label}
        <input type="file" accept="image/*" multiple={multiple} onChange={handleChange} className="sr-only" />
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
