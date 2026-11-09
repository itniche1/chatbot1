import { useState } from "react";
import { CloudUpload } from "lucide-react";
import { readDraft, useDraftAutosave } from "../../../lib/drafts";
import { Button, ColorField, Field, Input, Segmented, SwitchRow } from "../../../components/ui";
import { FormSection, SaveBar } from "./FormSection";
import type { TabProps } from "./ChatbotDetail";

type AppearanceDraft = {
  color?: string; accent?: string; bg?: string; text?: string; userBubble?: string; botBubble?: string; theme?: string; position?: string;
  bubbleLabel?: string; logoUrl?: string; launcherIcon?: string; fontFamily?: string; radius?: string | number; shadow?: string | number;
  width?: string | number; height?: string | number; showAvatar?: boolean;
};
const str = (v: unknown) => (v == null ? "" : String(v));

export default function AppearanceTab({ bot, save, saving }: TabProps) {
  const d = (readDraft(bot.id)?.appearance || {}) as AppearanceDraft;
  const a = bot.appearance || {};
  const [color, setColor] = useState(d.color ?? a.primary_color ?? "");
  const [accent, setAccent] = useState(d.accent ?? a.accent_color ?? "");
  const [bg, setBg] = useState(d.bg ?? a.background_color ?? "");
  const [text, setText] = useState(d.text ?? a.text_color ?? "");
  const [userBubble, setUserBubble] = useState(d.userBubble ?? a.user_bubble_color ?? "");
  const [botBubble, setBotBubble] = useState(d.botBubble ?? a.bot_bubble_color ?? "");
  const [theme, setTheme] = useState<string>(d.theme ?? a.theme ?? "light");
  const [position, setPosition] = useState<string>(d.position ?? a.position ?? "bottom-right");
  const [bubbleLabel, setBubbleLabel] = useState(d.bubbleLabel ?? a.bubble_label ?? "");
  const [logoUrl, setLogoUrl] = useState(d.logoUrl ?? a.logo_url ?? "");
  const [launcherIcon, setLauncherIcon] = useState(d.launcherIcon ?? a.launcher_icon_url ?? "");
  const [fontFamily, setFontFamily] = useState(d.fontFamily ?? a.font_family ?? "");
  const [radius, setRadius] = useState(str(d.radius ?? a.border_radius ?? ""));
  const [shadow, setShadow] = useState(str(d.shadow ?? a.shadow_intensity ?? 2));
  const [width, setWidth] = useState(str(d.width ?? a.chat_width ?? ""));
  const [height, setHeight] = useState(str(d.height ?? a.chat_height ?? ""));
  const [showAvatar, setShowAvatar] = useState(d.showAvatar ?? a.show_avatar ?? true);

  useDraftAutosave(bot.id, "appearance", { color, accent, bg, text, userBubble, botBubble, theme, position, bubbleLabel, logoUrl, launcherIcon, fontFamily, radius, shadow, width, height, showAvatar });

  const submit = () => save({
    appearance: {
      ...bot.appearance,
      primary_color: color,
      accent_color: accent || null,
      background_color: bg || null,
      text_color: text || null,
      user_bubble_color: userBubble || null,
      bot_bubble_color: botBubble || null,
      theme: theme as "light" | "dark",
      position: position as "bottom-right" | "bottom-left",
      bubble_label: bubbleLabel || null,
      logo_url: logoUrl || null,
      launcher_icon_url: launcherIcon || null,
      font_family: fontFamily || null,
      border_radius: radius === "" ? null : Number(radius),
      shadow_intensity: shadow === "" ? null : Number(shadow),
      chat_width: width ? Number(width) : null,
      chat_height: height ? Number(height) : null,
      show_avatar: showAvatar,
    },
  });

  return (
    <div>
      <FormSection title="Brand colours" description="Match the widget to your website. Leave optional colours blank to use sensible defaults.">
        <div className="grid-2">
          <Field label="Primary colour" hint="Header, send button, accents."><ColorField value={color} onChange={setColor} /></Field>
          <Field label="Accent colour" optional hint="Avatar and highlights. Blank = primary."><ColorField value={accent} onChange={setAccent} /></Field>
          <Field label="User bubble" optional hint="Visitor messages. Blank = primary."><ColorField value={userBubble} onChange={setUserBubble} /></Field>
          <Field label="Bot bubble" optional hint="Assistant messages. Blank = theme default."><ColorField value={botBubble} onChange={setBotBubble} /></Field>
          <Field label="Background" optional hint="Chat pane. Blank = theme default."><ColorField value={bg} onChange={setBg} /></Field>
          <Field label="Text colour" optional hint="Message text. Blank = theme default."><ColorField value={text} onChange={setText} /></Field>
        </div>
      </FormSection>

      <FormSection title="Layout" description="Theme, placement and size of the chat window.">
        <div className="grid-2">
          <Field label="Theme"><Segmented label="Theme" value={theme} onChange={setTheme} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} /></Field>
          <Field label="Position"><Segmented label="Position" value={position} onChange={setPosition} options={[{ value: "bottom-right", label: "Bottom right" }, { value: "bottom-left", label: "Bottom left" }]} /></Field>
          <Field label="Chat width (px)" htmlFor="ap-w" hint="Default 420 · min 320 · max 720"><Input id="ap-w" type="number" min={320} max={720} value={width} onChange={(e) => setWidth(e.target.value)} placeholder="420" /></Field>
          <Field label="Open height (px)" htmlFor="ap-h" hint="Default 640 · min 400 · max 900"><Input id="ap-h" type="number" min={400} max={900} value={height} onChange={(e) => setHeight(e.target.value)} placeholder="640" /></Field>
          <Field label="Corner radius (px)" htmlFor="ap-r" hint="0 = sharp · 24 = soft"><Input id="ap-r" type="number" min={0} max={32} value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="0" /></Field>
          <Field label="Shadow" htmlFor="ap-s" hint="0 = off · 4 = strongest"><Input id="ap-s" type="number" min={0} max={4} value={shadow} onChange={(e) => setShadow(e.target.value)} placeholder="2" /></Field>
        </div>
      </FormSection>

      <FormSection title="Brand assets" description="Logos, launcher and typography.">
        <div className="grid-2">
          <Field label="Logo URL" optional htmlFor="ap-logo" hint="PNG or SVG shown in the chat header."><Input id="ap-logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" /></Field>
          <Field label="Launcher icon URL" optional htmlFor="ap-li" hint="Replaces the default chat-bubble icon."><Input id="ap-li" value={launcherIcon} onChange={(e) => setLauncherIcon(e.target.value)} placeholder="https://…" /></Field>
          <Field label="Launcher label" optional htmlFor="ap-label" hint="Text beside the launcher icon. Empty = icon only."><Input id="ap-label" value={bubbleLabel} onChange={(e) => setBubbleLabel(e.target.value)} placeholder="Ask me anything" /></Field>
          <Field label="Font family" optional htmlFor="ap-font" hint="CSS font stack. Falls back to Lato / system."><Input id="ap-font" className="mono" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} placeholder={'"Inter", system-ui, sans-serif'} /></Field>
        </div>
        <SwitchRow title="Show avatar" description="Display the logo or bot initial beside each assistant message." checked={showAvatar} onChange={setShowAvatar} />
      </FormSection>

      <SaveBar>
        <span className="save-bar__note"><CloudUpload />Save to see changes in the live preview.</span>
        <Button onClick={submit} loading={saving}>{saving ? "Saving…" : "Save appearance"}</Button>
      </SaveBar>
    </div>
  );
}
