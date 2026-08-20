// Shared brand badge — used by Feed Blocks and Reel Blocks, both need the same per-platform
// icon. Facebook/Instagram/YouTube/LinkedIn marks are exported from the Figma file; Reddit and
// X have no exported mark there, so they fall back to a lettermark — flagged as a gap.
import "./platform-icon.css";
import facebookGlyph from "./platform-icons/facebook-glyph.svg?raw";
import instagramGlyph from "./platform-icons/instagram-glyph.svg?raw";
import linkedinGlyph from "./platform-icons/linkedin-glyph.svg?raw";
import youtubeGlyph from "./platform-icons/youtube-glyph.svg?raw";

export type BrandPlatformId = "facebook" | "instagram" | "youtube" | "reddit" | "twitter" | "linkedin";

const BADGE_COLOR: Record<BrandPlatformId, string> = {
  facebook: "#1877F2",
  instagram: "#F00073",
  youtube: "#FF0000",
  reddit: "#FF4500",
  twitter: "#000000",
  linkedin: "#2867B2",
};

const GLYPHS: Partial<Record<BrandPlatformId, string>> = {
  facebook: facebookGlyph,
  instagram: instagramGlyph,
  youtube: youtubeGlyph,
  linkedin: linkedinGlyph,
};

const LETTERMARKS: Partial<Record<BrandPlatformId, string>> = {
  reddit: "R",
  twitter: "X",
};

export interface PlatformIconProps {
  platformId: BrandPlatformId;
  /** Defaults to 36px (the Feed Blocks/Reel Blocks list-row size). The popup reuses this same
   *  component at other sizes (64px circular, 42px square) rather than duplicating it. */
  size?: number;
  shape?: "square" | "circle";
}

export function PlatformIcon({ platformId, size = 36, shape = "square" }: PlatformIconProps) {
  const glyph = GLYPHS[platformId];
  const glyphSize = Math.round(size * 0.5);
  return (
    <div
      className="fl-platform-icon"
      style={{
        background: BADGE_COLOR[platformId],
        width: size,
        height: size,
        borderRadius: shape === "circle" ? "50%" : "10px",
      }}
    >
      {glyph ? (
        <span
          className="fl-platform-icon__glyph"
          style={{ width: glyphSize, height: glyphSize }}
          dangerouslySetInnerHTML={{ __html: glyph }}
        />
      ) : (
        <span className="fl-platform-icon__letter" style={{ fontSize: Math.round(size * 0.44) }}>
          {LETTERMARKS[platformId]}
        </span>
      )}
    </div>
  );
}
