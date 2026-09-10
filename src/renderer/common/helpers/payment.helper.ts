/**
 * @name KSA_VAT_RATE
 * @description 사우디아라비아 표준 부가세율 (15%)
 */
export const KSA_VAT_RATE = 0.15;

/**
 * @name calculateVat
 * @description 공급가액에서 부가세액(15%) 계산
 * @param {number} netAmount - 부가세 제외 금액 (공급가액)
 * @returns {number} 부가세액
 */
export function calculateVat(netAmount: number): number {
    if (!netAmount || isNaN(netAmount)) return 0;
    if (netAmount < 0) return 0;
    // 소수점 2자리까지 반올림 (사우디 리얄 기준)
    return Math.round(netAmount * KSA_VAT_RATE * 100) / 100;
}

/**
 * @name getVatWithTotalAmt
 * @description 합계금액(VAT 포함)에서 부가세액만 추출
 * @param {number} totalAmount - 부가세 포함 총액
 * @returns {number} 추출된 부가세액
 * @formula VAT = Total - (Total / 1.15)
 */
export function getVatAmount(totalAmount: number): number {
    if (!totalAmount || isNaN(totalAmount)) return 0;
    const netAmount = totalAmount / (1 + KSA_VAT_RATE);
    return Math.round((totalAmount - netAmount) * 100) / 100;
}

/**
 * @name getTotalAmount
 * @description 공급가액을 넣으면 VAT가 포함된 총액 반환
 */
export function getTotalAmount(netAmount: number): number {
    const vat = calculateVat(netAmount);
    return netAmount + vat;
}