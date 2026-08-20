// FEATURE: Dashboard shell — sidebar nav item icons (exported from Figma)
import type { PageId } from "./Sidebar";
import v1 from "./nav-icons/vector1.svg?raw";
import v2 from "./nav-icons/vector2.svg?raw";
import v3 from "./nav-icons/vector3.svg?raw";
import v4 from "./nav-icons/vector4.svg?raw";
import v5 from "./nav-icons/vector5.svg?raw";
import v6 from "./nav-icons/vector6.svg?raw";
import v7 from "./nav-icons/vector7.svg?raw";
import v12 from "./nav-icons/vector12.svg?raw";
import v13 from "./nav-icons/vector13.svg?raw";
import v14 from "./nav-icons/vector14.svg?raw";
import v15 from "./nav-icons/vector15.svg?raw";
import v16 from "./nav-icons/vector16.svg?raw";
import v17 from "./nav-icons/vector17.svg?raw";
import v18 from "./nav-icons/vector18.svg?raw";
import v19 from "./nav-icons/vector19.svg?raw";
import v20 from "./nav-icons/vector20.svg?raw";
import v21 from "./nav-icons/vector21.svg?raw";
import v22 from "./nav-icons/vector22.svg?raw";
import v23 from "./nav-icons/vector23.svg?raw";

interface IconLayer {
  outer: string;
  inner: string;
  src: string;
}

const ICON_LAYERS: Record<PageId, IconLayer[]> = {
  "block-sites": [
    { outer: "8.33% 12.5%", inner: "-3.75% -4.17%", src: v1 },
    { outer: "31.25% 35.42% 39.59% 35.42%", inner: "-10.71%", src: v2 },
  ],
  "reel-blocks": [
    { outer: "8.37% 9.11% 8.3% 9.64%", inner: "-3.75% -3.85%", src: v3 },
    { outer: "35.42% 35.34% 35.42% 35.5%", inner: "-10.71%", src: v4 },
  ],
  "feed-blocks": [
    { outer: "16.67% 8.33%", inner: "-4.69% -3.75%", src: v5 },
    { outer: "33.33% 10.42% 66.67% 10.42%", inner: "-0.5px -3.95%", src: v6 },
    { outer: "18.75% 70.83% 66.67% 29.17%", inner: "-21.43% -0.5px", src: v7 },
  ],
  limiter: [
    { outer: "12.5% 8.33%", inner: "-4.17% -3.75%", src: v12 },
    { outer: "20.83% 25% 56.25% 56.25%", inner: "-13.64% -16.67%", src: v13 },
    { outer: "43.75%", inner: "-25%", src: v14 },
  ],
  "focus-mode": [
    { outer: "16.67% 20.83% 16.66% 12.5%", inner: "-4.69%", src: v15 },
    { outer: "47.92% 52.08% 47.91% 43.75%", inner: "-75%", src: v16 },
    { outer: "8.34% 54.17% 74.99% 45.83%", inner: "-18.75% -0.5px", src: v17 },
    { outer: "75.01% 54.17% 8.32% 45.83%", inner: "-18.75% -0.5px", src: v18 },
    { outer: "50% 12.5% 49.99% 70.83%", inner: "-0.5px -18.75%", src: v19 },
    { outer: "50.01% 79.17% 49.99% 4.17%", inner: "-0.5px -18.75%", src: v20 },
  ],
  insights: [
    { outer: "41.67% 29.17%", inner: "-18.75% -7.5%", src: v21 },
    { outer: "12.5%", inner: "-4.17%", src: v22 },
    { outer: "66.67% 8.33% 8.33% 66.67%", inner: "-12.5%", src: v23 },
  ],
};

export function NavIcon({ name }: { name: PageId }) {
  return (
    <span className="fl-nav-icon">
      {ICON_LAYERS[name].map((layer, i) => (
        <span key={i} className="fl-nav-icon__layer" style={{ inset: layer.outer }}>
          <span
            className="fl-nav-icon__leaf"
            style={{ inset: layer.inner }}
            dangerouslySetInnerHTML={{ __html: layer.src }}
          />
        </span>
      ))}
    </span>
  );
}
