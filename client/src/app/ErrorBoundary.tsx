import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">משהו השתבש</h1>
            <p className="text-gray-600 mb-6">אירעה שגיאה בלתי צפויה. נסה לרענן את הדף.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              רענן דף
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
