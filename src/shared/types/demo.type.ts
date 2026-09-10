
export type DemoUserDataType = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

export type DemoUserState = {
  data: DemoUserDataType | null;
  isLoading: boolean;
  error: string | null;
};


/******************************************************** 타입분기 Sample
// type PaymentMethod = 'cash' | 'mada' | 'stcPay' | 'applePay'

// // 카드 결제에만 승인번호 필드 추가
// type PaymentDetails<T extends PaymentMethod> =
//   T extends 'cash'
//     ? { method: T; amountReceived: number; change: number }
//     : T extends 'mada' | 'applePay'
//     ? { method: T; approvalCode: string; last4Digits: string }
//     : T extends 'stcPay'
//     ? { method: T; approvalCode: string; mobileNumber: string }
//     : never

// type CashPayment  = PaymentDetails<'cash'>     // amountReceived, change
// type MadaPayment  = PaymentDetails<'mada'>     // approvalCode, last4Digits
// type StcPayment   = PaymentDetails<'stcPay'>   // approvalCode, mobileNumber
********************************************************/


/********************************************************  기본 props
type ButtonProps = {
  label: string
  variant: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'        // optional
  disabled?: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}
********************************************************/


/********************************************************  type - 유니온/인터섹션, 계산된 타입
interface BaseInputProps {
  label: string
  error?: string
  required?: boolean
}

interface TextInputProps extends BaseInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

interface NumberInputProps extends BaseInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

type InputProps = TextInputProps | NumberInputProps
********************************************************/