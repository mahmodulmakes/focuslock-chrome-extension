// FEATURE: Block Sites — per-category icons (exported from Figma)
import socialMedia from "./category-icons/social-media.svg";
import adultSites from "./category-icons/adult-sites.svg";
import shoppingSites from "./category-icons/shopping-sites.svg";
import gambling from "./category-icons/gambling.svg";
import news from "./category-icons/news.svg";

const CATEGORY_ICONS: Record<string, string> = {
  "social-media": socialMedia,
  "adult-sites": adultSites,
  "shopping-sites": shoppingSites,
  gambling: gambling,
  news: news,
};

export function CategoryIcon({ categoryId }: { categoryId: string }) {
  const src = CATEGORY_ICONS[categoryId];
  if (!src) return null;
  return <img src={src} width={28} height={28} alt="" className="fl-card__icon" />;
}
