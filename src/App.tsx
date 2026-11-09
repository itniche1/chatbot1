import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./components/ui/toast";
import { FullPageLoader } from "./components/app/FullPageLoader";
import { ErrorBoundary } from "./components/app/ErrorBoundary";

// Route-level code splitting keeps the embeddable widget light on customer websites.
const Landing = lazy(() => import("./pages/public/Landing"));
const Legal = lazy(() => import("./pages/public/Legal"));
const Login = lazy(() => import("./pages/public/Auth").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("./pages/public/Auth").then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import("./pages/public/Auth").then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/public/Auth").then((m) => ({ default: m.ResetPassword })));
const Widget = lazy(() => import("./pages/widget/Widget"));

const AppLayout = lazy(() => import("./layouts/AppLayout"));
const Assistant = lazy(() => import("./pages/app/Assistant"));
const Overview = lazy(() => import("./pages/app/Overview"));
const Chatbots = lazy(() => import("./pages/app/Chatbots"));
const ChatbotDetail = lazy(() => import("./pages/app/chatbot/ChatbotDetail"));
const Conversations = lazy(() => import("./pages/app/Conversations"));
const Leads = lazy(() => import("./pages/app/Leads"));
const Knowledge = lazy(() => import("./pages/app/Knowledge"));
const Analytics = lazy(() => import("./pages/app/Analytics"));
const Integrations = lazy(() => import("./pages/app/Integrations"));
const Billing = lazy(() => import("./pages/app/Billing"));
const Settings = lazy(() => import("./pages/app/Settings"));
const Help = lazy(() => import("./pages/app/Help"));

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const admin = () => import("./pages/admin/AdminPages");
const AdminOverview = lazy(() => admin().then((m) => ({ default: m.AdminOverview })));
const AdminUsers = lazy(() => admin().then((m) => ({ default: m.AdminUsers })));
const AdminChatbots = lazy(() => admin().then((m) => ({ default: m.AdminChatbots })));
const AdminConversations = lazy(() => admin().then((m) => ({ default: m.AdminConversations })));
const AdminUsage = lazy(() => admin().then((m) => ({ default: m.AdminUsage })));
const AdminAnnouncements = lazy(() => admin().then((m) => ({ default: m.AdminAnnouncements })));
const AdminAudit = lazy(() => admin().then((m) => ({ default: m.AdminAudit })));

/** Page-level suspense inside the shell, so navigation keeps the sidebar visible. */
function Page({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <Suspense fallback={<div className="page"><span className="skeleton skeleton--title" /><span className="skeleton skeleton--block" style={{ marginTop: 24 }} /></div>}>
      <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<FullPageLoader label="Loading" />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/privacy-policy" element={<Legal type="privacy" />} />
                <Route path="/terms-of-use" element={<Legal type="terms" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/widget/:publicId" element={<Suspense fallback={null}><Widget /></Suspense>} />

                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Page><Assistant /></Page>} />
                  <Route path="overview" element={<Page><Overview /></Page>} />
                  <Route path="chatbots" element={<Page><Chatbots /></Page>} />
                  <Route path="chatbots/:id" element={<Page><ChatbotDetail /></Page>} />
                  <Route path="conversations" element={<Page><Conversations /></Page>} />
                  <Route path="leads" element={<Page><Leads /></Page>} />
                  <Route path="knowledge" element={<Page><Knowledge /></Page>} />
                  <Route path="analytics" element={<Page><Analytics /></Page>} />
                  <Route path="integrations" element={<Page><Integrations /></Page>} />
                  <Route path="billing" element={<Page><Billing /></Page>} />
                  <Route path="settings" element={<Page><Settings /></Page>} />
                  <Route path="help" element={<Page><Help /></Page>} />
                </Route>

                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Page><AdminOverview /></Page>} />
                  <Route path="users" element={<Page><AdminUsers /></Page>} />
                  <Route path="chatbots" element={<Page><AdminChatbots /></Page>} />
                  <Route path="conversations" element={<Page><AdminConversations /></Page>} />
                  <Route path="usage" element={<Page><AdminUsage /></Page>} />
                  <Route path="announcements" element={<Page><AdminAnnouncements /></Page>} />
                  <Route path="audit-logs" element={<Page><AdminAudit /></Page>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
