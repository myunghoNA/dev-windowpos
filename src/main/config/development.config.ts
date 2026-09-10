import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer';


const LOG_TITLE = '[DEVELOPMENT.CONFIG]';

/**
 * @name inDevelopment
 * @description 개발 환경 전용 크롬 확장 프로그램(React & Redux DevTools) 처리
 */
export async function inDevelopment(): Promise<void> {
  
  try {
    await installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS]);
    console.log(`${LOG_TITLE} EXTENSION`, 'React & Redux DevTools 확장 프로그램 빌드 주입 성공.');
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG_TITLE} EXTENSION_ERROR`, `크롬 확장 도구 설치 실패 : ${errorMsg}`);
  }
}
