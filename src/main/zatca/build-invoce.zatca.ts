
import { create } from 'xmlbuilder2';

// TODO: ZATCA 내용 구현 상세화 
/**
 * ZATCA 심플리파이드 세금계산서(Simplified Tax Invoice, type 388) UBL 2.1 XML 생성.
 * - UBLExtensions / QR AdditionalDocumentReference 는 값이 아직 없는 "빈 틀"로 생성.
 *   (해시 계산 -> QR 생성 -> 삽입 -> 서명 순서를 지키기 위함, signature.js 참고)
 *
 * @param {object} inv
 *  {
 *    invoiceId: 'INV-0001',
 *    uuid: 'uuid-v4',
 *    issueDate: '2026-07-07',
 *    issueTime: '13:20:00',
 *    icv: 12,                     // Invoice Counter Value
 *    pih: 'base64-previous-hash', // Previous Invoice Hash (첫 인보이스면 zero-hash)
 *    seller: { name, vatNumber, street, city, buildingNumber, postalCode, countryCode },
 *    buyer: { name, vatNumber } | null, // 심플리파이드는 buyer 정보 생략 가능
 *    lines: [{ id, name, qty, unitPrice, vatPercent }],
 *    currency: 'SAR'
 *  }
 */
export function buildInvoiceXml(inv) {

  const {
    invoiceId, uuid, issueDate, issueTime,
    icv, pih, seller, buyer, lines, currency = 'SAR',
  } = inv;

  const lineExtensionAmount = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const taxAmount = lines.reduce((s, l) => s + l.qty * l.unitPrice * (l.vatPercent / 100), 0);
  const taxInclusiveAmount = lineExtensionAmount + taxAmount;

  const doc = create({ version: '1.0', encoding: 'UTF-8', standalone: false })
    .ele('Invoice', {
      xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
    });

  // ---- UBLExtensions: 서명 삽입 전에는 빈 틀만 ----
  doc.ele('ext:UBLExtensions')
    .ele('ext:UBLExtension')
      .ele('ext:ExtensionURI').txt('urn:oasis:names:specification:ubl:dsig:enveloped:xades').up()
      .ele('ext:ExtensionContent')
        // signature.js 에서 이 자리에 sig:UBLDocumentSignatures 를 통째로 주입한다
        .ele('PLACEHOLDER_SIGNATURE_EXTENSION').up()
      .up()
    .up()
  .up();

  doc.ele('cbc:ProfileID').txt('reporting:1.0').up();
  doc.ele('cbc:ID').txt(invoiceId).up();
  doc.ele('cbc:UUID').txt(uuid).up();
  doc.ele('cbc:IssueDate').txt(issueDate).up();
  doc.ele('cbc:IssueTime').txt(issueTime).up();
  // 388 = Tax Invoice. name 속성 = KSA 트랜잭션 코드 (0200000 = 심플리파이드, 반품/디베잇 아님)
  doc.ele('cbc:InvoiceTypeCode', { name: '0200000' }).txt('388').up();
  doc.ele('cbc:DocumentCurrencyCode').txt(currency).up();
  doc.ele('cbc:TaxCurrencyCode').txt(currency).up();

  // ---- AdditionalDocumentReference: ICV ----
  doc.ele('cac:AdditionalDocumentReference')
    .ele('cbc:ID').txt('ICV').up()
    .ele('cbc:UUID').txt(String(icv)).up()
  .up();

  // ---- AdditionalDocumentReference: PIH ----
  doc.ele('cac:AdditionalDocumentReference')
    .ele('cbc:ID').txt('PIH').up()
    .ele('cac:Attachment')
      .ele('cbc:EmbeddedDocumentBinaryObject', { mimeCode: 'text/plain' }).txt(pih).up()
    .up()
  .up();

  // ---- AdditionalDocumentReference: QR (값은 signature.js 에서 채움) ----
  doc.ele('cac:AdditionalDocumentReference')
    .ele('cbc:ID').txt('QR').up()
    .ele('cac:Attachment')
      .ele('cbc:EmbeddedDocumentBinaryObject', { mimeCode: 'text/plain' }).txt('PLACEHOLDER_QR').up()
    .up()
  .up();

  // ---- Signature 참조 (실제 서명값 자체는 UBLExtensions 안에 들어감) ----
  doc.ele('cac:Signature')
    .ele('cbc:ID').txt('urn:oasis:names:specification:ubl:signature:Invoice').up()
    .ele('cbc:SignatureMethod').txt('urn:oasis:names:specification:ubl:dsig:enveloped:xades').up()
  .up();

  // ---- Supplier ----
  const supplierParty = doc.ele('cac:AccountingSupplierParty')
   .ele('cac:Party');

	if (seller.crn) {
    supplierParty
		.ele('cac:PartyIdentification')
      .ele('cbc:ID', { schemeID: 'CRN' }).txt(seller.crn).up()
		.up();
	}

 supplierParty
      .ele('cac:PostalAddress')
        .ele('cbc:StreetName').txt(seller.street).up()
        .ele('cbc:BuildingNumber').txt(seller.buildingNumber).up()
      .ele('cbc:CitySubdivisionName').txt(seller.district).up()
        .ele('cbc:CityName').txt(seller.city).up()
        .ele('cbc:PostalZone').txt(seller.postalCode).up()
        .ele('cac:Country').ele('cbc:IdentificationCode').txt(seller.countryCode || 'SA').up().up()
      .up()
      .ele('cac:PartyTaxScheme')
        .ele('cbc:CompanyID').txt(seller.vatNumber).up()
      .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up()
        //.ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up()
      .up()
      .ele('cac:PartyLegalEntity')
        .ele('cbc:RegistrationName').txt(seller.name).up()
      .up()
    .up()
  .up();

  // ---- Customer (UBL XSD 상 필수 순서 요소 - 심플리파이드라도 요소 자체는 있어야 함) ----
  const customerParty = doc.ele('cac:AccountingCustomerParty').ele('cac:Party');
  if (buyer && buyer.name) {
    customerParty.ele('cac:PartyLegalEntity')
      .ele('cbc:RegistrationName').txt(buyer.name).up()
    .up();
  } else {
    // buyer 정보가 없는 심플리파이드 인보이스: 최소 구조만 유지
    customerParty.ele('cac:PostalAddress')
      .ele('cac:Country').ele('cbc:IdentificationCode').txt('SA').up().up()
    .up();
  }
  customerParty.up().up();

  // ---- PaymentMeans ----
  doc.ele('cac:PaymentMeans')
    .ele('cbc:PaymentMeansCode').txt('10').up() // 10 = cash (예시)
  .up();

  // ---- TaxTotal ----
  doc.ele('cac:TaxTotal')
     .ele('cbc:TaxAmount', { currencyID: currency }).txt(taxAmount.toFixed(2)).up()
  .up();

  // 2) Invoice currency total: TaxSubtotal 포함
  doc.ele('cac:TaxTotal')
     .ele('cbc:TaxAmount', { currencyID: currency }).txt(taxAmount.toFixed(2)).up()
    .ele('cac:TaxSubtotal')
		.ele('cbc:TaxableAmount', { currencyID: currency }).txt(lineExtensionAmount.toFixed(2)).up()
		.ele('cbc:TaxAmount', { currencyID: currency }).txt(taxAmount.toFixed(2)).up()
		.ele('cac:TaxCategory')
      .ele('cbc:ID').txt('S').up()
      .ele('cbc:Percent').txt(lines[0]?.vatPercent?.toFixed(2) ?? '15.00').up()
      .ele('cac:TaxScheme')
			.ele('cbc:ID').txt('VAT').up()
      .up()
		.up()
    .up()
  .up();

  // ---- LegalMonetaryTotal ----
  doc.ele('cac:LegalMonetaryTotal')
    .ele('cbc:LineExtensionAmount', { currencyID: currency }).txt(lineExtensionAmount.toFixed(2)).up()
    .ele('cbc:TaxExclusiveAmount', { currencyID: currency }).txt(lineExtensionAmount.toFixed(2)).up()
    .ele('cbc:TaxInclusiveAmount', { currencyID: currency }).txt(taxInclusiveAmount.toFixed(2)).up()
    .ele('cbc:PayableAmount', { currencyID: currency }).txt(taxInclusiveAmount.toFixed(2)).up()
  .up();

  // ---- InvoiceLines ----
  lines.forEach((l, idx) => {
    const lineAmount = l.qty * l.unitPrice;
    const lineTax = lineAmount * (l.vatPercent / 100);
    doc.ele('cac:InvoiceLine')
      .ele('cbc:ID').txt(String(l.id ?? idx + 1)).up()
      .ele('cbc:InvoicedQuantity', { unitCode: 'PCE' }).txt(String(l.qty)).up()
      .ele('cbc:LineExtensionAmount', { currencyID: currency }).txt(lineAmount.toFixed(2)).up()
      .ele('cac:TaxTotal')
        .ele('cbc:TaxAmount', { currencyID: currency }).txt(lineTax.toFixed(2)).up()
        .ele('cbc:RoundingAmount', { currencyID: currency }).txt((lineAmount + lineTax).toFixed(2)).up()
      .up()
      .ele('cac:Item')
        .ele('cbc:Name').txt(l.name).up()
        .ele('cac:ClassifiedTaxCategory')
          .ele('cbc:ID').txt('S').up()
          .ele('cbc:Percent').txt(l.vatPercent.toFixed(2)).up()
          .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up()
        .up()
      .up()
      .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: currency }).txt(l.unitPrice.toFixed(2)).up()
      .up()
    .up();
  });

  return doc.end({ prettyPrint: true });
}