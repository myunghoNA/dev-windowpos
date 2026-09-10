import axios from 'axios';
//# Import Service
import { sendLogToRenderer } from '@main/services';
import { submitComplianceInvoice } from '@main/zatca/api.zatca';
import { buildInvoiceXml } from '@main/zatca/build-invoce.zatca';
import { buildQrTlvBase64 } from '@main/zatca/build-qr.zatca';
import {
    buildSignatureExtensionXml,
    computeInvoiceHash,
    getCertSignatureDer,
    getPublicKeyPointFromCert,
    signHashDer,
} from '@main/zatca/signature.zatca';

//# Import Type
import { ComplianceResponse } from '@shared/types';


const LOG_TITLE = '[MAIN-API.ZATCA]'; 
const API_URL   = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';


/**
 * @name requestCsid
 * @description 단계 1: Compliance CSID 요청
 *              CSR을 전송해서 Compliance CSID + Secret 발급
 */
export async function requestCsid(csrData: string, otpData: string, lang: 'en' | 'ar'): Promise<ComplianceResponse> {

    try {
        const response = await axios.post(API_URL + '/compliance', {
            csr: csrData,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept-Version': 'V2',
                'Accept-Language': lang,
                'OTP': otpData,
            },
        });

        return { 
            isSuccess: true, 
            resultMessage: response.data, 
        };

    } catch (error:any) {            
            const errorMessage:string = error instanceof Error ? error.message : String(error);
            sendLogToRenderer(LOG_TITLE, errorMessage);
        return { 
            isSuccess: false, 
            errorMessage: errorMessage, 
        };
    }
}


/**
 * @name requestInvoiceCheck
 * @description 단계 2: Compliance Invoice 검증
 *              Production CSID 발급 전 인보이스 유효성 검사
 * @param {string} signedXml - 서명이 완료된 XML 문자열
 * @param {string} invoiceHash - XML의 해시값
 * @param {string} token - 온보딩 시 발급받은 BinarySecurityToken
 */
export async function requestInvoiceCheck(encodedInvoice, invoiceHash, token): Promise<ComplianceResponse> {

    try {
        const response = await axios.post(API_URL + '/compliance/invoices', {
            invoiceHash: invoiceHash,
            uuid: '8d487816-70b8-4ade-a618-9d620b73814a', // 고유 UUID 필수
            invoice: encodedInvoice,
        }, {
            headers: {
                'Authorization': `Basic ${token}`, // 위에서 받은 토큰 사용
                'Content-Type': 'application/json',
                'Accept-Version': 'V2',
                'Accept-Language': 'en',
            },
        });

         sendLogToRenderer(LOG_TITLE, response.data);

        return { 
            isSuccess: true, 
            resultMessage: response.data, 
        };

    } catch (error:any) {            
            const errorMessage:string = error instanceof Error ? error.message : String(error);
            sendLogToRenderer(LOG_TITLE, errorMessage);
        return { 
            isSuccess: false, 
            errorMessage: errorMessage, 
        };
    }
}



function toCertPem(binarySecurityToken) {
  // binarySecurityToken은 base64(base64(DER)) 형태로 옵니다.
  // 한 번 디코딩하면 순수 base64 텍스트가 나오고, 그걸 64자 단위로 잘라 PEM body
  const clean = binarySecurityToken.replace(/\s/g, '');
  const onceDecoded:any = Buffer.from(clean, 'base64').toString('utf8');
  const lines = onceDecoded.match(/.{1,64}/g).join('\n');
  return `-----BEGIN CERTIFICATE-----\n${lines}\n-----END CERTIFICATE-----`;
}


