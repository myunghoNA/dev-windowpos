import React from 'react';
import { Br, Cut, Image, Line, Printer, QRCode, render, Row, Text } from 'react-thermal-printer';
//Import Helper
import { zatcaQrCode } from '@renderer/common/helpers';
import { renderArabicToDataUrl } from '@renderer/common/helpers/printer.helper';
import { PrintConfig, PrintReceiptData, SettingPrinter } from '@shared/types';


interface ReceiptFormProps {
    settingPrinter: SettingPrinter;
    receiptData: PrintReceiptData;
    printConfig: PrintConfig;
}

interface RenderItemRowParams {
    totalPrice: number;
    unitPrice: number;
    qty: number;
    name: string;
    isArabicName: boolean;
    paperWidth?: number; 
}

export default async function ReceiptForm({
    settingPrinter,
    receiptData,
    printConfig,
}: ReceiptFormProps): Promise<Uint8Array> {

    const config = {
        paperWidthSize: settingPrinter?.paperSize === '58mm' ? 32 : 42,
        paperWidthpx: settingPrinter?.paperSize === '58mm' ? 384 : 576,
        isShowQr: printConfig?.isShowQr || false,
        isShowVat: true,
        isItemImage: false,
        fontStyle: 'normal',
        language: printConfig?.language || 'en',
    };
    
    const vatRate = 0.15;
    const total = receiptData.totalAmount / 100;
    const vat = total * (vatRate / (1 + vatRate));
    const subtotal = total - vat;

    const zatcaTlvBase64 = zatcaQrCode(
        receiptData.storeNmAr, 
        receiptData.vatRegNo,
        new Date().toISOString(),
        total.toFixed(2), vat.toFixed(2),
    );

    const receipt = (
        <Printer type="epson" width={ config.paperWidthSize }>
            <Text align="center" bold size={{ width: 2, height: 2 }}>
                {receiptData.storeNmEn}
            </Text>
            <Text align="center">{receiptData.storeAddress}</Text>
            <Text align="center">{`VAT No: ${receiptData.vatRegNo}`}</Text>
            <Line />

            { /** 상품 */
            config.isItemImage ? 
              receiptData.items.map((item, idx) => {
                const totalPrice = (item.itemQty * item.itemAmt) / 100;
                const unitPrice = item.itemAmt / 100;
                const isArName = config.language === 'ar' && !!item.itemNmAr;

                    return (
                        <ItemRowImage
                            key={idx}
                            totalPrice={totalPrice}
                            unitPrice={unitPrice}
                            qty={item.itemQty}
                            name={isArName ? item.itemNmAr! : item.itemNmEn}
                            isArabicName={isArName}
                            paperWidth={ config.paperWidthpx }
                        />
                    );
                })
            :
              receiptData.items.map((item, idx) => (
                <ItemRow key={idx} item={item} config={config} idx={idx} />
              ))

            }

            <Line />
            <Row left="Subtotal" right={`${subtotal.toFixed(2)} SAR`} />
            { /** VAT 금액 */
                config.isShowVat && <Row left="VAT (15%)" right={`${vat.toFixed(2)} SAR`} />
            }
            {/* TOTAL금액  */}
            <Row left="TOTAL" right={`${total.toFixed(2)} SAR`} />

            {config.isShowQr && (
                <>
                    <Br />
                    <QRCode content={zatcaTlvBase64} align="center" />
                </>
            )}

            <Br />
            {/** 인사말 */
            config.language === 'ar'
                ?  <ArabicSnippet text="شكراً لك" fontSize={22} />
                :  <Text align="center">Thank You</Text>
            }

            <Cut />
        </Printer>
    );

    return await render(receipt);
}


function renderItemRowToDataUrl({
    totalPrice,
    unitPrice,
    qty,
    name,
    isArabicName,
    paperWidth = 576,
}: RenderItemRowParams): string {

    const width  =  Math.ceil(paperWidth / 8) * 8;
    const height = 70; // 두 줄(가격/이름 + 단가x수량) 들어갈 높이

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'top';

    // ── 1행: 왼쪽 총액(굵게) / 오른쪽 상품명 ──
    ctx.font = 'bold 24px Tahoma, sans-serif';
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
    ctx.fillText(`SAR ${totalPrice.toFixed(2)}`, 15, 10);

    ctx.font = isArabicName
        ? '24px "Noto Sans Arabic", Tahoma, sans-serif'
        : '24px Tahoma, sans-serif';
    ctx.direction = isArabicName ? 'rtl' : 'ltr';
    ctx.textAlign = 'right';
    ctx.fillText(name, width - 15, 10);

    // ── 2행: 오른쪽 단가 x 수량 (연하게 -> 디더링으로 회색 표현) ──
    ctx.font = '18px Tahoma, sans-serif';
    ctx.direction = 'ltr';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#999999';
    ctx.fillText(`SAR ${unitPrice.toFixed(2)} x ${qty}`, width - 15, 42);

    return canvas.toDataURL('image/png');
}


export function ArabicSnippet({ text, fontSize = 26 }: { text: string; fontSize?: number }) {
    const dataUrl = renderArabicToDataUrl(text, fontSize);
    return <Image src={dataUrl} align="center" />;
}


// ── 상품 행 렌더링 이미지(item명) + 텍스트 ──
function ItemRow({ item, config }: { item: PrintReceiptData['items'][number]; config: any; idx: number }) {
    
    const totalPrice = (item.itemQty * item.itemAmt) / 100;
    const unitPrice = item.itemAmt / 100;
    const isArName = config.language === 'ar' && !!item.itemNmAr;

    console.log('isArName >>>>> ',isArName, config.language);
   return (
        <>
            {/* 1줄: 품명 */}
            {
            isArName
                ? <Image src={renderArabicToDataUrl(item.itemNmAr, 26, config.paperWidthpx)} align="left" />
                : <Text align="right">{item.itemNmEn}</Text>
            }

            {/* 2줄: 수량 + 단가 + 합계를 한 줄에 */}
            <Row
                left={`x${item.itemQty}`}
                right={`${unitPrice.toFixed(2)} x ${item.itemQty} = ${totalPrice.toFixed(2)} SAR`}
            />
        </>
    );
}


// ── 상품 행 이미지 ──
export function ItemRowImage(params: RenderItemRowParams) {

    console.log('params >>>> ',params);
    const dataUrl = renderItemRowToDataUrl(params);
    return <Image src={dataUrl} align="left" />;
}
