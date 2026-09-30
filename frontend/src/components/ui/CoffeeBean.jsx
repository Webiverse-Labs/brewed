import { Bean } from "lucide-react";

// TEMPORARY: lucide's Bean stands in for the Figma `CoffeeBeanSVG` glyph.
// When the SVG is exported to src/assets/coffee-bean.svg, swap it in here — nothing else needs to change.
function CoffeeBean({ filled = true, size = 16, className }) {
  return (
    <Bean
      size={size}
      strokeWidth={filled ? 1.5 : 1.75}
      fill={filled ? "currentColor" : "none"}
      className={className}
      aria-hidden="true"
    />
  );
}

export default CoffeeBean;
