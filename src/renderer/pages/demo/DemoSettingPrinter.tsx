import React, { useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@renderer/redux/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import uuid from 'react-uuid';

import { needElectron } from '@renderer/apis/need-electron.api';
//# Import Local DB
import { deleteSettingPrinter, getSettingPrintersByTerminalId, saveSettingPrinter } from '@renderer/common/repositories/setting-printer.repository';
//# Import Helper
import { SweetAlert } from '@renderer/common/helpers';
import { customLogger } from '@renderer/common/helpers/logger.helper';
import { sendReceiptToEthernet, sendReceiptToSerial, sendReceiptToWindows } from '@renderer/common/helpers/printer.helper';
import { isEmpty, isSettingPrinter } from '@renderer/common/helpers/validate.helper';
//# Import Type
import { PrintConfig, PrinterPaperSize } from '@shared/types/printer.type';
import { SettingPrinter } from '@shared/types/setting.type';
import { ComResponseType } from '@shared/types/system.type';
import { SelectValueType } from '@shared/types/ui.type';
//# Import Provider
import { MockPrinterData } from '@renderer/mocks/order.mock';
import { PrinterConnectType } from '@renderer/providers/com-code.provider';
import {
  InitSettingPrinter,
  SelectPrinterPaperSizes,
  SelectPrinterTypes,
  SelectSerialPorts,
} from '@renderer/providers/com-item.provider';


export function DemoSettingPrinter() {

  const LOG_TITLE  = '[renderer.demoSettingPrinter]';

  const session = useAppSelector((state) => state.session.current);

  const [ serialPortPathsST, setSerialPortPaths ] = useState<SelectValueType[]>([]);
  const [ windowPrinterPathsST, setWindowPrinterPaths ] = useState<SelectValueType[]>([]);
  const [ curSettingPrinterST, setCurSettingPrinter ] = useState<SettingPrinter>(InitSettingPrinter);

  // terminalRegisterId+deviceKey
  const settingPrinterList = useLiveQuery(
    () => session?.terminalId
      ? getSettingPrintersByTerminalId(session.terminalId)
      : Promise.resolve<SettingPrinter[]>([]), 
    [session?.terminalId],
  ) ?? [];

  const { t, i18n } = useTranslation();

  const isPortFetched = useRef(false);

  useEffect(() => {
    if (isPortFetched.current) return;
    isPortFetched.current = true;

    getConnectSerialPorts();
    getConnectWindowPrinters();
  }, []);

  /** 초기설정 */
  useEffect(() => {

    //TODO: 임시- 추후 목록에서 넘겨받은 정보 반영
    if (settingPrinterList.length > 0) {
       setCurSettingPrinter(settingPrinterList[0]);
      // console.log('>>>>>>>>>>>>>>>>> settingPrinterList[0]', settingPrinterList);
    }else{
      setCurSettingPrinter(InitSettingPrinter);
    }

  }, [settingPrinterList]);   


  /**시리얼포트 연결 리스트 조회 */
  const getConnectSerialPorts = async () => {
      const result:ComResponseType = await needElectron().printer.getSerialPorts();

      if (result.isSuccess) {
        const paths = result.resultMessage.map((item) => ({
          name: item.path,
          value: item.path,
        }));
        setSerialPortPaths(paths);
      }
  };

  /**윈도우 드라이버 연결 리스트 조회 */
  const getConnectWindowPrinters = async () => {
      const result:ComResponseType = await needElectron().printer.getWindowPrinters();

      if (result.isSuccess) {
        const paths = result.resultMessage.map((item) => ({
          name: item.displayName,
          value: item.name,
        }));
        setWindowPrinterPaths(paths);
      }
  };


  /**Form Value변경 반영 - 변경사항 없음 */
  const handleFormValueChange = (event, formId:string) => {
    switch (formId) {
      case 'printerName':
        setCurSettingPrinter({...curSettingPrinterST, printerName: event.target.value});
        break;
      case 'printerType':
        setCurSettingPrinter({...curSettingPrinterST, printerType: event.target.value});
        break;
      case 'paperSize':
        setCurSettingPrinter({...curSettingPrinterST, paperSize: event.target.value});
        break;
      case 'serialOption.comPort':
        setCurSettingPrinter({
          ...curSettingPrinterST,
          serialOption: {...curSettingPrinterST.serialOption, comPort: event.target.value},
        });
        break;
      case 'serialOption.baudRate': {
        const baudRate:number = Number(event.target.value);
        setCurSettingPrinter({
          ...curSettingPrinterST,
          serialOption: {...curSettingPrinterST.serialOption, baudRate: baudRate},
        });
        break;
      }
      case 'ethernetOption.ip':
        setCurSettingPrinter({
          ...curSettingPrinterST,
          ethernetOption: {...curSettingPrinterST.ethernetOption, ip: event.target.value},
        });
        break;
      case 'ethernetOption.port': {
        const printerPort:number = Number(event.target.value);
        setCurSettingPrinter({
          ...curSettingPrinterST,
          ethernetOption: {...curSettingPrinterST.ethernetOption, port: printerPort},
        });
        break;
      }
      case 'windowOption.driverName':
        setCurSettingPrinter({
          ...curSettingPrinterST,
          windowOption: {...curSettingPrinterST.windowOption, driverName: event.target.value},
        });
        break;
      case 'orderPrintOption.isUse': {
        const isChecked = (event.target as HTMLInputElement).checked;
        setCurSettingPrinter({
          ...curSettingPrinterST,
          orderPrintOption: {...curSettingPrinterST.orderPrintOption, isUse: isChecked},
        });
        break;
      }
      case 'receiptPrintOption.isUse': {
        const isChecked = (event.target as HTMLInputElement).checked;
        setCurSettingPrinter({
          ...curSettingPrinterST,
          receiptPrintOption: {...curSettingPrinterST.receiptPrintOption, isUse: isChecked},
        });
        break;
      }
    }
  };

  /** 출력테스트 - 변경사항 없음 */
  const handleTestPrint = () => {
    const validation = isSettingPrinter(curSettingPrinterST);

    if (!validation.isValid) {
      SweetAlert.warn(t('warn.title'), t(validation.messageKey as any));
      return;
    }

    const lang:any = i18n.language ?? 'en';
    const printConfig:PrintConfig = {
        isShowQr: true,
        isShowVat: true,
        language: lang,
    };

    const printerType = curSettingPrinterST.printerType;

    if (printerType === PrinterConnectType.SERIAL) {
      sendReceiptToSerial(printConfig, curSettingPrinterST, MockPrinterData);
    }
    else if (printerType === PrinterConnectType.ETHERNET) {
      sendReceiptToEthernet(printConfig, curSettingPrinterST, MockPrinterData);
    }
    else if (printerType === PrinterConnectType.WINDOWS) {
      sendReceiptToWindows(printConfig, curSettingPrinterST, MockPrinterData);
    }
  };

  /** 설정정보 저장 */
  const handleSavePrinter = async () => {

    if(!session){
          SweetAlert.error('인증없음', '로그인해주세요');
          return;
    }

    let copyCurSettingPrinter:SettingPrinter = {
      ...curSettingPrinterST,
      terminalId: session.terminalId,
    };

    const validation = isSettingPrinter(copyCurSettingPrinter);

    if (!validation.isValid) {
        SweetAlert.warn(t('warn.title'), t(validation.messageKey as any));
        return;
    }

    const printerType = copyCurSettingPrinter?.printerType ?? 'NONE';
    const printerDeviceKey = copyCurSettingPrinter?.deviceKey ?? '';

    if (printerDeviceKey.length === 0) {
      copyCurSettingPrinter = {...copyCurSettingPrinter, deviceKey: uuid()};
    }
    if (printerType !== PrinterConnectType.SERIAL) {
      copyCurSettingPrinter = {...copyCurSettingPrinter, serialOption:{comPort:'', baudRate:115200 }};
    }
    if (printerType !== PrinterConnectType.ETHERNET) {
      copyCurSettingPrinter = {...copyCurSettingPrinter, ethernetOption:{ ip:'', port:9100 }};
    }
    if (printerType !== PrinterConnectType.WINDOWS) {
      copyCurSettingPrinter = {...copyCurSettingPrinter, windowOption:{ driverName:'' }};
    }

    try {
        //임시
        await saveSettingPrinter(copyCurSettingPrinter);

        customLogger.info(`${LOG_TITLE} 프린터 설정 저장`, copyCurSettingPrinter);
        SweetAlert.fire(
          t('info.save_complete'),
          t('printer_settings.notify.save_success'),
        );
    } catch (error) {
        customLogger.error(`${LOG_TITLE} 프린터 설정 저장 실패`, error);
        SweetAlert.error(
          t('error.title_fail'),
          t('error.try_again_later'),
        );
    }
  };


    /** 프린터초기화 테스트 */
  const handleDeletePrinter = async () => {
    
    console.log('session >>>>> ', session);

    if(!session){
          SweetAlert.error('인증없음', '로그인해주세요');
          return;
    }

    const terminalId = curSettingPrinterST.terminalId;
    const deviceKey = curSettingPrinterST.deviceKey;

    if(isEmpty(terminalId) || isEmpty(deviceKey)) return;

    await deleteSettingPrinter(terminalId, deviceKey);
  
  };

 return (
     <div style={styles.page}>
       <div style={styles.card}>
 
         <div style={styles.header}>
           <h2 style={styles.title}>{/**프린터 설정 */ t('printer_settings.title') }</h2>
           <p style={styles.subtitle}>
             {/* 영수증/주문서 프린터의 연결 정보를 설정합니다. */}
             { t('printer_settings.description') }
           </p>
         </div>
 
         {/* 프린터 이름 */}
         <div style={styles.field}>
           <label style={styles.label}>{ /**프린터 이름 */ t('printer_settings.field_name.label') }</label>
           <input
             type="text"
             value={curSettingPrinterST.printerName}
             onChange={(e) => handleFormValueChange(e, 'printerName')}
             style={styles.input}
           />
           <p style={styles.hint}>
             {/* 여러 대를 구분할 때 사용할 이름입니다. */}
             { t('printer_settings.field_name.hint') }
           </p>
         </div>
 
         {/* 용지설정 */}
         <div style={styles.field}>
           <label style={styles.label}>
             { /**용지설정 */ t('printer_settings.field_paper.label') }
           </label>
           <div style={styles.radioGroup}>
             {(SelectPrinterPaperSizes as { name: PrinterPaperSize; value: string }[]).map((opt) => (
               <label
                 key={opt.value}
                 style={{
                   ...styles.radioOption,
                   ...( curSettingPrinterST.paperSize === opt.value ? styles.radioOptionActive : {}),
                 }}
               >
                 <input
                   type="radio"
                   name="printerPaperSize"
                   value={opt.value}
                   checked={ curSettingPrinterST.paperSize === opt.value}
                   onChange={(e) => handleFormValueChange(e, 'paperSize')}
                   style={styles.radioInput}
                 />
                 {opt.name}
               </label>
             ))}
           </div>
         </div>
 
         {/* 연결 유형 */}
         <div style={styles.field}>
           <label style={styles.label}>
             { /**연결 유형 */ t('printer_settings.field_connection.label') }
           </label>
           <div style={styles.radioGroup}>
             {
             SelectPrinterTypes.map((opt) => (
               <label
                 key={opt.value}
                 style={{
                   ...styles.radioOption,
                   ...( curSettingPrinterST.printerType === opt.value ? styles.radioOptionActive : {}),
                 }}
               >
                 <input
                   type="radio"
                   name="printerType"
                   value={opt.value}
                   checked={ curSettingPrinterST.printerType === opt.value}
                   onChange={(e) => handleFormValueChange(e, 'printerType')}
                   style={styles.radioInput}
                 />
                 { t(opt.nameKey as any) }
               </label>
             ))}
           </div>
         </div>

         {/* 출력옵션 */}
         <div style={styles.field}>
           <label style={styles.label}>
            출력옵션
           </label>
            <div style={styles.radioGroup}>
              주문서: 
              <input 
                    type="checkbox" 
                    checked={curSettingPrinterST.orderPrintOption?.isUse || false} 
                    onChange={(e) => handleFormValueChange(e, 'orderPrintOption.isUse')} 
                  />
              영수증: 
              <input 
                    type="checkbox" 
                    checked={curSettingPrinterST.receiptPrintOption?.isUse || false} 
                    onChange={(e) => handleFormValueChange(e, 'receiptPrintOption.isUse')} 
                  />
            </div>
         </div>
 
         {/* 연결 유형별 상세 설정 */}
         <div style={styles.detailPanel}>
           
           { /*### 시리얼 ###*/
           curSettingPrinterST.printerType === PrinterConnectType.SERIAL && (
             <div style={styles.detailGrid}>
               <div style={styles.field}>
                 <label style={styles.label}>
                   { /** 포트 */ t('printer_settings.field_port.label') }
                 </label>
                 <select
                   value={ curSettingPrinterST.serialOption.comPort }
                   onChange={(e) => handleFormValueChange(e, 'serialOption.comPort')}
                   style={styles.select}
                 >
                   <option value="" disabled>
                     { /* 항목을 선택해 주세요 */} 
                     { t('printer_settings.field_port.placeholder') }
                   </option>
                   {
                     serialPortPathsST.map((item) => (
                       <option key={item.value} value={item.value}>{item.name}</option>
                     ))
                   }
                 </select>
               </div>
 
               <div style={styles.field}>
                 <label style={styles.label}>
                   { /**통신 속도 (Baudrate) */ t('printer_settings.field_baudrate.label') }
                 </label>
                 <select
                   value={ curSettingPrinterST.serialOption.baudRate }
                   onChange={(e) => handleFormValueChange(e, 'serialOption.baudRate')}
                   style={styles.select}
                 >
                   <option value= '' disabled>
                     { /* 항목을 선택해 주세요 */} 
                     { t('printer_settings.field_baudrate.placeholder') }
                   </option>
                   {
                     SelectSerialPorts.map((item) => (
                       <option key={item.value} value={item.value}>{item.value.toLocaleString()} bps</option>
                     ))
                   }
                 </select>
               </div>
             </div>
           )}
 
           { /*### 네트워크 ###*/
           curSettingPrinterST.printerType === PrinterConnectType.ETHERNET && (
             <div style={styles.detailGrid}>
               <div style={styles.field}>
                 <label style={styles.label}>IP</label>
                 <input
                   type="text"
                   value={ curSettingPrinterST.ethernetOption.ip }
                   onChange={(e) => handleFormValueChange(e, 'ethernetOption.ip')}
                   placeholder="192.168.1.100"
                   style={styles.input}
                 />
               </div>
 
               <div style={styles.field}>
                 <label style={styles.label}>
                   { /**포트 */ t('printer_settings.field_port.label') }
                 </label>
                 <input
                   type="text"
                   value={ curSettingPrinterST.ethernetOption.port }
                   onChange={(e) => handleFormValueChange(e, 'ethernetOption.port')}
                   placeholder="9100"
                   style={styles.input}
                 />
               </div>
             </div>
           )}
 
           { /*### 프린터장치 ###*/
           curSettingPrinterST.printerType === PrinterConnectType.WINDOWS && (
             <div style={styles.field}>
               <label style={styles.label}>
                 { /**프린터 장치 선택 */ t('printer_settings.field_device.label') }
               </label>
               <select
                 value={ curSettingPrinterST.windowOption.driverName }
                 onChange={(e) => handleFormValueChange(e, 'windowOption.driverName')}
                 style={styles.select}
               >
                 <option value="" disabled>
                   {/* 항목을 선택해 주세요 */} 
                   {t('printer_settings.field_device.placeholder')}
                 </option>
                 {
                   windowPrinterPathsST.map((item) => (
                     <option key={item.value} value={item.value}>{item.name}</option>
                   ))
                 }
               </select>
               <p style={styles.hint}>
                 {/* Windows에 등록된 프린터 목록에서 선택합니다. */}
                 {t('printer_settings.field_device.hint')}
               </p>
             </div>
           )}
         </div>
 
         {/* 하단 액션 */}
         <div style={styles.footer}>
           <button onClick={ handleTestPrint } style={{ ...styles.testButton }} >
             { /**테스트 출력 */ t('printer_settings.action.test_print') }
           </button>
           <button onClick={ handleSavePrinter } style={{ ...styles.testButton }} >
             { /**저장 */ t('common.save') }
           </button>

           <button onClick={ handleDeletePrinter } style={{ ...styles.testButton }} >
             초기화 테스트
           </button>
         </div>
       </div>
     </div>
   );
 }
 
 // 임시 Css
 const styles: Record<string, React.CSSProperties> = {
   page: {
     padding: '32px',
     display: 'flex',
     justifyContent: 'center',
     background: '#F5F6F8',
     minHeight: '100%',
     fontFamily: '"Segoe UI", "Noto Sans", sans-serif',
   },
   card: {
     width: '100%',
     maxWidth: '520px',
     background: '#FFFFFF',
     borderRadius: '10px',
     border: '1px solid #E3E5E9',
     padding: '28px',
     display: 'flex',
     flexDirection: 'column',
     gap: '22px',
   },
   header: {
     borderBottom: '1px solid #EDEEF1',
     paddingBottom: '16px',
   },
   title: {
     margin: 0,
     fontSize: '18px',
     fontWeight: 600,
     color: '#1A1D23',
   },
   subtitle: {
     margin: '6px 0 0',
     fontSize: '13px',
     color: '#8A8F98',
   },
   field: {
     display: 'flex',
     flexDirection: 'column',
     gap: '6px',
   },
   label: {
     fontSize: '13px',
     fontWeight: 600,
     color: '#3C4049',
   },
   hint: {
     margin: 0,
     fontSize: '12px',
     color: '#9AA0A8',
   },
   input: {
     height: '38px',
     padding: '0 12px',
     fontSize: '14px',
     border: '1px solid #D7D9DE',
     borderRadius: '6px',
     outline: 'none',
     color: '#1A1D23',
     background: '#FFFFFF',
   },
   select: {
     height: '38px',
     padding: '0 12px',
     fontSize: '14px',
     border: '1px solid #D7D9DE',
     borderRadius: '6px',
     outline: 'none',
     color: '#1A1D23',
     background: '#FFFFFF',
   },
   radioGroup: {
     display: 'flex',
     gap: '8px',
   },
   radioOption: {
     flex: 1,
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     gap: '6px',
     height: '38px',
     fontSize: '13px',
     fontWeight: 500,
     color: '#5B6068',
     borderWidth: '1px',
     borderStyle: 'solid',
     borderColor: '#D7D9DE',   
     borderRadius: '6px',
     cursor: 'pointer',
     userSelect: 'none',
 },
  radioOptionActive: {
     borderColor: '#3E63DD',  
     color: '#3E63DD',
     background: '#F0F3FF',
 },
   radioInput: {
     display: 'none',
   },
   detailPanel: {
     padding: '16px',
     background: '#FAFBFC',
     border: '1px solid #EDEEF1',
     borderRadius: '8px',
   },
   detailGrid: {
     display: 'flex',
     flexDirection: 'column',
     gap: '14px',
   },
   footer: {
     display: 'flex',
     alignItems: 'center',
     gap: '12px',
     paddingTop: '4px',
   },
   testButton: {
     height: '38px',
     padding: '0 18px',
     fontSize: '13px',
     fontWeight: 600,
     color: '#FFFFFF',
     background: '#3E63DD',
     border: 'none',
     borderRadius: '6px',
     cursor: 'pointer',
   },
   testButtonDisabled: {
     background: '#A9B8EF',
     cursor: 'default',
   },
   statusSuccess: {
     fontSize: '13px',
     color: '#1A8A5F',
     fontWeight: 500,
   },
   statusError: {
     fontSize: '13px',
     color: '#D9483B',
     fontWeight: 500,
   },
 };