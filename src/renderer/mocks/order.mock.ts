import { PrintReceiptData } from '@shared/types';

export const MockPrinterData: PrintReceiptData = {
    storeNmAr: 'NMH CAFE Ar',
    storeNmEn: 'NMH CAFE En',
    storeAddress: 'Riyadh, Saudi Arabia',
    vatRegNo: '300000000000003',
    totalAmount: 35000,
    items: [
        {
            itemNmAr: 'قهوة أمريكية',   // 아메리카노
            itemNmEn: 'Americano',
            itemQty: 2,
            itemAmt: 10000,
        },
        {
            itemNmAr: 'كرواسون',         // 크로아상
            itemNmEn: 'Croissant',
            itemQty: 1,
            itemAmt: 8000,
        },
        {
            itemNmAr: 'عصير برتقال',     // 오렌지주스
            itemNmEn: 'Orange Juice',
            itemQty: 1,
            itemAmt: 7000,
        },
        {
            itemNmAr: 'شاي أخضر',        // 녹차
            itemNmEn: 'Green Tea',
            itemQty: 2,
            itemAmt: 5000,
        },
    ],
};


export const MockOptionItemsA:any[] = [
    {
        productOptionName: 'HOT',
        productOptionAmount: 0,
        productOptionCnt: 2,
    },
    {
        productOptionName: '다크 원두',
        productOptionAmount: 0,
        productOptionCnt: 2,
    },
    {
        productOptionName: '라지 (L)',
        productOptionAmount: 500,
        productOptionCnt: 2,
    },
];


export function MockGenerateLongReceiptText(repeatCount: number = 10): string {
  let header = '========== [ TEST RECEIPT ] ==========\n';
  header += 'Store: POS System Test\n';
  header += 'Date: 2026-03-20 15:30:00\n';
  header += '--------------------------------------\n';

  let body = '';
  for (let i = 1; i <= repeatCount; i++) {
    body += `[ITEM GROUP ${i}]\n`;
    body += '1. 불고기 피자 라지 사이즈 ....... 25,000원\n';
    body += '   (옵션: 치즈 크러스트 추가, 콜라 1.25L)\n';
    body += '2. 베이컨 포테이토 파스타 ....... 12,000원\n';
    body += '3. 갈릭 디핑 소스 x 5개  .......  2,500원\n';
    body += '4. 수제 피클 추가 x 2개  .......  1,000원\n';
    body += '--------------------------------------\n';
    body += '이 문장은 텍스트 전송 부하 테스트를 위한 더미 텍스트입니다.\n';
    body += '가상 포트 및 실제 시리얼 프린터의 드레인(Drain) 기능을 확인합니다.\n';
    body += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789\n';
    body += '가나다라마바사아자차카타파하 거너더러머버서어저처커터퍼허\n';
    body += '--------------------------------------\n';
  }

  const footer = '========== [ END OF TEST ] ==========\n\n\n\n\n'; // 용지 커팅을 위한 여백 포함
  return header + body + footer;
}