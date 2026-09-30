import { useRef } from "react";
import { Plus, X } from "lucide-react";
import TextInput from "../ui/TextInput.jsx";
import Select from "../ui/Select.jsx";
import BeanRating from "../ui/BeanRating.jsx";
import DashedButton from "../ui/DashedButton.jsx";

const categories = ["Coffee", "Tea", "Pastry", "Food", "Other"];

// "What did you order?" — a repeating list of items, each with its own rating.
function OrderItemEditor({ items, onChange }) {
  const nextKey = useRef(0);

  const add = () => {
    nextKey.current += 1;
    onChange([...items, { key: nextKey.current, name: "", category: "Coffee", rating: 0, note: "" }]);
  };
  const update = (key, patch) => onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  const remove = (key) => onChange(items.filter((item) => item.key !== key));

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.key} className="relative rounded-box border border-base-300 bg-surface p-4">
          <div className="grid gap-3 pr-9 sm:grid-cols-2">
            <TextInput
              placeholder="Item name"
              aria-label="Item name"
              value={item.name}
              onChange={(e) => update(item.key, { name: e.target.value })}
            />
            <Select
              options={categories}
              aria-label="Category"
              value={item.category}
              onChange={(e) => update(item.key, { category: e.target.value })}
            />
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="text-secondary">Rating:</span>
            <BeanRating value={item.rating} onChange={(rating) => update(item.key, { rating })} size={16} label="Item rating" />
          </div>
          <TextInput
            placeholder="Short note (optional)"
            aria-label="Short note"
            value={item.note}
            onChange={(e) => update(item.key, { note: e.target.value })}
            className="mt-3"
          />
          <button
            type="button"
            onClick={() => remove(item.key)}
            aria-label="Remove item"
            className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-secondary hover:bg-base-200"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <DashedButton icon={Plus} onClick={add}>
        Add an item
      </DashedButton>
    </div>
  );
}

export default OrderItemEditor;
