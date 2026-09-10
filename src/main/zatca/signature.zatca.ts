
import { secp256k1 } from '@noble/curves/secp256k1';
import { DOMParser } from '@xmldom/xmldom';
import crypto from 'crypto';
import forge from 'node-forge';
//# Import Service
import {
  extractCertIssuerAndSerial,
  extractCertSignatureFromPem,
  extractPublicKeyPointFromCertPem,
  extractRawPrivateKeyFromPem,
} from '@main/zatca/pem-utils.zatca';

const { C14nCanonicalization } = require('xml-crypto');

/**
 * ZATCA 공식 가이드 5.2 Step 1 참고:
 * 1. UBLExtensions, Signature 태그를 XPath로 제거
 * 2. XML 선언 제거
 * 3. C14N11 표준으로 정규화
 * 4. SHA-256 해시
 * 5. base64 인코딩
 *
 * 우리 인보이스는 xml:base/xml:id를 쓰지 않으므로 C14N 1.0(xml-crypto의
 * C14nCanonicalization)과 C14N11의 출력이 바이트 단위로 동일함
 */
function removeByLocalName(doc, localName) {
  const nodes:any = [];
  const all = doc.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) nodes.push(all[i]);
  }
  nodes.forEach((n:any) => n.parentNode && n.parentNode.removeChild(n));
}

function removeQrAdditionalDocumentReference(doc) {
  const refs:any = [];
  const all = doc.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === 'AdditionalDocumentReference') {
      const idNode:any = Array.from(all[i].childNodes).find((c:any) => c.localName === 'ID');
      if (idNode && idNode.textContent === 'QR') {
        refs.push(all[i]);
      }
    }
  }
  refs.forEach((n) => n.parentNode && n.parentNode.removeChild(n));
}

function canonicalizeForHash(xml, { removeSignatureTag = true } = {}) {
  const noDecl = xml.replace(/^<\?xml[^>]*\?>\s*/, '');
  const doc = new DOMParser().parseFromString(noDecl, 'text/xml');
  removeByLocalName(doc, 'UBLExtensions');
  if (removeSignatureTag) removeByLocalName(doc, 'Signature');
  // QR 노드는 초안(placeholder) vs 최종 제출본(실값)에서 내용이 달라지므로
  // 해시 계산 대상에서 반드시 제외해야 draft/final 어느 시점에 계산해도 값이 일치함.
  removeQrAdditionalDocumentReference(doc);
  return new C14nCanonicalization().process(doc.documentElement);
}

export function computeInvoiceHash(xml) {
  const canonical = canonicalizeForHash(xml, { removeSignatureTag: true });
  const hash = crypto.createHash('sha256').update(canonical, 'utf8').digest();
  return { hashBuffer: hash, hashBase64: hash.toString('base64') };
}

/**
 * secp256k1 개인키(PEM, SEC1 또는 PKCS8)로 invoiceHash(raw bytes)에 ECDSA-SHA256 서명 (DER).
 * node:crypto 대신 @noble/curves 사용 -> Electron의 BoringSSL(UNKNOWN_GROUP 에러) 영향 안 받음.
 * ZATCA 가이드 Step 2: "Sign the generated invoice hash (not encoded)".
 */
export function signHashDer(hashBuffer, privateKeyPem) {
  const privKeyBytes = extractRawPrivateKeyFromPem(privateKeyPem);
  const sig = secp256k1.sign(hashBuffer, privKeyBytes, { lowS: true });
  return Buffer.from(sig.toDERRawBytes());
}

/** 서명 검증 (자체 확인용). publicKeyPoint: 65 bytes uncompressed (0x04||X||Y) */
export function verifySignatureDer(hashBuffer, signatureDer, publicKeyPoint) {
  return secp256k1.verify(signatureDer, hashBuffer, publicKeyPoint);
}

/** 인증서(PEM)에서 EC 공개키 raw point 추출 (QR tag 8용). */
export function getPublicKeyPointFromCert(certPem) {
  return extractPublicKeyPointFromCertPem(certPem);
}

/** 인증서 자체의 서명값(발급 CA가 인증서에 서명한 값, QR tag 9용) 추출. */
export function getCertSignatureDer(certPem) {
  return extractCertSignatureFromPem(certPem);
}

/**
 * ZATCA 가이드 Step 3: 인증서 해시.
 * ⚠️ 다른 모든 해시(base64(raw bytes))와 다르게, 인증서 해시만
 *    "SHA256 -> HEX 문자열 -> 그 문자열을 base64" 입니다.
 *    (가이드 예시값으로 직접 검증 완료: base64(rawBytes) 아님, base64(hexString) 맞음)
 */
