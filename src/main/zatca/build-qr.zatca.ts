// TODO: ZATCA 내용 구현 상세화 

/**
 * ZATCA Phase 2 QR: TLV(Tag-Length-Value) 를 이어붙인 뒤 base64 인코딩.
 * Tag 1: Seller Name
 * Tag 2: VAT Registration Number
 * Tag 3: Timestamp (ISO 8601, invoice issue datetime)
 * Tag 4: Invoice Total (with VAT) as string
 * Tag 5: VAT Total as string
 * Tag 6: Invoice Hash (base64 SHA256, 자리수 그대로 바이트로 넣음)
 * Tag 7: ECDSA Signature (raw bytes, base64 디코딩된 바이트)
 * Tag 8: ECDSA Public Key (raw bytes, DER)
 * Tag 9: ECDSA Signature of the Public Key by CA (certificate 내부에서 추출, raw bytes)
 */
function tlv(tag, value) {
  const valueBuffer = Buffer.isBuffer(value)
    ? value
    : Buffer.from(String(value), 'utf8');

  if (valueBuffer.length > 255) {
    throw new Error(`QR TLV tag ${tag} is too long: ${valueBuffer.length}`);
  }

  return Buffer.concat([
    Buffer.from([tag]),
    Buffer.from([valueBuffer.length]),
    valueBuffer,
  ]);
}

export function buildQrTlvBase64(f) {

  // const publicKeyForQr = f.publicKeyDer[0] === 0x04 ? f.publicKeyDer.subarray(1) : f.publicKeyDer;

  const parts = [
    tlv(1, f.sellerName),
    tlv(2, f.vatNumber),
    tlv(3, f.timestamp),
    tlv(4, f.invoiceTotal),
    tlv(5, f.vatTotal),

    // ZATCA validator는 QR tag 6~9 값을 base64 문자열로 비교
    tlv(6, f.invoiceHashB64),
    tlv(7, f.signatureB64),
    // tlv(8, f.publicKeyDer.toString('base64')),
    tlv(8, f.publicKeyDer),
	//tlv(8, f.publicKeyDer.toString('base64')),
  ];

  if (f.certSignatureDer) {
    //parts.push(tlv(9, f.certSignatureDer.toString('base64')));
	parts.push(tlv(9, f.certSignatureDer));
  }

  return Buffer.concat(parts).toString('base64');
}