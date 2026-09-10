import { TranslationSchema } from '../types/i18n.type';

export const en: TranslationSchema = {
    
     /**시스템공통 */
    common: {
        save: 'Save',
        cancel: 'Cancel',
        emergency: 'Emergency Pay',
        confirm: 'Confirm',
        open: 'Open',
        hide: 'Hide',
        max: 'Maximize',
        min: 'Minimize',
        exit: 'Exit Application',
    },
    status: {
        online: 'Online',
        offline: 'Offline (Emergency)',
        pending_count: '{{count}} payments are pending.',
    },
    update: {
        disk_shortage_title: 'Insufficient Disk Space',
        disk_shortage_body: 'At least 1GB of free space is required. Please free up disk space.',
        notify_title: 'Update Notification',
        notify_message: 'A new version (v{{version}}) has been released.\nWould you like to download it now?',
        btn_install_now: 'Install Now',
        btn_later: 'Later',
        ready_title: 'Update Ready',
        ready_message: 'The update download has been completed.\nWould you like to restart the application to complete the installation?',
        btn_restart: 'Yes (Restart)',
    },
    info: {
        save_complete: 'Save Complete',
    },
    warn: {
        title: 'Notice',
        required_select: 'Please select an option.',
        required_login: 'Please enter your ID and password.',
    },
    error: {
        title_fail: 'Failed', 
        try_again_later: 'Please try again later.',
        api: {
            BAD_REQUEST: 'Invalid request.',
            NOT_FOUND: 'Requested content not found.',
            UNAUTHORIZED: 'Authentication is required.',
            FORBIDDEN: 'Access is denied.',
            DUPLICATED: 'The data you are trying to create already exists.',
            NOT_OPENED: 'The store is not open.',
            ORDER_CANCELED_BY_CHANNEL: 'This order was canceled by the channel.',
            ORDER_ALREADY_TRANSITIONED: 'This order has already been processed.',
            ORDER_REFUSE_REJECTED: 'The channel rejected the refusal request.',
            ORDER_CANCEL_REJECTED: 'The channel rejected the cancellation request.',
            USER_NOT_FOUND: 'The ID does not exist.',
            USER_NOT_USE: 'This account has been deactivated.',
            INVALID_PASSWORD: 'The password does not match.',
            INTERNAL_SERVER_ERROR: 'An internal system error has occurred.',
            EXTERNAL_SERVER_ERROR: 'An external server error has occurred.',
            UNKNOWN_ERROR: 'An unknown error occurred. Please try again later.',
        },
    },

    /**프린터 세팅 */
    printer_settings: {
        title: 'Printer Settings',
        description: 'Configure the connection information for the receipt/order printer.',
        field_name: {
            label: 'Printer Name',
            hint: 'The name used to distinguish multiple printers.',
        },
        field_paper: {
            label: 'Paper Settings',
        },
        field_connection: {
            label: 'Connection Type',
            type_serial: 'Serial Port',
            type_network: 'Network',
            type_windows: 'Windows Driver',
        },
        field_device: {
            label: 'Select Printer Device',
            placeholder: 'Please select an item',
            hint: 'Select from the list of printers registered in Windows.',
        },
        field_port: {
            label: 'Port',
            placeholder: 'Please select an item',
        },
        field_baudrate: {
            label: 'Baudrate',
            placeholder: 'Please select an item',
        },
        action: {
            test_print: 'Test Print',
        },

        notify: {
            save_success: 'Printer settings have been saved.',
        },

        validation: {
            require_name: 'Please enter a printer name.',
            require_type: 'Please select a connection type.',
            require_device: 'Please select a printer to connect.',
            require_port: 'Please select a connection port.',
            require_baudrate: 'Please select a baud rate.',
            invalid_ip: 'Invalid IP address format (e.g., 192.168.0.1).',
            invalid_network_port: 'Please enter a valid port number (1 - 65535).',
        },
    },

    dialog: {
        close_title: 'Exit System',
        close_message: 'Are you sure you want to exit Flownet POS?',
        close_detail: 'All order data is safely stored in the cloud.\nIf you are finished for the day, please click Exit.',
    },

    notification: {
        new_order: {
            title: 'New Order',
            body: 'A new order has been received.',
        },
        system: {
            title: 'Notice',
            body: 'A new notice has been posted.',
        },
        default: {
            title: 'Notification',
            body: 'A notification message has been registered.',
        },
    },
};