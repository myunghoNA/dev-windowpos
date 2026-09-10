import { TranslationSchema } from '../types/i18n.type';

export const ar: TranslationSchema = {
    
    /**시스템공통 */
    common: {
        save: 'حفظ',
        cancel: 'إلغاء',
        emergency: 'الدفع الطارئ',
        confirm: 'تأكيد',
        open: 'افتح',
        hide: 'إخفاء',
        max: 'تكبير',
        min: 'تصغير',
        exit: 'إغلاق البرنامج',
    },
    status: {
        online: 'متصل',
        offline: 'غير متصل (الطوارئ)',
        pending_count: '{{count}} عملية دفع معلقة.', 
    },
    update: {
        disk_shortage_title: 'مساحة القرص غير كافية',
        disk_shortage_body: 'مطلوب مساحة فارغة لا تقل عن 1 جيجابايت. يرجى توفير مساحة على القرص.',
        notify_title: 'إشعار التحديث',
        notify_message: 'تم إصدار نسخة جديدة (v{{version}}).\nهل تريد تنزيلها الآن؟',
        btn_install_now: 'تثبيت الآن',
        btn_later: 'لاحقاً',
        ready_title: 'التحديث جاهز',
        ready_message: 'تم اكتمال تنزيل ملف التحديث.\nهل تريد إعادة تشغيل البرنامج لإكمال التثبيت؟',
        btn_restart: 'نعم (إعادة التشغيل)',
    },
    info: {
        save_complete: 'تم الحفظ', 
    },
    warn: {
        title: 'تنبيه',
        required_select: 'الرجاء تحديد عنصر.',
        required_login: 'الرجاء إدخال معرف المستخدم وكلمة المرور.',
    },
    error: {
        title_fail: 'فشل',
        try_again_later: 'يرجى المحاولة مرة أخرى لاحقاً.', 
        api: {
            BAD_REQUEST: 'طلب غير صالح.',
            NOT_FOUND: 'المحتوى المطلوب غير موجود.',
            UNAUTHORIZED: 'المصادقة مطلوبة.',
            FORBIDDEN: 'ليس لديك صلاحية.',
            DUPLICATED: 'البيانات التي تحاول إنشاؤها موجودة بالفعل.',
            NOT_OPENED: 'المتجر غير مفتوح.',
            ORDER_CANCELED_BY_CHANNEL: 'تم إلغاء هذا الطلب من قبل القناة.',
            ORDER_ALREADY_TRANSITIONED: 'تم معالجة هذا الطلب بالفعل.',
            ORDER_REFUSE_REJECTED: 'رفضت القناة طلب الرفض.',
            ORDER_CANCEL_REJECTED: 'رفضت القناة طلب الإلغاء.',
            USER_NOT_FOUND: 'معرف المستخدم غير موجود.',
            USER_NOT_USE: 'هذا الحساب معطل.',
            INVALID_PASSWORD: 'كلمة المرور غير مطابقة.',
            INTERNAL_SERVER_ERROR: 'حدث خطأ داخلي في النظام.',
            EXTERNAL_SERVER_ERROR: 'حدث خطأ في الخادم الخارجي.',
            UNKNOWN_ERROR: 'حدث خطأ غير معروف. يرجى المحاولة مرة أخرى لاحقاً.',
        },
    },

    /**프린터 세팅 */
    printer_settings: {
        title: 'إعدادات الطابعة',
        description: 'قم بتعيين معلومات الاتصال لطابعة الإيصالات/الطلبات.',
        field_name: {
            label: 'اسم الطابعة',
            hint: 'الاسم المستخدم لتمييز طابعات متعددة.',
        },
        field_paper: {
            label: 'إعدادات الورق',
        },
        field_connection: {
            label: 'نوع الاتصال',
            type_serial: 'منفذ تسلسلي (Serial Port)',
            type_network: 'شبكة (Network)',
            type_windows: 'برنامج تشغيل ويندوز',
        },
        field_device: {
            label: 'تحديد جهاز الطابعة',
            placeholder: 'يرجى تحديد عنصر',
            hint: 'اختر من قائمة الطابعات المسجلة في ويندوز.',
        },
        field_port: {
            label: 'المنفذ (Port)',
            placeholder: 'يرجى تحديد عنصر',
        },
        field_baudrate: {
            label: 'سرعة الاتصال (Baudrate)',
            placeholder: 'يرجى تحديد عنصر',
        },
        action: {
            test_print: 'طباعة تجريبية',
        },

        notify: {
            save_success: 'تم حفظ إعدادات الطابعة.',
        },

        validation: {
            require_name: 'يرجى إدخال اسم الطابعة.',
            require_type: 'يرجى تحديد نوع الاتصال.',
            require_device: 'يرجى تحديد طابعة للاتصال بها.',
            require_port: 'يرجى تحديد منفذ الاتصال.',
            require_baudrate: 'يرجى تحديد سرعة الاتصال.',
            invalid_ip: 'تنسيق عنوان IP غير صالح (مثال: 192.168.0.1).',
            invalid_network_port: 'يرجى إدخال رقم منفذ صالح (1 - 65535).',
        },
    },

    dialog: {
        close_title: 'إغلاق النظام',
        close_message: 'هل تريد إغلاق Flownet POS؟',
        close_detail: 'جميع بيانات الطلبات محفوظة بأمان في السحابة. يرجى الضغط على إغلاق إذا انتهيت من العمل.',
    },

    notification: {
        new_order: {
            title: 'طلب جديد',
            body: 'تم استلام طلب جديد.',
        },
        system: {
            title: 'إشعار',
            body: 'تم نشر إشعار جديد.',
        },
        default: {
            title: 'تنبيه',
            body: 'تم تسجيل رسالة إشعار.',
        },
    },
};