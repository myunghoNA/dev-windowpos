import qrcode from 'qrcode';
//# Import Helper
import { zatcaQrCode } from '@renderer/common/helpers';
//# Import Type
import {
    PrintConfig,
    PrintOrderItem,
    PrintReceiptData,
} from '@shared/types/printer.type';
import { SettingPrinter } from '@shared/types/setting.type';


interface BuildReceiptHtmlProps {
    settingPrinter: SettingPrinter;
    receiptData: PrintReceiptData;
    printConfig: PrintConfig;
}

/**
 * @name buildReceiptHtml
 * @description 영수증 정보 html 변환
 */
export async function buildReceiptHtml({
    settingPrinter,
    receiptData,
    printConfig,
}: BuildReceiptHtmlProps): Promise<string> {

    const config = {
        paperWidth: settingPrinter?.paperSize === '58mm' ? '45mm' : '65mm', 
        isShowQr: printConfig?.isShowQr || false,
        isShowVat: true,
        fontStyle: 'normal',
        language: printConfig?.language || 'ar',
    };

    const vatRate = 0.15;
    const total = receiptData.totalAmount / 100;
    const vat = total * (vatRate / (1 + vatRate));
    const subtotal = total - vat;

    let qrImgTag = '';
    if (config.isShowQr) {
        const zatcaTlvBase64 = zatcaQrCode(
            receiptData.storeNmEn, receiptData.vatRegNo,
            new Date().toISOString(),
            total.toFixed(2), vat.toFixed(2),
        );
        const qrDataUrl = await qrcode.toDataURL(zatcaTlvBase64, {
            errorCorrectionLevel: 'M', margin: 1,
        });
        qrImgTag = `<div class="qr-wrap"><img src="${qrDataUrl}" class="qr-img" /></div>`;
    }

    const isShowEn = config.language === 'en' || config.language === 'ko';
    const isShowAr = config.language === 'ar';

    const itemRowsHtml = receiptData.items.map(item => buildItemRowHtml(item, printConfig)).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @media print {
                    * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    @page {
                        size: ${config.paperWidth} auto;
                        margin-top: 5mm;
                        margin-left: 5mm;
                        margin-right: 10mm;
                    }
                    body { margin: 0 !important; }
                }
                * { padding: 0; box-sizing: border-box; }
                body {
                    width: ${config.paperWidth};
                    font-family: "Noto Sans Arabic", Tahoma, sans-serif;
                    font-size: 13px;
                    color: #000;
                }

                .center { text-align: center; }
                .bold { font-weight: bold; }

                .store-name { font-size: 20px; font-weight: bold; }
                .store-addr, .vat-no { font-size: 13px; margin-top: 4px; }

                .separator {
                    border-top: 1px dashed #000;
                    margin: 10px 0;
                }

                .items-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    padding-bottom: 6px;
                }
                .items-header .col-qty   { width: 20%; text-align: left; }
                .items-header .col-item  { width: 55%; text-align: center; }
                .items-header .col-price { width: 25%; text-align: right; }

                .item-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding-top: 10px;
                }
                .item-qty   { width: 20%; text-align: left; }
                .item-name  { width: 55%; text-align: center; }
                .item-price { width: 25%; text-align: right; }

                .item-name-en { direction: ltr; }
                .item-name-ar { direction: rtl; margin-top: 2px; }

                .item-sub-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #444;
                }
                .item-sub-row > div:first-child { width: 20%; }
                .item-sub-row .item-sub { width: 80%; text-align: right; }

                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 2px 0;
                }
                .total-row.grand {
                    font-size: 16px;
                    font-weight: bold;
                    margin-top: 4px;
                }

                .footer { text-align: center; margin-top: 16px; }
                .footer .ar { direction: rtl; margin-top: 4px; }

                .qr-wrap { text-align: center; margin-top: 16px; }
                .qr-img { width: 100px; height: 100px; }
            </style>
        </head>
        <body>
            <div class="center store-name">${receiptData.storeNmEn}</div>
            <div class="center store-addr">${receiptData.storeAddress}</div>
            <div class="center vat-no">VAT No: ${receiptData.vatRegNo}</div>

            <div class="separator"></div>

            <div class="items-header">
                <div class="col-qty">Qty</div>
                <div class="col-item">Item</div>
                <div class="col-price">Price</div>
            </div>

            ${itemRowsHtml}

            <div class="separator"></div>

            <div class="total-row">
                <div>Subtotal</div>
                <div>${subtotal.toFixed(2)} SAR</div>
            </div>
            ${config.isShowVat ? `
            <div class="total-row">
                <div>VAT (15%)</div>
                <div>${vat.toFixed(2)} SAR</div>
            </div>` : ''}
            <div class="total-row grand">
                <div>TOTAL</div>
                <div>${total.toFixed(2)} SAR</div>
            </div>

            <div class="footer">
                ${isShowEn ? '<div>Thank You</div>' : ''}
                ${isShowAr ? '<div class="ar" dir="rtl" lang="ar">شكراً لك</div>' : ''}
            </div>

            ${qrImgTag}
        </body>
        </html>
    `;
}


// ── 품목 행 HTML 생성 ──
function buildItemRowHtml(item: PrintOrderItem, config: PrintConfig): string {
    const unitPrice  = item.itemAmt / 100;
    const totalPrice = (item.itemQty * item.itemAmt) / 100;

    const isShowEn = config.language === 'en' || config.language === 'ko';
    const isShowAr = config.language === 'ar';

    const nameHtml = `
        ${isShowEn ? `<div class="item-name-en">${item.itemNmEn}</div>` : ''}
        ${isShowAr ? `<div class="item-name-ar" dir="rtl" lang="ar">${item.itemNmAr}</div>` : ''}
    `;

    return `
        <div class="item-row">
            <div class="item-qty">Qty ${item.itemQty}</div>
            <div class="item-name">${nameHtml}</div>
            <div class="item-price">${totalPrice.toFixed(2)}</div>
        </div>
        <div class="item-sub-row">
            <div></div>
            <div class="item-sub">SAR ${unitPrice.toFixed(2)} x ${item.itemQty}</div>
        </div>
    `;
}
