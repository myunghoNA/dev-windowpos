/**
 * @description local
 */
export type LangType = 'ko' | 'en' | 'ar';

/**
 * @description 메시지 규격
 */
export type TranslationSchema = {
    /**시스템공통 */
    common: {
        save: string;
        cancel: string;
        emergency: string;
        confirm: string;
        open: string;
        hide: string;
        max: string;
        min: string;
        exit: string;
    };
    status: {
        online: string;
        offline: string;
        pending_count: string;
    };
    update: {
        disk_shortage_title: string;
        disk_shortage_body: string;
        notify_title: string;
        notify_message: string;
        btn_install_now: string;
        btn_later: string;
        ready_title: string;
        ready_message: string;
        btn_restart: string;
    };

    info: {
        save_complete: string; 
    };

    warn: {
        title: string;
        required_select: string;
        required_login: string;
    };

    error: {
        title_fail: string;
        try_again_later: string;
        api: {
            BAD_REQUEST: string;
            NOT_FOUND: string;
            UNAUTHORIZED: string;
            FORBIDDEN: string;
            DUPLICATED: string;
            NOT_OPENED: string;
            ORDER_CANCELED_BY_CHANNEL: string;
            ORDER_ALREADY_TRANSITIONED: string;
            ORDER_REFUSE_REJECTED: string;
            ORDER_CANCEL_REJECTED: string;
            USER_NOT_FOUND: string;
            USER_NOT_USE: string;
            INVALID_PASSWORD: string;
            INTERNAL_SERVER_ERROR: string;
            EXTERNAL_SERVER_ERROR: string;
            UNKNOWN_ERROR: string;
        }
    };

    /**프린터 세팅 */
    printer_settings: {
        title: string;
        description: string;
        field_name: {
            label: string;
            hint: string;
        };
        field_paper: {
            label: string;
        };
        field_connection: {
            label: string;
            type_serial: string;
            type_network: string;
            type_windows: string;
        };
        field_device: {
            label: string;
            placeholder: string;
            hint: string;
        };
        field_port: {
            label: string;
            placeholder: string;
        };
        field_baudrate: {
            label: string;
            placeholder: string;
        };
        action: {
            test_print: string;
        };
        notify: {
            save_success: string;
        };
        validation: {
            require_name: string;
            require_type: string;
            require_device: string;
            require_port: string;
            require_baudrate: string;
            invalid_ip: string;
            invalid_network_port: string;
        };
    };

    /**다이얼로그 */
    dialog: {
        close_title: string;
        close_message: string;
        close_detail: string;
    };

    /**알림 */
    notification: {
        new_order: {
            title: string;
            body: string;
        };
        system: {
            title: string;
            body: string;
        };
        default: {
            title: string;
            body: string;
        };
    };

};