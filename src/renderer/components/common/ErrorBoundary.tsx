import React, { Component, ErrorInfo, ReactNode } from 'react';

//Import Helper
import { customLogger } from '@renderer/common/helpers/logger.helper';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // 에러가 발생하면 호출되어 state를 업데이트.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // 에러 정보를 로그로 남기거나 서버/메인 프로세스로 전송합니다.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    customLogger.error('[CRITICAL_RENDER_ERROR]', {
      message: error.message,
      stack: errorInfo.componentStack,
    });
  }

  // 다시 시도(새로고침) 로직
  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // "비상 화면"
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.title}>⚠️ 시스템 오류 발생</h1>
            <p style={styles.desc}>
              화면을 불러오는 중 예상치 못한 문제가 발생했습니다.<br />
              주문 및 결제 데이터는 안전하게 보관되어 있으니 안심하세요.
            </p>
            <pre style={styles.errorLog}>
              {this.state.error?.toString()}
            </pre>
            <button onClick={this.handleReset} style={styles.button}>
              앱 다시 시작하기
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 인라인 스타일
const styles: { [key: string]: React.CSSProperties } = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' },
  card: { padding: '40px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' },
  title: { fontSize: '24px', color: '#d32f2f', marginBottom: '15px' },
  desc: { fontSize: '16px', color: '#555', lineHeight: '1.5', marginBottom: '20px' },
  errorLog: { fontSize: '12px', color: '#888', backgroundColor: '#f1f1f1', padding: '10px', borderRadius: '5px', overflowX: 'auto', textAlign: 'left', marginBottom: '20px' },
  button: { padding: '12px 24px', fontSize: '16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};