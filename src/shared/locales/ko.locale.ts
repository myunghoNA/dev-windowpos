import { TranslationSchema } from '@shared/types/i18n.type';

export const ko: TranslationSchema = {
     /**시스템공통 */
    common: {
        save: '저장',
        cancel: '취소',
        emergency: '비상결제',
        confirm: '확인',
        open: '열기',
        hide: '숨기기',
        max: '최대화',
        min: '최소화',
        exit: '프로그램 종료',
    },
    status: {
        online: '온라인',
        offline: '오프라인 (비상모드)',
        pending_count: '{{count}}건의 결제가 대기 중입니다.',
    },
    update: {
        disk_shortage_title: '업데이트 공간 부족',
        disk_shortage_body: '최소 1GB 이상의 여유 공간이 필요합니다. 공간을 확보해주세요.',
        notify_title: '업데이트 알림',
        notify_message: '새로운 버전(v{{version}})이 출시되었습니다.\n지금 다운로드하시겠습니까?',
        btn_install_now: '지금 설치',
        btn_later: '나중에',
        ready_title: '업데이트 준비 완료',
        ready_message: '업데이트 파일 다운로드가 완료되었습니다.\n프로그램을 재시작하여 설치를 완료할까요?',
        btn_restart: '예 (재시작)',
    },
    info: {
        save_complete: '저장 완료',
    },
    warn: {
        title: '확인필요',
        required_select: '항목을 선택해 주세요',
        required_login: '아이디와 비밀번호를 입력해주세요',
    },
    error: {
        title_fail: '실패',
        try_again_later: '잠시 후 다시 시도해 주세요.',
        api: {
            BAD_REQUEST: '잘못된 요청입니다.',
            NOT_FOUND: '요청 내용을 찾을 수 없습니다.',
            UNAUTHORIZED: '인증이 필요합니다.',
            FORBIDDEN: '권한이 없습니다.',
            DUPLICATED: '생성하려는 데이터가 이미 존재합니다.',
            NOT_OPENED: '매장이 오픈되지 않았습니다.',
            ORDER_CANCELED_BY_CHANNEL: '채널에서 취소된 주문입니다.',
            ORDER_ALREADY_TRANSITIONED: '이미 처리된 주문입니다.',
            ORDER_REFUSE_REJECTED: '채널이 거절 요청을 반려했습니다.',
            ORDER_CANCEL_REJECTED: '채널이 취소 요청을 반려했습니다.',
            USER_NOT_FOUND: '존재하지 않는 아이디입니다.',
            USER_NOT_USE: '사용이 중지된 계정입니다.',
            INVALID_PASSWORD: '비밀번호가 일치하지 않습니다.',
            INTERNAL_SERVER_ERROR: '시스템 내부 오류가 발생했습니다.',
            EXTERNAL_SERVER_ERROR: '외부 서버 오류가 발생했습니다.',
            UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        },
    },
    /**프린터 세팅 */
    printer_settings: {
        title: '프린터 설정',
        description: '영수증/주문서 프린터의 연결 정보를 설정합니다.',
        
        field_name: {
            label: '프린터 이름',
            hint: '여러 대를 구분할 때 사용할 이름입니다.',
        },
        
        field_paper: {
           label: '용지설정',
        },
        
        field_connection: {
            label: '연결 유형',
            type_serial: '시리얼 포트',
            type_network: '네트워크',
            type_windows: '윈도우 드라이버',
        },
        
        field_device: {
            label: '프린터 장치 선택',
            placeholder: '항목을 선택해 주세요',
            hint: 'Windows에 등록된 프린터 목록에서 선택합니다.',
        },

        field_port: {
            label: '포트',
            placeholder: '항목을 선택해 주세요',
        },
        field_baudrate: {
            label: '통신 속도 (Baudrate)',
            placeholder: '항목을 선택해 주세요',
        },

        action: {
            test_print: '테스트 출력',
        },

        notify: {
            save_success: '프린터 설정이 저장되었습니다.',
        },

        validation: {
            require_name: '프린터 이름을 입력해 주세요.',
            require_type: '연결 유형을 선택해 주세요.',
            require_device: '연결 프린터를 선택해 주세요.',
            require_port: '연결 포트를 선택해 주세요.',
            require_baudrate: '연결 속도를 선택해 주세요.',
            invalid_ip: '올바른 IP 주소 형식(예: 192.168.0.1)이 아닙니다.',
            invalid_network_port: '올바른 Port 번호를 입력해 주세요. (1 ~ 65535)',
        },
    },
    dialog: {
        close_title: '시스템 종료',
        close_message: 'Flownet POS를 종료하시겠습니까?',
        close_detail: '모든 주문 데이터는 클라우드에 안전하게 보관 중입니다.\n영업을 마치셨다면 종료를 눌러주세요.',
    },

    notification: {
        new_order: {
            title: '신규주문',
            body: '신규 주문이 들어왔습니다.',
        },
        system: {
            title: '공지사항',
            body: '새로운 공지사항이 등록되었습니다.',
        },
        default: {
            title: '알림',
            body: '알림메시지가 등록되었습니다..',
        },
    },
    
};