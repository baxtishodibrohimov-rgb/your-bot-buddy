// Ko'p tilli matnlar
export type Lang = 'uz' | 'ru';

export const t = {
  chooseLanguage: {
    uz: '🇺🇿 Tilni tanlang / 🇷🇺 Выберите язык',
    ru: '🇺🇿 Tilni tanlang / 🇷🇺 Выберите язык',
  },
  welcome: {
    uz: 'Assalomu alaykum! Biodent stomatologiya klinikasiga xush kelibsiz! 🦷\n\nKerakli bo\'limni tanlang:',
    ru: 'Здравствуйте! Добро пожаловать в стоматологическую клинику Biodent! 🦷\n\nВыберите нужный раздел:',
  },
  menu: {
    about: { uz: 'ℹ️ Klinika haqida', ru: 'ℹ️ О клинике' },
    services: { uz: '🦷 Xizmatlar', ru: '🦷 Услуги' },
    doctors: { uz: '👨‍⚕️ Shifokorlar', ru: '👨‍⚕️ Врачи' },
    address: { uz: '📍 Manzil', ru: '📍 Адрес' },
    contact: { uz: '📞 Bog\'lanish', ru: '📞 Связаться' },
    appointment: { uz: '📅 Qabulga yozilish', ru: '📅 Записаться на приём' },
    medicalCard: { uz: '📋 Mening tibbiy kartam', ru: '📋 Моя медицинская карта' },
    complaint: { uz: '✍️ Shikoyat / Taklif', ru: '✍️ Жалоба / Предложение' },
    changeLang: { uz: '🌐 Tilni o\'zgartirish', ru: '🌐 Сменить язык' },
  },
  back: { uz: '⬅️ Orqaga', ru: '⬅️ Назад' },
  cancel: { uz: '❌ Bekor qilish', ru: '❌ Отмена' },
  cancelled: { uz: 'Bekor qilindi.', ru: 'Отменено.' },
  unknownCommand: {
    uz: 'Iltimos, menyudan tanlang yoki /start ni bosing.',
    ru: 'Пожалуйста, выберите из меню или нажмите /start.',
  },
  // Tibbiy karta
  mcStart: {
    uz: '📋 Tibbiy karta to\'ldirish\n\nIltimos, savollarga javob bering. Istalgan vaqtda /cancel orqali bekor qilishingiz mumkin.\n\n1️⃣ To\'liq ism-sharifingizni kiriting:',
    ru: '📋 Заполнение медицинской карты\n\nПожалуйста, ответьте на вопросы. Вы можете отменить в любой момент через /cancel.\n\n1️⃣ Введите ваше полное имя:',
  },
  mcAskBirth: {
    uz: '2️⃣ Tug\'ilgan sanangiz (kun.oy.yil, masalan: 15.03.1990):',
    ru: '2️⃣ Ваша дата рождения (день.месяц.год, например: 15.03.1990):',
  },
  mcAskGender: {
    uz: '3️⃣ Jinsingiz (Erkak / Ayol):',
    ru: '3️⃣ Ваш пол (Мужской / Женский):',
  },
  mcAskPhone: {
    uz: '4️⃣ Telefon raqamingiz:',
    ru: '4️⃣ Ваш номер телефона:',
  },
  mcAskAddress: {
    uz: '5️⃣ Yashash manzilingiz:',
    ru: '5️⃣ Ваш адрес проживания:',
  },
  mcAskAllergies: {
    uz: '6️⃣ Allergiyalaringiz bormi? (Bo\'lmasa "yo\'q" deb yozing):',
    ru: '6️⃣ Есть ли у вас аллергии? (Если нет, напишите "нет"):',
  },
  mcAskChronic: {
    uz: '7️⃣ Surunkali kasalliklaringiz bormi?',
    ru: '7️⃣ Есть ли у вас хронические заболевания?',
  },
  mcAskMeds: {
    uz: '8️⃣ Hozir doimiy qabul qilayotgan dorilaringiz bormi?',
    ru: '8️⃣ Принимаете ли вы постоянные лекарства?',
  },
  mcAskPrev: {
    uz: '9️⃣ Avval qanday stomatologik davolanishlar olganingiz?',
    ru: '9️⃣ Какие стоматологические лечения вы получали ранее?',
  },
  mcSaved: {
    uz: '✅ Tibbiy kartangiz saqlandi! Klinikaga tashrif buyurganingizda shifokor sizning ma\'lumotlaringizni ko\'ra oladi.',
    ru: '✅ Ваша медицинская карта сохранена! При посещении клиники врач сможет увидеть вашу информацию.',
  },
  mcExisting: {
    uz: '📋 Sizning tibbiy kartangiz:\n\n',
    ru: '📋 Ваша медицинская карта:\n\n',
  },
  mcUpdate: {
    uz: '🔄 Yangilash',
    ru: '🔄 Обновить',
  },
  // Shikoyat
  complaintAsk: {
    uz: '✍️ Shikoyat yoki taklifingizni yozing. Biz uni albatta ko\'rib chiqamiz.\n\n/cancel — bekor qilish',
    ru: '✍️ Напишите вашу жалобу или предложение. Мы обязательно её рассмотрим.\n\n/cancel — отменить',
  },
  complaintSaved: {
    uz: '✅ Rahmat! Murojaatingiz qabul qilindi. Tez orada javob beramiz.',
    ru: '✅ Спасибо! Ваше обращение принято. Мы скоро ответим.',
  },
  contactInfo: {
    uz: '📞 Bog\'lanish:\n\nTelefon: ',
    ru: '📞 Связаться:\n\nТелефон: ',
  },
  noServices: {
    uz: 'Xizmatlar ro\'yxati hozircha bo\'sh.',
    ru: 'Список услуг пока пуст.',
  },
  noDoctors: {
    uz: 'Shifokorlar ro\'yxati hozircha bo\'sh.',
    ru: 'Список врачей пока пуст.',
  },
  servicesTitle: {
    uz: '🦷 Bizning xizmatlar:\n\n',
    ru: '🦷 Наши услуги:\n\n',
  },
  doctorsTitle: {
    uz: '👨‍⚕️ Bizning shifokorlar:\n\n',
    ru: '👨‍⚕️ Наши врачи:\n\n',
  },
  yearsExperience: { uz: 'yillik tajriba', ru: 'лет опыта' },
  priceFrom: { uz: 'narx', ru: 'цена' },
  sum: { uz: 'so\'m', ru: 'сум' },

  // ========== ADMIN ==========
  adminWelcome: {
    uz: '🛠 <b>Admin panel</b>\n\nKerakli bo\'limni tanlang:',
    ru: '🛠 <b>Админ-панель</b>\n\nВыберите раздел:',
  },
  adminNotAuthorized: {
    uz: '⛔️ Sizda admin huquqlari yo\'q.',
    ru: '⛔️ У вас нет прав администратора.',
  },
  adminMenu: {
    clinic: { uz: '🏥 Klinika ma\'lumotlari', ru: '🏥 Информация о клинике' },
    services: { uz: '🦷 Xizmatlar', ru: '🦷 Услуги' },
    doctors: { uz: '👨‍⚕️ Shifokorlar', ru: '👨‍⚕️ Врачи' },
    patients: { uz: '👥 Bemorlar', ru: '👥 Пациенты' },
    complaints: { uz: '✉️ Shikoyatlar', ru: '✉️ Жалобы' },
    stats: { uz: '📊 Statistika', ru: '📊 Статистика' },
    admins: { uz: '🔑 Adminlar', ru: '🔑 Админы' },
    exit: { uz: '🚪 Chiqish', ru: '🚪 Выход' },
  },
  adminBack: { uz: '⬅️ Admin menyu', ru: '⬅️ Меню админа' },
  adminCancel: { uz: '❌ Bekor qilish', ru: '❌ Отмена' },
  adminAdd: { uz: '➕ Qo\'shish', ru: '➕ Добавить' },
  adminEdit: { uz: '✏️ Tahrirlash', ru: '✏️ Редактировать' },
  adminDelete: { uz: '🗑 O\'chirish', ru: '🗑 Удалить' },
  adminSaved: { uz: '✅ Saqlandi.', ru: '✅ Сохранено.' },
  adminDeleted: { uz: '🗑 O\'chirildi.', ru: '🗑 Удалено.' },
  adminCancelled: { uz: 'Bekor qilindi.', ru: 'Отменено.' },
  adminPickField: { uz: 'Qaysi maydonni o\'zgartirmoqchisiz?', ru: 'Какое поле изменить?' },
  adminEnterValue: { uz: 'Yangi qiymatni kiriting:', ru: 'Введите новое значение:' },
  adminSkip: { uz: '— (o\'tkazib yuborish)', ru: '— (пропустить)' },

  // Klinika
  clinicFields: {
    name_uz: { uz: 'Nomi (UZ)', ru: 'Название (UZ)' },
    name_ru: { uz: 'Nomi (RU)', ru: 'Название (RU)' },
    about_uz: { uz: 'Klinika haqida (UZ)', ru: 'О клинике (UZ)' },
    about_ru: { uz: 'Klinika haqida (RU)', ru: 'О клинике (RU)' },
    address_uz: { uz: 'Manzil (UZ)', ru: 'Адрес (UZ)' },
    address_ru: { uz: 'Manzil (RU)', ru: 'Адрес (RU)' },
    working_hours_uz: { uz: 'Ish vaqti (UZ)', ru: 'Часы работы (UZ)' },
    working_hours_ru: { uz: 'Ish vaqti (RU)', ru: 'Часы работы (RU)' },
    phone: { uz: 'Telefon', ru: 'Телефон' },
    instagram: { uz: 'Instagram', ru: 'Instagram' },
    telegram_channel: { uz: 'Telegram kanal', ru: 'Telegram канал' },
    location_url: { uz: 'Xarita havolasi', ru: 'Ссылка на карту' },
  },

  // Xizmat / Shifokor formalari
  svcAskNameUz: { uz: 'Xizmat nomi (UZ):', ru: 'Название услуги (UZ):' },
  svcAskNameRu: { uz: 'Xizmat nomi (RU):', ru: 'Название услуги (RU):' },
  svcAskDescUz: { uz: 'Tavsif (UZ) yoki "—":', ru: 'Описание (UZ) или "—":' },
  svcAskDescRu: { uz: 'Tavsif (RU) yoki "—":', ru: 'Описание (RU) или "—":' },
  svcAskPriceFrom: { uz: 'Narx (dan, faqat raqam) yoki "—":', ru: 'Цена (от, число) или "—":' },
  svcAskPriceTo: { uz: 'Narx (gacha) yoki "—":', ru: 'Цена (до) или "—":' },

  docAskName: { uz: 'Shifokor F.I.SH:', ru: 'Ф.И.О. врача:' },
  docAskSpecUz: { uz: 'Mutaxassisligi (UZ):', ru: 'Специальность (UZ):' },
  docAskSpecRu: { uz: 'Mutaxassisligi (RU):', ru: 'Специальность (RU):' },
  docAskExp: { uz: 'Tajriba (yil, raqam) yoki "—":', ru: 'Опыт (лет, число) или "—":' },
  docAskBioUz: { uz: 'Bio (UZ) yoki "—":', ru: 'Био (UZ) или "—":' },
  docAskBioRu: { uz: 'Bio (RU) yoki "—":', ru: 'Био (RU) или "—":' },

  // Adminlar
  adminAskTgId: { uz: 'Yangi adminning Telegram ID raqamini yuboring:', ru: 'Отправьте Telegram ID нового админа:' },
  adminAskName: { uz: 'Ismi (ixtiyoriy, "—" o\'tkazish):', ru: 'Имя (опционально, "—" пропустить):' },
  adminListEmpty: { uz: 'Adminlar yo\'q.', ru: 'Админов нет.' },

  // Klinika sehrgari (wizard)
  clinicWizardBtn: {
    uz: '📝 To\'liq to\'ldirish (sehrgar)',
    ru: '📝 Полное заполнение (мастер)',
  },
  clinicWizardStart: {
    uz: '📝 <b>Klinika ma\'lumotlarini to\'ldirish sehrgari</b>\n\nMen sizga 8 ta savol beraman. Har bir javobdan keyin keyingi savol keladi.\n\n💡 Maydonni o\'tkazib yuborish uchun <code>—</code> (chiziq) yuboring.\nBekor qilish uchun /cancel.\n\nBoshlaymi?',
    ru: '📝 <b>Мастер заполнения информации о клинике</b>\n\nЯ задам вам 8 вопросов. После каждого ответа будет следующий вопрос.\n\n💡 Чтобы пропустить поле, отправьте <code>—</code> (тире).\nДля отмены — /cancel.\n\nНачнём?',
  },
  clinicWizardStartBtn: { uz: '▶️ Boshlash', ru: '▶️ Начать' },
  clinicWizardStep: { uz: 'Qadam', ru: 'Шаг' },
  clinicWizardOf: { uz: 'dan', ru: 'из' },

  clinicWizQ: {
    name_uz: {
      uz: '1️⃣ <b>Klinika nomi (o\'zbekcha)</b>\n\nMasalan: <i>Biodent stomatologiya klinikasi</i>',
      ru: '1️⃣ <b>Название клиники (на узбекском)</b>\n\nПример: <i>Biodent stomatologiya klinikasi</i>',
    },
    name_ru: {
      uz: '2️⃣ <b>Klinika nomi (ruscha)</b>\n\nMasalan: <i>Стоматологическая клиника Биодент</i>',
      ru: '2️⃣ <b>Название клиники (на русском)</b>\n\nПример: <i>Стоматологическая клиника Биодент</i>',
    },
    address_uz: {
      uz: '3️⃣ <b>Manzil (o\'zbekcha)</b>\n\nMasalan: <i>Toshkent sh., Chilonzor t., Bunyodkor 12</i>',
      ru: '3️⃣ <b>Адрес (на узбекском)</b>\n\nПример: <i>Toshkent sh., Chilonzor t., Bunyodkor 12</i>',
    },
    address_ru: {
      uz: '4️⃣ <b>Manzil (ruscha)</b>\n\nMasalan: <i>г. Ташкент, Чиланзарский р-н, ул. Бунёдкор 12</i>',
      ru: '4️⃣ <b>Адрес (на русском)</b>\n\nПример: <i>г. Ташкент, Чиланзарский р-н, ул. Бунёдкор 12</i>',
    },
    phone: {
      uz: '5️⃣ <b>Telefon raqam</b>\n\nMasalan: <i>+998 90 123 45 67</i>',
      ru: '5️⃣ <b>Номер телефона</b>\n\nПример: <i>+998 90 123 45 67</i>',
    },
    working_hours_uz: {
      uz: '6️⃣ <b>Ish vaqti (o\'zbekcha)</b>\n\nMasalan: <i>Du-Sha: 9:00 - 19:00, Yak: dam olish</i>',
      ru: '6️⃣ <b>Часы работы (на узбекском)</b>\n\nПример: <i>Du-Sha: 9:00 - 19:00, Yak: dam olish</i>',
    },
    working_hours_ru: {
      uz: '7️⃣ <b>Ish vaqti (ruscha)</b>\n\nMasalan: <i>Пн-Сб: 9:00 - 19:00, Вс: выходной</i>',
      ru: '7️⃣ <b>Часы работы (на русском)</b>\n\nПример: <i>Пн-Сб: 9:00 - 19:00, Вс: выходной</i>',
    },
    about_uz: {
      uz: '8️⃣ <b>Klinika haqida (o\'zbekcha)</b>\n\nQisqacha tavsif. Masalan: <i>Biodent — zamonaviy uskunalar bilan jihozlangan stomatologiya klinikasi.</i>',
      ru: '8️⃣ <b>О клинике (на узбекском)</b>\n\nКраткое описание.',
    },
    about_ru: {
      uz: '9️⃣ <b>Klinika haqida (ruscha)</b>\n\nQisqacha tavsif (ruscha).',
      ru: '9️⃣ <b>О клинике (на русском)</b>\n\nКраткое описание клиники.',
    },
    instagram: {
      uz: '🔟 <b>Instagram havolasi</b>\n\nMasalan: <i>https://instagram.com/biodent</i>\n\nYo\'q bo\'lsa <code>—</code> yuboring.',
      ru: '🔟 <b>Ссылка Instagram</b>\n\nПример: <i>https://instagram.com/biodent</i>\n\nЕсли нет — отправьте <code>—</code>.',
    },
    telegram_channel: {
      uz: '1️⃣1️⃣ <b>Telegram kanal</b>\n\nMasalan: <i>https://t.me/biodent</i> yoki <code>—</code>',
      ru: '1️⃣1️⃣ <b>Telegram канал</b>\n\nПример: <i>https://t.me/biodent</i> или <code>—</code>',
    },
    location_url: {
      uz: '1️⃣2️⃣ <b>Xarita havolasi</b> (Google Maps / Yandex)\n\nMasalan: <i>https://goo.gl/maps/...</i> yoki <code>—</code>',
      ru: '1️⃣2️⃣ <b>Ссылка на карту</b> (Google Maps / Yandex)\n\nПример: <i>https://goo.gl/maps/...</i> или <code>—</code>',
    },
  },

  clinicWizardReview: {
    uz: '📋 <b>Ko\'rib chiqing</b>\n\nQuyidagi ma\'lumotlar saqlanadi:',
    ru: '📋 <b>Проверьте</b>\n\nБудут сохранены следующие данные:',
  },
  clinicWizardSave: { uz: '✅ Saqlash', ru: '✅ Сохранить' },
  clinicWizardRestart: { uz: '🔄 Qaytadan boshlash', ru: '🔄 Начать заново' },
  clinicWizardCancel: { uz: '❌ Bekor qilish', ru: '❌ Отменить' },
  clinicWizardDone: {
    uz: '✅ <b>Klinika ma\'lumotlari saqlandi!</b>\n\nEndi bemorlar yangi ma\'lumotlarni ko\'radi.',
    ru: '✅ <b>Информация о клинике сохранена!</b>\n\nТеперь пациенты увидят новые данные.',
  },

  // Shikoyatlar
  complaintsEmpty: { uz: 'Shikoyatlar yo\'q.', ru: 'Жалоб нет.' },
  complaintReply: { uz: '💬 Javob yozish', ru: '💬 Ответить' },
  complaintMarkResolved: { uz: '✅ Hal qilindi', ru: '✅ Решено' },
  complaintAskReply: { uz: 'Javobingizni yozing:', ru: 'Введите ваш ответ:' },
  complaintReplied: { uz: '✅ Javob yuborildi.', ru: '✅ Ответ отправлен.' },
  complaintFromAdmin: {
    uz: '💬 <b>Klinika javobi:</b>\n\n',
    ru: '💬 <b>Ответ клиники:</b>\n\n',
  },
  complaintStatus: {
    new: { uz: '🆕 Yangi', ru: '🆕 Новая' },
    in_progress: { uz: '⏳ Jarayonda', ru: '⏳ В работе' },
    resolved: { uz: '✅ Hal qilindi', ru: '✅ Решено' },
  },

  // Bemorlar
  patientsEmpty: { uz: 'Bemorlar yo\'q.', ru: 'Пациентов нет.' },
  patientsTitle: { uz: '👥 <b>Bemorlar</b>\n\n', ru: '👥 <b>Пациенты</b>\n\n' },
  patientCardBtn: { uz: '📋 Karta', ru: '📋 Карта' },
  patientNoCard: { uz: 'Tibbiy karta to\'ldirilmagan.', ru: 'Медицинская карта не заполнена.' },

  // Statistika
  statsTitle: { uz: '📊 <b>Statistika</b>\n\n', ru: '📊 <b>Статистика</b>\n\n' },
  statsPatients: { uz: 'Bemorlar', ru: 'Пациенты' },
  statsCards: { uz: 'To\'ldirilgan kartalar', ru: 'Заполненные карты' },
  statsServices: { uz: 'Faol xizmatlar', ru: 'Активные услуги' },
  statsDoctors: { uz: 'Faol shifokorlar', ru: 'Активные врачи' },
  statsComplaintsNew: { uz: 'Yangi shikoyatlar', ru: 'Новые жалобы' },
  statsComplaintsTotal: { uz: 'Jami shikoyatlar', ru: 'Всего жалоб' },
  statsToday: { uz: 'Bugungi yangi bemorlar', ru: 'Новые пациенты сегодня' },
  statsAppointmentsNew: { uz: 'Yangi qabul so\'rovlari', ru: 'Новые записи' },

  // ========== QABULGA YOZILISH (BEMOR) ==========
  apptStart: {
    uz: '📅 <b>Qabulga yozilish</b>\n\nBiz sizdan 3 ta savol so\'raymiz, so\'ng klinika xodimi qo\'ng\'iroq qilib, sizga qulay vaqtni kelishadi.\n\n1️⃣ <b>To\'liq ism-sharifingiz?</b>\n\n/cancel — bekor qilish',
    ru: '📅 <b>Запись на приём</b>\n\nМы зададим 3 вопроса, затем сотрудник клиники позвонит и согласует удобное время.\n\n1️⃣ <b>Ваше полное имя?</b>\n\n/cancel — отменить',
  },
  apptAskPhone: {
    uz: '2️⃣ <b>Telefon raqamingiz?</b>\n\nMasalan: <code>+998 90 123 45 67</code> yoki <code>998901234567</code>',
    ru: '2️⃣ <b>Ваш номер телефона?</b>\n\nПример: <code>+998 90 123 45 67</code> или <code>998901234567</code>',
  },
  apptAskNotes: {
    uz: '3️⃣ <b>Qisqacha izoh</b> (qaysi xizmat, shoshilinchmi va h.k.) yoki <code>—</code> o\'tkazib yuborish.',
    ru: '3️⃣ <b>Краткий комментарий</b> (какая услуга, срочность и т.п.) или <code>—</code> чтобы пропустить.',
  },
  apptInvalidPhone: {
    uz: '⚠️ Telefon raqami noto\'g\'ri. Iltimos, raqamni kiriting (masalan: +998901234567).',
    ru: '⚠️ Неверный номер телефона. Пожалуйста, введите номер (например: +998901234567).',
  },
  apptReview: {
    uz: '📋 <b>Ko\'rib chiqing:</b>\n\n👤 <b>Ism:</b> ',
    ru: '📋 <b>Проверьте:</b>\n\n👤 <b>Имя:</b> ',
  },
  apptReviewPhone: { uz: '\n📞 <b>Telefon:</b> ', ru: '\n📞 <b>Телефон:</b> ' },
  apptReviewNotes: { uz: '\n📝 <b>Izoh:</b> ', ru: '\n📝 <b>Комментарий:</b> ' },
  apptConfirmBtn: { uz: '✅ Yuborish', ru: '✅ Отправить' },
  apptRestartBtn: { uz: '🔄 Qaytadan', ru: '🔄 Заново' },
  apptCancelBtn: { uz: '❌ Bekor qilish', ru: '❌ Отменить' },
  apptDone: {
    uz: '✅ <b>Rahmat! So\'rovingiz qabul qilindi.</b>\n\nKlinika xodimi tez orada siz bilan bog\'lanadi va qulay vaqtni kelishadi. 🙏',
    ru: '✅ <b>Спасибо! Ваша заявка принята.</b>\n\nСотрудник клиники скоро свяжется с вами и согласует удобное время. 🙏',
  },

  // ========== QABULGA YOZILISH (ADMIN) ==========
  adminMenuAppointments: { uz: '📞 Qo\'ng\'iroq so\'rovlari', ru: '📞 Запросы на звонок' },
  apptListTitle: { uz: '📞 <b>Qabul so\'rovlari</b>\n\n', ru: '📞 <b>Запросы на запись</b>\n\n' },
  apptListEmpty: { uz: 'So\'rovlar yo\'q.', ru: 'Запросов нет.' },
  apptStatus: {
    new: { uz: '🆕 Yangi', ru: '🆕 Новая' },
    called: { uz: '📞 Qo\'ng\'iroq qilindi', ru: '📞 Позвонили' },
    done: { uz: '✅ Bajarildi', ru: '✅ Выполнено' },
    cancelled: { uz: '❌ Bekor', ru: '❌ Отменено' },
  },
  apptMarkCalled: { uz: '📞 Qo\'ng\'iroq qilindi', ru: '📞 Позвонили' },
  apptMarkDone: { uz: '✅ Bajarildi', ru: '✅ Выполнено' },
  apptMarkCancelled: { uz: '❌ Bekor qilish', ru: '❌ Отменить' },
  apptNotifyAdmin: {
    uz: '🔔 <b>Yangi qabul so\'rovi!</b>\n\n',
    ru: '🔔 <b>Новый запрос на запись!</b>\n\n',
  },

  // ========== TIBBIY KARTA TAHRIRLASH ==========
  mcEditField: { uz: '✏️ Tahrirlash', ru: '✏️ Редактировать' },
  mcFields: {
    full_name: { uz: 'F.I.SH', ru: 'Ф.И.О.' },
    birth_date: { uz: 'Tug\'ilgan sana', ru: 'Дата рождения' },
    gender: { uz: 'Jinsi', ru: 'Пол' },
    address: { uz: 'Manzil', ru: 'Адрес' },
    allergies: { uz: 'Allergiya', ru: 'Аллергии' },
    chronic_diseases: { uz: 'Surunkali kasalliklar', ru: 'Хронические заболевания' },
    current_medications: { uz: 'Dorilar', ru: 'Лекарства' },
    previous_treatments: { uz: 'Avvalgi davolanishlar', ru: 'Предыдущие лечения' },
  },
  mcEnterNew: { uz: 'Yangi qiymatni kiriting:', ru: 'Введите новое значение:' },
  mcFieldSaved: { uz: '✅ Yangilandi', ru: '✅ Обновлено' },
  mcRedoAll: { uz: '🔄 Hammasini qayta to\'ldirish', ru: '🔄 Заполнить заново' },

  // ========== XIZMAT / SHIFOKOR TAHRIRLASH ==========
  svcFields: {
    name_uz: { uz: 'Nomi (UZ)', ru: 'Название (UZ)' },
    name_ru: { uz: 'Nomi (RU)', ru: 'Название (RU)' },
    description_uz: { uz: 'Tavsif (UZ)', ru: 'Описание (UZ)' },
    description_ru: { uz: 'Tavsif (RU)', ru: 'Описание (RU)' },
    price_from: { uz: 'Narx (dan)', ru: 'Цена (от)' },
    price_to: { uz: 'Narx (gacha)', ru: 'Цена (до)' },
    sort_order: { uz: 'Tartib raqami', ru: 'Порядок' },
  },
  docFields: {
    full_name: { uz: 'F.I.SH', ru: 'Ф.И.О.' },
    specialty_uz: { uz: 'Mutaxassislik (UZ)', ru: 'Специальность (UZ)' },
    specialty_ru: { uz: 'Mutaxassislik (RU)', ru: 'Специальность (RU)' },
    experience_years: { uz: 'Tajriba (yil)', ru: 'Опыт (лет)' },
    bio_uz: { uz: 'Bio (UZ)', ru: 'Био (UZ)' },
    bio_ru: { uz: 'Bio (RU)', ru: 'Био (RU)' },
    sort_order: { uz: 'Tartib raqami', ru: 'Порядок' },
  },
  editPickField: { uz: '✏️ Qaysi maydonni o\'zgartirasiz?', ru: '✏️ Какое поле изменить?' },
  editEnterValue: { uz: 'Yangi qiymatni kiriting (yoki <code>—</code> bo\'sh qoldirish uchun):', ru: 'Введите новое значение (или <code>—</code> чтобы очистить):' },
  editSaved: { uz: '✅ O\'zgartirildi.', ru: '✅ Изменено.' },
  editInvalidNumber: { uz: '⚠️ Faqat raqam kiriting.', ru: '⚠️ Введите только число.' },
  toggleActive: { uz: '🟢 Faollashtirish', ru: '🟢 Активировать' },
  toggleInactive: { uz: '⚪️ Yashirish', ru: '⚪️ Скрыть' },

  // ========== BEMORLAR QIDIRUVI ==========
  patientsSearchBtn: { uz: '🔍 Qidirish', ru: '🔍 Поиск' },
  patientsSearchAsk: {
    uz: '🔍 <b>Bemor qidirish</b>\n\nIsm, familiya, telefon yoki Telegram ID kiriting (kamida 2 belgi):\n\n/cancel — bekor qilish',
    ru: '🔍 <b>Поиск пациента</b>\n\nВведите имя, фамилию, телефон или Telegram ID (минимум 2 символа):\n\n/cancel — отменить',
  },
  patientsSearchEmpty: { uz: 'Hech narsa topilmadi.', ru: 'Ничего не найдено.' },
  patientsSearchTitle: { uz: '🔍 <b>Topildi:</b>\n\n', ru: '🔍 <b>Найдено:</b>\n\n' },
  patientsSearchTooShort: { uz: '⚠️ Kamida 2 belgi kiriting.', ru: '⚠️ Введите минимум 2 символа.' },

  // ========== MEDIA ==========
  adminMenuMedia: { uz: '🖼 Media kutubxona', ru: '🖼 Медиа библиотека' },
  mediaTitle: { uz: '🖼 <b>Media kutubxona</b>\n\n', ru: '🖼 <b>Медиа библиотека</b>\n\n' },
  mediaEmpty: {
    uz: 'Hech qanday media yo\'q.\n\nBotga rasm, video yoki fayl yuboring — u avtomatik kutubxonaga qo\'shiladi.',
    ru: 'Медиа нет.\n\nОтправьте боту фото, видео или файл — оно автоматически добавится в библиотеку.',
  },
  mediaUploaded: {
    uz: '✅ <b>Media kutubxonaga qo\'shildi!</b>\n\nEndi uni shifokor, xizmat yoki klinika ma\'lumotlariga biriktirishingiz mumkin.',
    ru: '✅ <b>Медиа добавлено в библиотеку!</b>\n\nТеперь его можно прикрепить к врачу, услуге или информации о клинике.',
  },
  mediaUploadedShort: { uz: '✅ Saqlandi (ID: ', ru: '✅ Сохранено (ID: ' },
  mediaTypePhoto: { uz: '🖼 Rasm', ru: '🖼 Фото' },
  mediaTypeVideo: { uz: '🎬 Video', ru: '🎬 Видео' },
  mediaTypeDocument: { uz: '📎 Hujjat', ru: '📎 Документ' },
  mediaTypeAudio: { uz: '🎵 Audio', ru: '🎵 Аудио' },
  mediaTypeVoice: { uz: '🎙 Ovozli', ru: '🎙 Голосовое' },
  mediaTypeAnimation: { uz: '🎞 GIF', ru: '🎞 GIF' },
  mediaShowAll: { uz: '📂 Hammasini ko\'rsatish', ru: '📂 Показать все' },
  mediaFilterPhotos: { uz: '🖼 Rasmlar', ru: '🖼 Фото' },
  mediaFilterVideos: { uz: '🎬 Videolar', ru: '🎬 Видео' },
  mediaFilterDocs: { uz: '📎 Hujjatlar', ru: '📎 Документы' },
  mediaItem: { uz: 'Media', ru: 'Медиа' },
  mediaSize: { uz: 'Hajm', ru: 'Размер' },
  mediaUploaded2: { uz: 'Yuklangan', ru: 'Загружено' },
  mediaAttachedTo: { uz: 'Biriktirilgan', ru: 'Прикреплено' },
  mediaNotAttached: { uz: 'Hech qayerga biriktirilmagan', ru: 'Никуда не прикреплено' },
  mediaDelete: { uz: '🗑 Kutubxonadan o\'chirish', ru: '🗑 Удалить из библиотеки' },
  mediaDeleteConfirm: {
    uz: '⚠️ Ushbu media va uning barcha biriktirmalari o\'chiriladi. Davom etamizmi?',
    ru: '⚠️ Это медиа и все его привязки будут удалены. Продолжить?',
  },
  mediaDeleted: { uz: '🗑 Media o\'chirildi.', ru: '🗑 Медиа удалено.' },
  mediaAttach: { uz: '📌 Biriktirish', ru: '📌 Прикрепить' },
  mediaPickEntity: {
    uz: 'Qayerga biriktiramiz?',
    ru: 'Куда прикрепить?',
  },
  mediaEntityDoctor: { uz: '👨‍⚕️ Shifokor', ru: '👨‍⚕️ Врач' },
  mediaEntityService: { uz: '🦷 Xizmat', ru: '🦷 Услуга' },
  mediaEntityClinic: { uz: '🏥 Klinika', ru: '🏥 Клиника' },
  mediaPickDoctor: { uz: 'Qaysi shifokorga?', ru: 'К какому врачу?' },
  mediaPickService: { uz: 'Qaysi xizmatga?', ru: 'К какой услуге?' },
  mediaAttached: { uz: '✅ Biriktirildi.', ru: '✅ Прикреплено.' },
  mediaAlreadyAttached: { uz: '⚠️ Bu media allaqachon biriktirilgan.', ru: '⚠️ Это медиа уже прикреплено.' },
  mediaUnattach: { uz: '➖ Biriktirmani olib tashlash', ru: '➖ Открепить' },
  mediaUnattached: { uz: '✅ Olib tashlandi.', ru: '✅ Откреплено.' },

  // Entity tahrirlashda "Media" tugmasi
  entityMediaBtn: { uz: '🖼 Media', ru: '🖼 Медиа' },
  entityMediaTitle: { uz: '🖼 <b>Biriktirilgan media</b>\n\n', ru: '🖼 <b>Прикреплённое медиа</b>\n\n' },
  entityMediaEmpty: {
    uz: 'Bu yerga hech qanday media biriktirilmagan.\n\n💡 <b>Qo\'shish uchun</b>: Media kutubxonaga o\'ting, mediani tanlang va "📌 Biriktirish" tugmasini bosing.',
    ru: 'Сюда не прикреплено медиа.\n\n💡 <b>Чтобы добавить</b>: перейдите в Медиа библиотеку, выберите медиа и нажмите "📌 Прикрепить".',
  },
  entityMediaGoLib: { uz: '📂 Kutubxonaga o\'tish', ru: '📂 Перейти в библиотеку' },

  // Stats
  statsMedia: { uz: 'Media fayllar', ru: 'Медиа файлы' },

  // ========== BROADCAST (Yangilik yuborish) ==========
  adminMenuBroadcast: { uz: '📢 Yangilik yuborish', ru: '📢 Рассылка' },
  bcStart: {
    uz: '📢 <b>Yangilik yuborish</b>\n\nBu xabar barcha bemorlarga (botda /start bosganlar) yetkaziladi.\n\n1️⃣ Avval <b>matn</b>ni yuboring (yoki <code>—</code> — faqat media yuborish uchun):\n\n/cancel — bekor qilish',
    ru: '📢 <b>Рассылка</b>\n\nЭто сообщение получат все пациенты (запустившие /start).\n\n1️⃣ Сначала отправьте <b>текст</b> (или <code>—</code> — только медиа):\n\n/cancel — отменить',
  },
  bcAskMedia: {
    uz: '2️⃣ Endi <b>media</b> yuborishingiz mumkin (rasm, video, fayl). Birdan ortiq yuborsangiz, hammasi qo\'shiladi.\n\nMedia kerak bo\'lmasa, <b>Davom etish</b> tugmasini bosing.',
    ru: '2️⃣ Теперь можно отправить <b>медиа</b> (фото, видео, файл). Можно отправить несколько — все добавятся.\n\nЕсли медиа не нужно — нажмите <b>Продолжить</b>.',
  },
  bcMediaAdded: { uz: '✅ Media qo\'shildi (', ru: '✅ Медиа добавлено (' },
  bcContinueBtn: { uz: '➡️ Davom etish', ru: '➡️ Продолжить' },
  bcReview: {
    uz: '📋 <b>Yuborishdan oldin tekshiring</b>\n\n',
    ru: '📋 <b>Проверьте перед отправкой</b>\n\n',
  },
  bcRecipients: { uz: 'Qabul qiluvchilar', ru: 'Получатели' },
  bcMediaCount: { uz: 'Media', ru: 'Медиа' },
  bcSendBtn: { uz: '📨 Yuborish', ru: '📨 Отправить' },
  bcSending: {
    uz: '📨 Yuborilmoqda... Bu bir necha daqiqa olishi mumkin. Yakunlanganda xabar beraman.',
    ru: '📨 Отправляется... Это может занять несколько минут. Сообщу, когда завершится.',
  },
  bcDone: {
    uz: '✅ <b>Yuborildi!</b>\n\n',
    ru: '✅ <b>Отправлено!</b>\n\n',
  },
  bcStatTotal: { uz: 'Jami', ru: 'Всего' },
  bcStatSent: { uz: 'Muvaffaqiyatli', ru: 'Успешно' },
  bcStatFailed: { uz: 'Xatolik', ru: 'Ошибка' },
  bcNoText: {
    uz: '⚠️ Matn yoki kamida 1 ta media kerak.',
    ru: '⚠️ Нужен текст или минимум 1 медиа.',
  },

  // ========== BEMORGA STATUS BILDIRISHNOMALARI ==========
  apptStatusUserNotif: {
    called: {
      uz: '📞 <b>Sizning so\'rovingiz qayta ko\'rib chiqildi.</b>\n\nKlinika xodimi siz bilan bog\'lanishga harakat qildi.',
      ru: '📞 <b>Ваша заявка обработана.</b>\n\nСотрудник клиники связался с вами.',
    },
    done: {
      uz: '✅ <b>Sizning qabulingiz tasdiqlandi va bajarildi.</b>\n\nBizni tanlaganingiz uchun rahmat! 🙏',
      ru: '✅ <b>Ваш приём подтверждён и выполнен.</b>\n\nСпасибо, что выбрали нас! 🙏',
    },
    cancelled: {
      uz: '❌ <b>Sizning qabul so\'rovingiz bekor qilindi.</b>\n\nSavollar bo\'lsa, biz bilan bog\'laning.',
      ru: '❌ <b>Ваша заявка на приём отменена.</b>\n\nЕсли есть вопросы — свяжитесь с нами.',
    },
  },

  // ========== ESLATMA ==========
  apptReminder: {
    uz: '🔔 <b>Eslatma!</b>\n\nErtaga sizning qabulingiz bor:',
    ru: '🔔 <b>Напоминание!</b>\n\nЗавтра у вас приём:',
  },

  // ========== ADMINGA SHIKOYAT BILDIRISHNOMASI ==========
  cmpNotifyAdmin: {
    uz: '🔔 <b>Yangi shikoyat / taklif!</b>\n\n',
    ru: '🔔 <b>Новая жалоба / предложение!</b>\n\n',
  },

  // ========== APPOINTMENT VAQTI (admin) ==========
  apptSetTimeBtn: { uz: '🕐 Vaqt belgilash', ru: '🕐 Назначить время' },
  apptAskTime: {
    uz: '🕐 <b>Qabul vaqtini kiriting</b>\n\nFormat: <code>kun.oy.yil soat:daqiqa</code>\nMasalan: <code>22.04.2026 14:30</code>\n\n/cancel — bekor qilish',
    ru: '🕐 <b>Введите время приёма</b>\n\nФормат: <code>день.месяц.год часы:минуты</code>\nПример: <code>22.04.2026 14:30</code>\n\n/cancel — отменить',
  },
  apptInvalidTime: {
    uz: '⚠️ Vaqt formati noto\'g\'ri. Misol: <code>22.04.2026 14:30</code>',
    ru: '⚠️ Неверный формат. Пример: <code>22.04.2026 14:30</code>',
  },
  apptTimeSaved: { uz: '✅ Vaqt belgilandi.', ru: '✅ Время назначено.' },
  apptTimeLabel: { uz: '🕐 Vaqt', ru: '🕐 Время' },
};

export function tr(key: keyof typeof t, lang: Lang): string {
  const v = t[key];
  if (typeof v === 'object' && 'uz' in v) return v[lang];
  return '';
}
