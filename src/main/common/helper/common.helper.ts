

 /**
 * @name isNewerVersion
 * @description 서버의 신규 패치 빌드가 로컬 앱 버전보다 높은지 정밀 비교 판정
 */
export function isNewerVersion (latest: string, current: string): boolean  {
    const cleanLatest  = (latest || '0.0.0').split('.').map(Number);
    const cleanCurrent = (current || '0.0.0').split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        const lNum = cleanLatest[i] || 0;
        const cNum = cleanCurrent[i] || 0;

        if (lNum > cNum) return true;
        if (lNum < cNum) return false;
    }
    
    return false;
}


 /**
 * @name wrapRTL
 * @description RTL 언어(Right-to-Left) 출력 시 글자 시퀀스가 뒤집히는 UI 현상을 양방향 유니코드 제어문으로 격리
 */
export function wrapRTL (text: string): string  {
    if (text === null || text === undefined) return '';
    const str = String(text);
    if (str.length === 0) return '';
    
    return `\u202B${str}\u202C`;
}