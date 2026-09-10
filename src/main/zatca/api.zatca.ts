import axios from 'axios';
//# Import Service


// TODO: ZATCA 내용 구현 상세화 
// NOTE: ZATCA API 응답 스펙 확인 필요
const ZATCA_BASE_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';
const COMPLIANCE_INVOICES_PATH = '/compliance/invoices';


function buildAuthHeader(binarySecurityToken , secret) {
  const token = Buffer.from(`${binarySecurityToken}:${secret}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * @param {object} params
 *  {
 *    invoiceHashB64: string,
 *    uuid: string,
 *    invoiceXmlBase64: string,
 *    binarySecurityToken?: string, // 없으면 config 기본값 사용
 *    secret?: string,
 *  }
 */
export async function submitComplianceInvoice(params) {
  const {
    invoiceHashB64, uuid, invoiceXmlBase64,
    binarySecurityToken, secret,
  } = params;

  const authHeader = buildAuthHeader(binarySecurityToken, secret);

  const body = {
    invoiceHash: invoiceHashB64,
    uuid,
    invoice: invoiceXmlBase64,
  };

  console.log('body ::::', body);

  console.log('binarySecurityToken ::::', binarySecurityToken);
  console.log('secret ::::', secret);
  console.log('authHeader ::::', authHeader);

  const url = `${ZATCA_BASE_URL}${COMPLIANCE_INVOICES_PATH}`;

  try {
    const res = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
        'Accept-Version': 'V2',
        'Accept-Language': 'en',
      },
      timeout: 15000,
    });

    return { isSuccess: true, status: res.status, data: res.data };
  } catch (err:any) {
     console.log('###### res ###### ', err.response);
    if (err.response) {
      // ZATCA는 4xx에도 상세 에러 배열을 body에 담아 내려줌 (validationResults 등)
      return { isSuccess: false, status: err.response.status, data: err.response.data };
    }
    throw err;
  }
}
