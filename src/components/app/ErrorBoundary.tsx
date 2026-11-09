import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

type State = { error: Error | null };

/** Catches render errors (and failed lazy chunk loads after a deploy) with a friendly recovery screen. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  /** Clear the error when the user navigates elsewhere, so one broken page doesn't block the whole app. */
  componentDidUpdate(prev: { resetKey?: string }) { if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null }); }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("UI error:", error, info.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    const chunk = /Loading chunk|dynamically imported module|Importing a module script failed/i.test(this.state.error.message);
    return (
      <div className="page" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <div className="empty">
          <div className="empty__icon"><AlertTriangle /></div>
          <h3>{chunk ? "A new version is available" : "Something went wrong"}</h3>
          <p>{chunk ? "Reload to get the latest version of ChatBOT." : "This part of the page couldn't be displayed. Reloading usually fixes it."}</p>
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}><RotateCw />Reload</button>
        </div>
      </div>
    );
  }
}
