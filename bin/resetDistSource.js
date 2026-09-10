const fs = require('fs');
const { join } = require('path');

/**
 * @name resetDistSource
 * @description 차기 컴파일(Vite/tsc) 과정에서 구버전 캐시나 파일 파편이 엉키지 않도록,
 *              기존 dist/source 폴더 및 캐시 삭제처리
 */
function resetDistSource() {
  const targetDir = join(process.cwd(), 'dist/source');

  try {
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      console.log('🧹 [Clean] 기존 dist/source 폴더 및 캐시 삭제 완료.');
    } else {
      console.log(
        '✨ [Clean] 삭제할 기존 dist/source 폴더가 없습니다. 패스합니다.',
      );
    }

    fs.mkdirSync(targetDir, { recursive: true });
    console.log(
      '📁 [Ready] 새로운 dist/source 빈 폴더 생성 성공. 빌드 준비 완료.',
    );
  } catch (err) {
    console.error('❌ [Error] 폴더 초기화 중 오류 발생:');
    console.error(`👉 원인: ${err.message}`);
    console.error(
      '💡 팁: 일렉트론 앱이 완전히 꺼졌는지, 혹은 VS Code가 해당 폴더의 파일을 열고 있는지 확인해보세요.',
    );
  }
}

resetDistSource();
