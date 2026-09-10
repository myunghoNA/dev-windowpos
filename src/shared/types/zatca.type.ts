
/**
 * @description ZATCA API 개별 에러 객체 구조
 */
type ZatcaApiError = {
  code: string;
  message: string;
};


/**
 * @description compliance CSID (CCSID) API 성공 응답 구조 
 */
export type ComplianceSuccessResponse = {
  requestID: number;
  dispositionMessage: string;  
  binarySecurityToken: string;
  secret: string;
}

/**
 * @description compliance CSID 타입 (성공 또는 실패)
 */
export type ComplianceResponse = {
  isSuccess : boolean;
  resultMessage?: ComplianceSuccessResponse;
  errorMessage?: ZatcaApiError[] | string;
}