function getCertDigestBase64(certPem) {
  const der = forge.pem.decode(certPem)[0].body;
  const hashHex = crypto.createHash('sha256').update(Buffer.from(der, 'binary')).digest('hex');
  return Buffer.from(hashHex, 'utf8').toString('base64');
}

/**
 * ZATCA 가이드 Step 4: SignedProperties 채우기.
 * SigningTime, SigningCertificate(CertDigest + IssuerSerial) 를 실제 값으로 채운
 * xades:SignedProperties 블록을 생성 (네임스페이스 자체 포함, 독립적으로 직렬화 가능하게).
 */
function buildSignedPropertiesXml({ signingTimeIso, certDigestB64, issuerName, serialNumber }) {
  return `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="xadesSignedProperties"><xades:SignedSignatureProperties><xades:SigningTime>${signingTimeIso}</xades:SigningTime><xades:SigningCertificate><xades:Cert><xades:CertDigest><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${certDigestB64}</ds:DigestValue></xades:CertDigest><xades:IssuerSerial><ds:X509IssuerName>${issuerName}</ds:X509IssuerName><ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber></xades:IssuerSerial></xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties></xades:SignedProperties>`;
}

/**
 * ZATCA 가이드 Step 5: SignedProperties 해시.
 * "Linearize the XML block and remove the spaces" -> 태그 사이 공백/줄바꿈 제거 후 SHA256 -> base64(raw bytes).
 * (Step5 예시값으로 base64(rawBytes) 방식이 맞다는 것까지 검증 완료.)
 */
function computeSignedPropertiesHash(signedPropertiesXml) {
  const linearized = signedPropertiesXml.replace(/>\s+</g, '><').trim();
  const hash = crypto.createHash('sha256').update(linearized, 'utf8').digest();
  return hash.toString('base64');
}

/**
 * UBLExtensions/ExtensionContent 자리에 통째로 들어갈 sig:UBLDocumentSignatures 조립.
 * ds:SignedInfo 안에 Reference 2개:
 *  - URI="" : 인보이스 본문 다이제스트 (invoiceHash 재사용)
 *  - URI="#xadesSignedProperties" : SignedProperties 다이제스트
 */
export function buildSignatureExtensionXml({ signatureB64, certPem, invoiceHashB64, signingTimeIso }) {
  const certPemBody = certPem
    .replace('-----BEGIN CERTIFICATE-----', '')
    .replace('-----END CERTIFICATE-----', '')
    .replace(/\r?\n/g, '');

  const certDigestB64 = getCertDigestBase64(certPem);
  const { issuerName, serialNumber } = extractCertIssuerAndSerial(certPem);

  const signedPropertiesXml = buildSignedPropertiesXml({
    signingTimeIso, certDigestB64, issuerName, serialNumber,
  });
  const signedPropertiesHashB64 = computeSignedPropertiesHash(signedPropertiesXml);

  // ds:Object 안에 넣을 때는 xmlns 중복 선언 피하려고 QualifyingProperties 레벨에서만 선언
  const signedPropertiesInner = signedPropertiesXml
    .replace(' xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"', '')
    .replace(' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"', '');

  return `<sig:UBLDocumentSignatures xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2" xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2" xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2">
  <sac:SignatureInformation>
    <cbc:ID xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">urn:oasis:names:specification:ubl:signature:1</cbc:ID>
    <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="signature">
      <ds:SignedInfo>
        <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
        <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
        <ds:Reference Id="invoiceSignedData" URI="">
          <ds:Transforms>
            <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
              <ds:XPath>not(//ancestor-or-self::ext:UBLExtensions) and not(//ancestor-or-self::cac:Signature)</ds:XPath>
            </ds:Transform>
          </ds:Transforms>
          <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
          <ds:DigestValue>${invoiceHashB64}</ds:DigestValue>
        </ds:Reference>
        <ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#xadesSignedProperties">
          <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
          <ds:DigestValue>${signedPropertiesHashB64}</ds:DigestValue>
        </ds:Reference>
      </ds:SignedInfo>
      <ds:SignatureValue>${signatureB64}</ds:SignatureValue>
      <ds:KeyInfo>
        <ds:X509Data>
          <ds:X509Certificate>${certPemBody}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
      <ds:Object>
        <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="signature">
          ${signedPropertiesInner}
        </xades:QualifyingProperties>
      </ds:Object>
    </ds:Signature>
  </sac:SignatureInformation>
</sig:UBLDocumentSignatures>`;
}