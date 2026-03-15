import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@toss/tds-mobile';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] 에러 발생:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '0 20px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 20, fontWeight: 700, color: '#191F28', marginBottom: 8 }}>
            문제가 생겼어요
          </p>
          <p style={{ fontSize: 15, color: '#6B7684', marginBottom: 24 }}>
            잠시 후 다시 시도해주세요
          </p>
          <Button color="primary" variant="fill" size="large" onClick={this.handleRetry}>
            다시 시도하기
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
