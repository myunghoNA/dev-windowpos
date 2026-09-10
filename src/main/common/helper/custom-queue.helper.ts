
/**
 * @class CustomQueue
 * @description Serial Printer 출력을 위한 선입선출(FIFO) 큐 클래스
 * @template T 프린터로 보낼 데이터 구조 타입 (기본값: string | Buffer)
 */
class CustomQueue<T = string | Buffer> {

    /** @description 실제 프린터 출력 대기열 데이터를 담는 내부 배열 */
    private dataStore: T[];

    constructor() {
        this.dataStore = [];
    }

    /**
     * @name clear
     * @description 대기열 전체 삭제
     * @returns {void}
     */
    clear(): T | void {
        this.dataStore = [];
    }

    /**
     * @name enqueue
     * @description 출력 데이터를 큐의 맨 뒤에 추가 
     * @param {T} element - 출력할 텍스트 스트링 또는 ESC/POS 프린트 이진 커맨드 Buffer 데이터
     */
    enqueue(element: T): void {
        this.dataStore.push(element);
    }

    /**
     * @name dequeue
     * @description 가장 오래된 출력 데이터를 꺼내고 대기열에서 제거
     * @returns {T | undefined} 꺼내진 상위 컨텐츠 데이터, 큐가 비어있으면 undefined 반환
     */
    dequeue(): T | undefined {
        return this.dataStore.shift();
    }

    /**
     * @name front
     * @description 다음에 출력될 타겟 데이터를 대기열에서 제거하지 않고 사전 확인 
     * @returns {T | undefined}
     */
    front(): T | undefined {
        return this.dataStore[0];
    }

    /**
     * @name back
     * @description 가장 마지막(최근)에 추가된 출력 대기 데이터를 확인
     * @returns {T | undefined}
     */
    back(): T | undefined {
        return this.dataStore[this.dataStore.length - 1];
    }

    /**
     * @name toString
     * @description 전체 대기열 상태를 개행 문자 단위의 문자열로 변환 (디버깅 또는 파일 로그 출력용)
     * @returns {string}
     */
    toString(): string {
        let retStr = '';
        for (let i = 0; i < this.dataStore.length; i++) {
            retStr = retStr + this.dataStore[i] + '\n';
        }
        return retStr;
    }

    /**
     * @name empty
     * @description 대기열이 비어있는지 확인 (프린터가 유휴(Idle) 상태인지 판단할 때 사용)
     * @returns {boolean}
     */
    empty(): boolean {
        return this.dataStore.length === 0;
    }

    /**
     * @name length
     * @description 현재 대기열의 미출력 인쇄물들의 총 개수 확인
     * @returns {number}
     */
    length(): number {
        return this.dataStore.length;
    }

    /**
     * @name getAllItems
     * @description 현재 대기열 전체 목록확인
     * @returns {T[]}
     */
    getAllItems(): T[] {
        return [...this.dataStore];
    }
}

const customQueue = new CustomQueue<string | Buffer>();
export { customQueue };

