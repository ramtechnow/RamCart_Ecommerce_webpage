import { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, Home, ShieldAlert } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin Console Runtime Error Caught:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            minHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "var(--bg-primary, #0c0c0e)",
            color: "var(--text-primary, #ffffff)"
          }}
        >
          <div 
            style={{
              maxWidth: "520px",
              width: "100%",
              backgroundColor: "var(--bg-secondary, #18181b)",
              border: "1px solid var(--border-color, #27272a)",
              borderRadius: "16px",
              padding: "32px 24px",
              textAlign: "center",
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)"
            }}
          >
            <div 
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px"
              }}
            >
              <ShieldAlert size={30} />
            </div>

            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "8px" }}>
              Admin Console Encountered an Issue
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #a1a1aa)", marginBottom: "20px" }}>
              A client-side script error occurred while rendering the admin console. Your database and records remain completely safe.
            </p>

            {this.state.error?.message && (
              <div 
                style={{
                  backgroundColor: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "#f87171",
                  textAlign: "left",
                  marginBottom: "24px",
                  overflowX: "auto"
                }}
              >
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid #3f3f46"
                }}
              >
                <RefreshCw size={15} />
                Reload Console
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  backgroundColor: "transparent",
                  color: "var(--text-primary, #ffffff)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid var(--border-color, #27272a)"
                }}
              >
                <Home size={15} />
                Return to Store
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
