/**
 * @name generateQrCode
 * @description ZATCA 규격에 맞는 TLV 인코딩 후 Base64 반환
 */
export function zatcaQrCode(
    sellerName: string,
    vatNumber: string,
    timeStamp: string,
    totalAmount: string,
    vatAmount: string,
): string {
    const encoder = new TextEncoder();

    // 개별 태그를 TLV(Tag-Length-Value) 형식의 Uint8Array로 변환하는 함수
    const getTlv = (tag: number, value: string): Uint8Array => {
        const valueBuf = encoder.encode(value);
        const tlv = new Uint8Array(2 + valueBuf.length);
        tlv[0] = tag;             // T: Tag
        tlv[1] = valueBuf.length; // L: Length
        tlv.set(valueBuf, 2);     // V: Value
        return tlv;
    };

    // @@@ 추후확인
    // const tlv = encodeTLV([
    //     { tag: 1, value: sellerName },          // 판매자명
    //     { tag: 2, value: vatNumber },           // VAT 번호
    //     { tag: 3, value: invoiceDate },         // 발행일시
    //     { tag: 4, value: totalWithVAT },        // VAT 포함 총액
    //     { tag: 5, value: vatAmount },           // VAT 금액
    //     { tag: 6, value: invoiceHash },         // 인보이스 해시 (Phase 2)
    //     { tag: 7, value: ecdsaSignature },      // ECDSA 서명 (Phase 2) ← 개인키 필요
    //     { tag: 8, value: publicKey },           // 공개키 (Phase 2) ← CSID 필요
    //     { tag: 9, value: stampSignature },      // ZATCA 스탬프 (Phase 2) ← CSID 필요
    // ]);

    // 1~5번 태그 생성
    const t1 = getTlv(1, sellerName);  // 판매자명
    const t2 = getTlv(2, vatNumber);   // VAT 번호
    const t3 = getTlv(3, timeStamp);   // 발행일시
    const t4 = getTlv(4, totalAmount); // VAT 포함 총액
    const t5 = getTlv(5, vatAmount);   // VAT 금액

    // 전체 합치기
    const totalLength = t1.length + t2.length + t3.length + t4.length + t5.length;
    const combined = new Uint8Array(totalLength);
    
    let offset = 0;
    [t1, t2, t3, t4, t5].forEach(t => {
        combined.set(t, offset);
        offset += t.length;
    });

    // Uint8Array를 Base64 문자열로 변환
    return btoa(String.fromCharCode(...combined));
    // return Buffer.from(combined).toString('base64');
}