//#######################################################################################################################################
/** 추후 추가작업예정 */
export async function complianceInvoice(certData:any, invoiceData:any): Promise<any> {

    console.log('certData :::: ', certData);
    console.log('invoiceData :::: ', invoiceData);
    const {
        binarySecurityToken, 
        secret,
        privateKeyPem,
    } = certData;

    const CERTIFICATE_PEM = toCertPem(binarySecurityToken);

    // 1) 빈 QR / 빈 서명으로 XML 초안 생성
    const draftXml = buildInvoiceXml(invoiceData);
    console.log('::::::::: 1) 빈 QR / 빈 서명으로 XML 초안 생성 :::::::::\n ', draftXml);

   // 2) invoiceHash 계산 (ZATCA 가이드 Step1: UBLExtensions+Signature 제거 -> XML선언 제거 -> C14N11 -> SHA256 -> base64)
   const { hashBuffer, hashBase64 } = computeInvoiceHash(draftXml);

   console.log('::::::::: 2)  hashBase64 :::::::::\n ', hashBase64);
   console.log('::::::::: 2)  hashBuffer :::::::::\n ', hashBuffer);

   // 3) 서명 (Step2: invoiceHash raw bytes를 ECDSA로 서명)
   const signatureDer = signHashDer(hashBuffer, privateKeyPem);
   const signatureB64 = signatureDer.toString('base64');

   console.log('::::::::: 3)  signatureB64 :::::::::\n ', signatureB64);

   // 4) QR 생성용 인증서 공개키/서명값 추출
   let publicKeyDer, certSignatureDer;
   try {
     publicKeyDer = getPublicKeyPointFromCert(CERTIFICATE_PEM);
     certSignatureDer = getCertSignatureDer(CERTIFICATE_PEM);
   } catch (e:any) {
     throw new Error(
       `인증서 파싱 실패: config.js 의 CERTIFICATE_PEM 이 실제 CCSID 발급 인증서인지 확인하세요. (${e.message})`,
     );
   }

    console.log('::::::::: 4)  publicKey bytes:', publicKeyDer.length);
	console.log('::::::::: 4)  publicKey b64 length:', publicKeyDer.toString('base64').length);
	console.log('::::::::: 4)  certSignature bytes:', certSignatureDer.length);
	console.log('::::::::: 4)  certSignature b64 length:', certSignatureDer.toString('base64').length);

	console.log('::::::::: 4)  publicKey first byte:', publicKeyDer[0].toString(16));
	console.log('::::::::: 4)  publicKey QR bytes:', publicKeyDer[0] === 0x04 ? publicKeyDer.length - 1 : publicKeyDer.length);

    const totalAmount = invoiceData.lines.reduce((s, l) => s + l.qty * l.unitPrice * (1 + l.vatPercent / 100), 0);
    const vatAmount = invoiceData.lines.reduce((s, l) => s + l.qty * l.unitPrice * (l.vatPercent / 100), 0);

    const qrB64 = buildQrTlvBase64({
        sellerName: invoiceData.seller.name,
        vatNumber: invoiceData.seller.vatNumber,
        timestamp: `${invoiceData.issueDate}T${invoiceData.issueTime}Z`,
        invoiceTotal: totalAmount.toFixed(2),
        vatTotal: vatAmount.toFixed(2),
        invoiceHashB64: hashBase64,
        signatureB64,
        publicKeyDer,
        certSignatureDer,
    });

    console.log('::::::::: 4)  qrB64:', qrB64);

    // 5) XAdES 서명 확장 XML 조립 (Step3~5: CertDigest, SignedProperties, SignedProperties Hash  함수 내부에서 처리)
    const nowIso = new Date().toISOString();
    const signatureExtensionXml = buildSignatureExtensionXml({
        signatureB64,
        certPem: CERTIFICATE_PEM,
        invoiceHashB64: hashBase64,
        signingTimeIso: nowIso,
    });

    console.log('::::::::: 5) XAdES 서명 확장 XML 조립 :\n', signatureExtensionXml);

    // 6) placeholder 치환하여 최종 XML 완성
    const finalXml = draftXml
                    .replace('<PLACEHOLDER_SIGNATURE_EXTENSION/>', signatureExtensionXml)
                    .replace('PLACEHOLDER_QR', qrB64);

  console.log('::::::::: 6) 최종 XML ::\n', finalXml); 

  const invoiceXmlBase64 = Buffer.from(finalXml, 'utf8').toString('base64');

  console.log('::::::::: 6) 최종 invoiceHash:', hashBase64);
  console.log('::::::::: 6) 최종 uuid:', invoiceData.uuid);
  console.log('::::::::: 6) 최종 XML 길이(base64):', invoiceXmlBase64.length);

  // 7) /compliance/invoices 호출
  const result = await submitComplianceInvoice({
    invoiceHashB64: hashBase64,
    uuid: invoiceData.uuid,
    invoiceXmlBase64: invoiceXmlBase64,
    binarySecurityToken: binarySecurityToken,
    secret: secret,
  });

  console.log('\n::::::::: 7) ZATCA 응답:');
  console.log(JSON.stringify(result, null, 2));

  const finalResult = {
    ...result,
    currentInvoiceHash: hashBase64, // pih 값으로 활용
  };

  return finalResult;
}


