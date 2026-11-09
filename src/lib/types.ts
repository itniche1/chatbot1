/* Shapes observed in the existing API. Fields are optional where the backend may omit them. */

export type User = {
  id: string;
  name?: string;
  email: string;
  role?: "admin" | "user" | string;
  plan_id?: string | null;
  trial_ends_at?: string | null;
  is_email_verified?: boolean;
};

export type PlanFeatures = {
  max_chatbots: number;
  max_messages: number;
  max_kb_size_bytes: number;
  max_kb_files: number;
  max_domains: number;
  can_remove_branding: boolean;
  can_use_crawler: boolean;
  can_export_chats: boolean;
  can_use_dark_mode: boolean;
};

export type Plan = {
  id: string;
  slug: string;
  name: string;
  price_monthly: number;
  is_trial?: boolean;
  is_public?: boolean;
  trial_days?: number;
  features: PlanFeatures;
};

export type MeFeatures = {
  features: PlanFeatures;
  usage: { messages: number; chatbots: number; [k: string]: number };
  [k: string]: unknown;
};

export type Behavior = {
  welcome_message?: string;
  starter_questions?: string[];
  proactive_message?: string | null;
  proactive_delay_seconds?: number;
  require_lead?: boolean;
  tagline?: string | null;
  system_prompt?: string;
  company_name?: string | null;
  agent_role?: string;
  tone?: string;
  response_length?: string;
  only_answer_from_kb?: boolean;
  company_profile?: string | null;
  fallback_message?: string;
  escalation_enabled?: boolean;
  escalation_email?: string | null;
  escalation_trigger_phrases?: string[];
  send_transcript_to_visitor?: boolean;
  show_branding?: boolean;
  [k: string]: unknown;
};

export type Appearance = {
  primary_color?: string;
  accent_color?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  user_bubble_color?: string | null;
  bot_bubble_color?: string | null;
  theme?: "light" | "dark";
  position?: "bottom-right" | "bottom-left";
  bubble_label?: string | null;
  logo_url?: string | null;
  launcher_icon_url?: string | null;
  font_family?: string | null;
  border_radius?: number | null;
  shadow_intensity?: number | null;
  chat_width?: number | null;
  chat_height?: number | null;
  show_avatar?: boolean;
  [k: string]: unknown;
};

export type KbSettings = {
  retrieval_top_k?: number;
  retrieval_threshold?: number;
  chunk_size?: number;
  chunk_overlap?: number;
};

export type Chatbot = {
  id: string;
  public_id: string;
  name: string;
  is_active: boolean;
  behavior: Behavior;
  appearance: Appearance;
  allowed_domains?: string[];
  kb_settings?: KbSettings;
  created_at?: string;
};

export type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string | null;
};

export type Lead = {
  id: string;
  name?: string;
  email: string;
  phone?: string | null;
  status?: "new" | "contacted" | "qualified" | "closed";
  contact_count?: number;
  created_at?: string;
  last_seen_at?: string;
};

export type Conversation = {
  id: string;
  title?: string;
  message_count?: number;
  last_message_at?: string;
  started_at?: string;
  created_at?: string;
  page_url?: string;
  status?: string;
  lead?: Lead | null;
};
