const forge = require('node-forge');

const OID_SHORT_NAME = {
  '2.5.4.3': 'CN', '2.5.4.6': 'C', '2.5.4.7': 'L', '2.5.4.8': 'ST',
  '2.5.4.10': 'O', '2.5.4.11': 'OU', '2.5.4.5': 'SERIALNUMBER',
  '2.5.4.4': 'SN', '2.5.4.42': 'GN',
};

/**
 * SEC1("-----BEGIN EC PRIVATE KEY-----") 또는
 * PKCS8("-----BEGIN PRIVATE KEY-----") PEM 모두에서
 * 32바이트 private key scalar(d)를 추출합니다.
 */
export function extractRawPrivateKeyFromPem(pem) {
  const der = forge.pem.decode(pem)[0].body;
  const asn1 = forge.asn1.fromDer(der);

  let found = null;
  function walk(node) {
    if (found) return;
    if (node.type === forge.asn1.Type.OCTETSTRING && typeof node.value === 'string') {
      if (node.value.length === 32) {
        found = node.value;
        return;
      }

      try {
        const nested = forge.asn1.fromDer(node.value);
        walk(nested);
        if (found) return;
      } catch  { /* not nested DER, ignore */ }
    }
    if (Array.isArray(node.value)) {
      for (const child of node.value) {
        walk(child);
        if (found) return;
      }
    }
  }
  walk(asn1);

  if (!found) {
    throw new Error('PEM에서 32바이트 private key scalar를 찾지 못했습니다. secp256k1 키가 맞는지 확인하세요.');
  }
  return Buffer.from(found, 'binary');
}

/**
 * X.509 인증서(PEM)에서 EC 공개키 raw point (uncompressed, 0x04||X||Y, 65 bytes) 추출.
 */
export function extractPublicKeyPointFromCertPem(certPem) {
  const der = forge.pem.decode(certPem)[0].body;
  const asn1 = forge.asn1.fromDer(der);

  const tbs = asn1.value[0];

  // TBSCertificate:
  // v3: [0] version, serial, sigAlg, issuer, validity, subject, subjectPublicKeyInfo
  // v1: serial, sigAlg, issuer, validity, subject, subjectPublicKeyInfo
  const hasVersion = tbs.value[0].tagClass === forge.asn1.Class.CONTEXT_SPECIFIC;
  const spkiIndex = hasVersion ? 6 : 5;

  const subjectPublicKeyInfo = tbs.value[spkiIndex];
  const spkiDer = forge.asn1.toDer(subjectPublicKeyInfo).getBytes();

  return Buffer.from(spkiDer, 'binary');
}

/**
 * 인증서 전체를 감싸는 서명값 (Certificate.signatureValue, BIT STRING) 추출.
 * QR tag9(CA가 인증서에 서명한 값)에 사용.
 */
export function extractCertSignatureFromPem(certPem) {
  const der = forge.pem.decode(certPem)[0].body;
  const asn1 = forge.asn1.fromDer(der);

  const sigNode = asn1.value[2];
  if (sigNode.type !== forge.asn1.Type.BITSTRING) {
    throw new Error('인증서 signatureValue BIT STRING을 찾지 못했습니다.');
  }

  const raw = sigNode.bitStringContents || sigNode.value;
  const bytes = raw.charCodeAt(0) === 0 ? raw.slice(1) : raw;

  return Buffer.from(bytes, 'binary');
}

/**
 * TBSCertificate.issuer (Name) 를 RFC2253 스타일 DN 문자열로 변환.
 * (인코딩 순서의 역순으로 이어붙임 - Java X500Principal.getName(RFC2253)와 동일한 관례)
 */
function nameToRfc2253(nameSeq) {
  const rdns = nameSeq.value.map((rdn) => {
    return rdn.value.map((atv) => {
      const oid = forge.asn1.derToOid(atv.value[0].value);
      const short = OID_SHORT_NAME[oid] || oid;
      const val = atv.value[1].value;
      return `${short}=${val}`;
    }).join('+');
  });
  return rdns.reverse().join(',');
}

/**
 * 인증서(PEM)에서 issuer DN 문자열과 serialNumber(10진수 문자열)를 추출.
 * XAdES SignedProperties.SigningCertificate.Cert.IssuerSerial 에 사용.
 */
export function extractCertIssuerAndSerial(certPem) {
  const der = forge.pem.decode(certPem)[0].body;
  const asn1 = forge.asn1.fromDer(der);
  const tbs = asn1.value[0];

  // version [0] 이 있으면: 0=version,1=serial,2=sigAlg,3=issuer,4=validity,5=subject...
  // version 이 없는(구버전 v1) 인증서는 거의 없으므로 이 인덱스를 그대로 사용.
  const serialNode = tbs.value[1];
  let serialBytes = Buffer.from(serialNode.value, 'binary');
  if (serialBytes[0] === 0x00) serialBytes = serialBytes.slice(1);
  const serialNumber = BigInt(`0x${serialBytes.toString('hex')}`).toString(10);

  const issuerName = nameToRfc2253(tbs.value[3]);

  return { issuerName, serialNumber };
}