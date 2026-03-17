import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || "Unexpected rendering error",
    };
  }

  componentDidCatch(error: Error): void {
    console.error("[PAGE-ERROR-BOUNDARY]", error);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-card/80 p-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-black text-foreground">
            {this.props.pageName ? `${this.props.pageName} page error` : "Page error"}
          </h2>
          <p className="text-sm text-muted-foreground">
            We hit an unexpected error while rendering this page.
          </p>
          <p className="text-xs text-muted-foreground/80 break-words">{this.state.message}</p>
          <Button onClick={this.handleReload} className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}
