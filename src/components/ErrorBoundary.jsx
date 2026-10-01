import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App error boundary caught:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white p-6 z-[100]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-white/50 mb-6 text-center max-w-sm">
            An unexpected error occurred. Try reloading the page.
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-semibold hover:opacity-90 transition"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}