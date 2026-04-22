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
  // Ro'yxatdan o'tish (yangi foydalanuvchi)
  registerPrompt: {
    uz: '👋 Botga xush kelibsiz!\n\nDavom etish uchun ro\'yxatdan o\'ting:',
    ru: '👋 Добро пожаловать в бота!\n\nДля продолжения, пожалуйста, зарегистрируйтесь:',
  },
  registerBtn: {
    uz: '📝 Ro\'yxatdan o\'tish',
    ru: '📝 Регистрация',
  },
  registerAskName: {
    uz: '👤 Ism va familiyangizni kiriting:',
    ru: '👤 Введите ваше имя и фамилию:',
  },
  registerInvalidName: {
    uz: '⚠️ Iltimos, ism-familiyangizni to\'liq kiriting (kamida 2 belgi).',
    ru: '⚠️ Пожалуйста, введите полное имя и фамилию (минимум 2 символа).',
  },
  registerAskPhone: {
    uz: '📞 Telefon raqamingizni kiriting (masalan: +998 90 123 45 67):',
    ru: '📞 Введите ваш номер телефона (например: +998 90 123 45 67):',
  },
  registerInvalidPhone: {
    uz: '⚠️ Telefon raqami noto\'g\'ri. Iltimos, qayta urinib ko\'ring.',
    ru: '⚠️ Неверный номер телефона. Пожалуйста, попробуйте снова.',
  },
  registerDone: {
    uz: '✅ Ro\'yxatdan o\'tdingiz! Endi bo\'limlardan birini tanlang:',
    ru: '✅ Регистрация завершена! Теперь выберите раздел:',
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
    doctors: { uz: '👥 Xodimlar', ru: '👥 Сотрудники' },
    patients: { uz: '🧑‍🦱 Bemorlar', ru: '🧑‍🦱 Пациенты' },
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

  // ========== XODIMLAR (STAFF) ==========
  staffPositions: {
    registratura: { uz: '📋 Registratura', ru: '📋 Регистратура' },
    koordinator: { uz: '🧭 Koordinator', ru: '🧭 Координатор' },
    shifokor: { uz: '👨‍⚕️ Shifokor', ru: '👨‍⚕️ Врач' },
    shifokor_yordamchisi: { uz: '🩺 Shifokor yordamchisi', ru: '🩺 Помощник врача' },
    hisobchi: { uz: '💼 Hisobchi', ru: '💼 Бухгалтер' },
    sterilizatsiya: { uz: '🧼 Sterilizatsiya xodimi', ru: '🧼 Сотрудник стерилизации' },
  },
  staffMenuTitle: {
    uz: '👥 <b>Xodimlar</b>\n\nLavozimni tanlang:',
    ru: '👥 <b>Сотрудники</b>\n\nВыберите должность:',
  },
  staffPositionTitle: {
    uz: 'Lavozim',
    ru: 'Должность',
  },
  staffListEmpty: {
    uz: 'Bu lavozimda hali xodim yo\'q.',
    ru: 'В этой должности пока нет сотрудников.',
  },
  staffAddBtn: { uz: '➕ Yangi xodim qo\'shish', ru: '➕ Добавить сотрудника' },
  staffPositionMediaBtn: {
    uz: '🖼 Lavozim mediasi (xodimlarga ko\'rinadi)',
    ru: '🖼 Медиа должности (видят сотрудники)',
  },
  staffAskTgId: {
    uz: '🆔 <b>Telegram ID</b>\n\nXodimning Telegram ID raqamini yuboring (faqat raqam, masalan: <code>123456789</code>).\n\n💡 Xodim @userinfobot ga /start yuborib, o\'z ID raqamini bilib oladi.\n\n/cancel — bekor qilish',
    ru: '🆔 <b>Telegram ID</b>\n\nОтправьте Telegram ID сотрудника (только число, например: <code>123456789</code>).\n\n💡 Сотрудник может узнать свой ID, отправив /start боту @userinfobot.\n\n/cancel — отменить',
  },
  staffAskName: {
    uz: '👤 <b>Ism familiyasi</b>\n\nXodimning to\'liq ismini yuboring:',
    ru: '👤 <b>Имя и фамилия</b>\n\nОтправьте полное имя сотрудника:',
  },
  staffInvalidTgId: {
    uz: '⚠️ Telegram ID faqat raqamlardan iborat bo\'lishi kerak.',
    ru: '⚠️ Telegram ID должен состоять только из цифр.',
  },
  staffDuplicateTgId: {
    uz: '⚠️ Bu Telegram ID bilan xodim allaqachon mavjud.',
    ru: '⚠️ Сотрудник с таким Telegram ID уже существует.',
  },
  staffAdded: {
    uz: '✅ Xodim qo\'shildi.',
    ru: '✅ Сотрудник добавлен.',
  },
  staffDeleted: { uz: '🗑 O\'chirildi.', ru: '🗑 Удалено.' },
  // /staff buyrug'i (xodim botga yozsa)
  staffGreeting: {
    uz: '👋 Salom, <b>{name}</b>!\n\nSiz <b>{position}</b> sifatida ro\'yxatdan o\'tgansiz.',
    ru: '👋 Здравствуйте, <b>{name}</b>!\n\nВы зарегистрированы как <b>{position}</b>.',
  },
  staffNotRegistered: {
    uz: '⛔️ Siz xodimlar ro\'yxatida yo\'qsiz. Iltimos, administrator bilan bog\'laning.',
    ru: '⛔️ Вы не в списке сотрудников. Свяжитесь с администратором.',
  },
  staffPositionMediaIntro: {
    uz: '📚 <b>Sizning lavozimingiz uchun materiallar:</b>',
    ru: '📚 <b>Материалы для вашей должности:</b>',
  },

  // ========== XODIM PORTALI (xodim botda) ==========
  staffMenu: {
    instruction: { uz: '📖 Xodim uchun yo\'riqnoma', ru: '📖 Инструкция для сотрудника' },
    checklist: { uz: '✅ Kunlik cheklist', ru: '✅ Ежедневный чек-лист' },
    startDay: { uz: '🌅 Kunlik ishni boshlash', ru: '🌅 Начать рабочий день' },
    complaint: { uz: '✍️ Shikoyat va taklif', ru: '✍️ Жалоба и предложение' },
    exit: { uz: '🚪 Chiqish', ru: '🚪 Выход' },
  },
  staffPortalTitle: {
    uz: '👨‍💼 <b>Xodim paneli</b>\n\nKerakli bo\'limni tanlang:',
    ru: '👨‍💼 <b>Панель сотрудника</b>\n\nВыберите раздел:',
  },
  staffInstructionEmpty: {
    uz: '📖 Sizga hali yo\'riqnoma materiallari biriktirilmagan.\n\nAdministrator yaqin orada qo\'shadi.',
    ru: '📖 Для вас пока не прикреплены материалы инструкции.\n\nАдминистратор скоро добавит.',
  },
  staffInstructionIntro: {
    uz: '📖 <b>Yo\'riqnoma materiallari:</b>',
    ru: '📖 <b>Материалы инструкции:</b>',
  },
  staffChecklistMsg: {
    uz: '✅ <b>Kunlik cheklist</b>\n\n• Ish joyini tayyorlash\n• Asboblarni tekshirish\n• Sterilizatsiyani nazorat qilish\n• Bemor kartalarini ko\'rib chiqish\n• Smena oxirida hisobot\n\n<i>To\'liq cheklist tez orada qo\'shiladi.</i>',
    ru: '✅ <b>Ежедневный чек-лист</b>\n\n• Подготовить рабочее место\n• Проверить инструменты\n• Контроль стерилизации\n• Просмотреть карты пациентов\n• Отчёт в конце смены\n\n<i>Полный чек-лист скоро будет добавлен.</i>',
  },
  staffStartDayMsg: {
    uz: '🌅 <b>Ish kuni boshlandi!</b>\n\nMuvaffaqiyatli kun tilaymiz! 💪\n\n<i>Vaqt belgilandi:</i> {time}',
    ru: '🌅 <b>Рабочий день начат!</b>\n\nУспешного дня! 💪\n\n<i>Время отметки:</i> {time}',
  },
  staffComplaintAsk: {
    uz: '✍️ Shikoyat yoki taklifingizni yozing. Administrator albatta ko\'rib chiqadi.\n\n/cancel — bekor qilish',
    ru: '✍️ Напишите вашу жалобу или предложение. Администратор обязательно рассмотрит.\n\n/cancel — отменить',
  },
  staffComplaintSaved: {
    uz: '✅ Rahmat! Murojaatingiz administratorga yuborildi.',
    ru: '✅ Спасибо! Ваше обращение отправлено администратору.',
  },
  staffExited: {
    uz: '🚪 Xodim panelidan chiqdingiz. Qayta kirish uchun /staff yuboring.',
    ru: '🚪 Вы вышли из панели сотрудника. Для повторного входа отправьте /staff.',
  },
  staffMediaBtn: {
    uz: '🖼 Yo\'riqnoma media',
    ru: '🖼 Медиа инструкция',
  },

  // Shifokor (faqat bemorlar uchun ko'rsatiladigan qo'shimcha maydonlar)
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

  // Statistika v2 (vaqt oralig'i bilan)
  statsTitle2: { uz: 'Statistika', ru: 'Статистика' },
  statsPeriod: { uz: 'Davr', ru: 'Период' },
  statsChoosePeriod: {
    uz: '📊 <b>Statistika</b>\n\nQaysi davr uchun ko\'rmoqchisiz?',
    ru: '📊 <b>Статистика</b>\n\nЗа какой период показать?',
  },
  statsBtnToday: { uz: '📅 Bugun', ru: '📅 Сегодня' },
  statsBtnWeek: { uz: '📆 Hafta', ru: '📆 Неделя' },
  statsBtnMonth: { uz: '🗓 Oy', ru: '🗓 Месяц' },
  statsBtnAll: { uz: '∞ Jami', ru: '∞ Всего' },
  statsBtnRefresh: { uz: '🔄 Yangilash', ru: '🔄 Обновить' },
  statsBtnBack: { uz: '⬅️ Davrlar', ru: '⬅️ Периоды' },

  statsSecPatients: { uz: 'Bemorlar', ru: 'Пациенты' },
  statsSecAppts: { uz: 'Qabul so\'rovlari', ru: 'Запросы на приём' },
  statsSecComplaints: { uz: 'Shikoyatlar', ru: 'Жалобы' },
  statsSecBroadcast: { uz: 'Yangiliklar (broadcast)', ru: 'Рассылки' },

  statsNewPatients: { uz: 'Yangi bemorlar', ru: 'Новые пациенты' },
  statsApptTotal: { uz: 'Jami so\'rovlar', ru: 'Всего запросов' },
  statsCmpTotal: { uz: 'Jami', ru: 'Всего' },
  statsCmpNew: { uz: 'Yangi', ru: 'Новые' },
  statsCmpResolved: { uz: 'Hal qilingan', ru: 'Решённые' },
  statsBcCount: { uz: 'Yuborilgan broadcastlar', ru: 'Отправлено рассылок' },
  statsBcRecipients: { uz: 'Jami qabul qiluvchilar', ru: 'Всего получателей' },
  statsBcSent: { uz: 'Muvaffaqiyatli', ru: 'Успешно' },
  statsBcFailed: { uz: 'Xatolik', ru: 'Ошибки' },

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

  // ========== BEMOR KO'RINISHI (admin tahrirlash) ==========
  patientsViewBtn: {
    uz: '👁 Bemorlarga ko\'rinadigan qismi',
    ru: '👁 Раздел, видимый пациентам',
  },
  patientsViewTitle: {
    uz: '👁 <b>Bemorlarga ko\'rinadigan qism</b>\n\nBemorlar bot menyusida ko\'radigan bo\'limlardan birini tanlang va tahrirlang:',
    ru: '👁 <b>Раздел, видимый пациентам</b>\n\nВыберите раздел, который пациенты видят в меню бота, и отредактируйте его:',
  },
  patientsViewServices: { uz: '🦷 Xizmatlar', ru: '🦷 Услуги' },
  patientsViewDoctors: { uz: '👨‍⚕️ Shifokorlar', ru: '👨‍⚕️ Врачи' },
  patientsViewAddress: { uz: '📍 Manzil', ru: '📍 Адрес' },
  patientsViewContact: { uz: '📞 Bog\'lanish', ru: '📞 Связаться' },

  // ========== SHIFOKOR/XODIM TAHRIRLASH ==========
  staffEditBtn: { uz: '✏️ Tahrirlash', ru: '✏️ Редактировать' },
  staffEditTitle: {
    uz: '✏️ <b>{name}</b>\n\nQaysi maydonni o\'zgartirasiz?',
    ru: '✏️ <b>{name}</b>\n\nКакое поле изменить?',
  },

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
    uz: 'Bu yerga hech qanday media biriktirilmagan.\n\n💡 Quyidagi <b>"📎 Media qo\'shish"</b> tugmasini bosing va botga rasm, video, audio yoki fayl yuboring — u avtomatik shu yerga biriktiriladi.',
    ru: 'Сюда не прикреплено медиа.\n\n💡 Нажмите кнопку <b>"📎 Добавить медиа"</b> ниже и отправьте боту фото, видео, аудио или файл — оно автоматически прикрепится сюда.',
  },
  entityMediaGoLib: { uz: '📂 Kutubxonaga o\'tish', ru: '📂 Перейти в библиотеку' },
  entityMediaAddBtn: { uz: '📎 Media qo\'shish', ru: '📎 Добавить медиа' },
  entityMediaAskUpload: {
    uz: '📤 Endi botga <b>rasm, video, audio, ovozli xabar yoki fayl</b> yuboring — u avtomatik shu yerga biriktiriladi.\n\n/cancel — bekor qilish',
    ru: '📤 Теперь отправьте боту <b>фото, видео, аудио, голосовое сообщение или файл</b> — оно автоматически прикрепится сюда.\n\n/cancel — отмена',
  },
  entityMediaUploaded: {
    uz: '✅ Media biriktirildi! Yana yuborishingiz mumkin yoki /cancel — yakunlash.',
    ru: '✅ Медиа прикреплено! Можно отправить ещё или /cancel — завершить.',
  },

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

  // ========== CHEKLIST (XODIM) ==========
  // Xodim portali tugmasi
  staffMenuChecklists: { uz: '📋 Cheklistlar', ru: '📋 Чек-листы' },

  // Xodim ko'rinishi
  chkUserTitle: {
    uz: '📋 <b>Sizning cheklistlaringiz</b>\n\nKerakli cheklistni tanlang:',
    ru: '📋 <b>Ваши чек-листы</b>\n\nВыберите чек-лист:',
  },
  chkUserEmpty: {
    uz: '📋 Sizga hali cheklist biriktirilmagan.\n\nAdministrator yaqin orada qo\'shadi.',
    ru: '📋 Для вас ещё не созданы чек-листы.\n\nАдминистратор скоро добавит.',
  },
  chkDailyBadge: { uz: '⭐ Majburiy', ru: '⭐ Обязательный' },
  chkExtraBadge: { uz: '📌 Qo\'shimcha', ru: '📌 Дополнительный' },
  chkTodayHeader: {
    uz: '🌅 <b>Bugungi cheklistingiz</b>\n\nIsh kuni boshlanishi bilan quyidagi punktlarni bajaring va ✅/❌ tugmalari orqali belgilang:',
    ru: '🌅 <b>Ваш чек-лист на сегодня</b>\n\nС началом рабочего дня выполняйте пункты и отмечайте через ✅/❌:',
  },
  chkNoItems: {
    uz: '⚠️ Bu cheklistda hali punktlar yo\'q.',
    ru: '⚠️ В этом чек-листе ещё нет пунктов.',
  },
  chkItemDone: { uz: '✅ Bajarildi', ru: '✅ Выполнено' },
  chkItemPending: { uz: '⏳ Kutilmoqda', ru: '⏳ Ожидает' },
  chkItemFailed: { uz: '❌ Bajarilmadi', ru: '❌ Не выполнено' },
  chkAllDone: {
    uz: '🎉 <b>Barakalla!</b> Bugungi majburiy cheklist to\'liq bajarildi.',
    ru: '🎉 <b>Молодец!</b> Сегодняшний обязательный чек-лист полностью выполнен.',
  },
  chkProgress: { uz: 'Bajarildi', ru: 'Выполнено' },
  chkRefreshBtn: { uz: '🔄 Yangilash', ru: '🔄 Обновить' },
  chkBackToList: { uz: '⬅️ Cheklistlar', ru: '⬅️ Чек-листы' },
  chkNoDailyOnStart: {
    uz: '💡 Sizga hali majburiy kunlik cheklist tayinlanmagan.',
    ru: '💡 Вам ещё не назначен обязательный ежедневный чек-лист.',
  },

  // Admin: cheklist boshqaruv
  chkAdminTitle: {
    uz: '📋 <b>Cheklistlar</b>\n\nXodim: <b>{name}</b>\nLavozim: <i>{position}</i>',
    ru: '📋 <b>Чек-листы</b>\n\nСотрудник: <b>{name}</b>\nДолжность: <i>{position}</i>',
  },
  chkAdminEmpty: { uz: 'Cheklistlar yo\'q.', ru: 'Чек-листов нет.' },
  chkAdminBtn: { uz: '📋 Cheklistlar', ru: '📋 Чек-листы' },
  chkAddDailyBtn: { uz: '➕ Majburiy kunlik', ru: '➕ Обязательный ежедневный' },
  chkAddExtraBtn: { uz: '➕ Qo\'shimcha cheklist', ru: '➕ Дополнительный' },
  chkAlreadyHasDaily: {
    uz: '⚠️ Bu xodimda allaqachon majburiy kunlik cheklist mavjud.',
    ru: '⚠️ У сотрудника уже есть обязательный ежедневный чек-лист.',
  },
  chkAskTitle: {
    uz: '📝 Cheklist nomini kiriting (masalan: <i>Ertalabki tayyorgarlik</i>):\n\n/cancel — bekor qilish',
    ru: '📝 Введите название чек-листа (например: <i>Утренняя подготовка</i>):\n\n/cancel — отменить',
  },
  chkTitleSaved: {
    uz: '✅ Cheklist yaratildi.\n\nEndi <b>punktlarni ketma-ket</b> kiriting (har bir punkt — alohida xabar).\n\nTugatish uchun <b>/done</b> yuboring.\nBekor qilish uchun /cancel.',
    ru: '✅ Чек-лист создан.\n\nТеперь вводите <b>пункты по очереди</b> (каждый пункт — отдельным сообщением).\n\nЗакончить — <b>/done</b>.\nОтменить — /cancel.',
  },
  chkItemAdded: { uz: '✅ Punkt qo\'shildi (', ru: '✅ Пункт добавлен (' },
  chkItemsDone: {
    uz: '✅ <b>Cheklist tayyor!</b>\n\nJami punktlar: <b>{n}</b>',
    ru: '✅ <b>Чек-лист готов!</b>\n\nВсего пунктов: <b>{n}</b>',
  },
  chkNeedAtLeastOne: {
    uz: '⚠️ Kamida 1 ta punkt qo\'shing yoki /cancel yuboring.',
    ru: '⚠️ Добавьте хотя бы 1 пункт или отправьте /cancel.',
  },
  chkDeleteBtn: { uz: '🗑 O\'chirish', ru: '🗑 Удалить' },
  chkAddItemsBtn: { uz: '➕ Punkt qo\'shish', ru: '➕ Добавить пункт' },
  chkDeleted: { uz: '🗑 Cheklist o\'chirildi.', ru: '🗑 Чек-лист удалён.' },
  chkOneChecklist: {
    uz: '📋 <b>{title}</b>\n\nPunktlar:\n{items}',
    ru: '📋 <b>{title}</b>\n\nПункты:\n{items}',
  },

  // Admin: xodim statistikasi
  chkStatsBtn: { uz: '📊 Statistika', ru: '📊 Статистика' },
  chkStatsTitle: {
    uz: '📊 <b>Xodim statistikasi</b>\n\n<b>{name}</b> — <i>{position}</i>\nDavr: {period}',
    ru: '📊 <b>Статистика сотрудника</b>\n\n<b>{name}</b> — <i>{position}</i>\nПериод: {period}',
  },
  chkStatsDays: { uz: 'Ish kuni boshlangan', ru: 'Дней начато' },
  chkStatsItemsDone: { uz: 'Bajarilgan punktlar', ru: 'Выполнено пунктов' },
  chkStatsItemsTotal: { uz: 'Jami belgilangan', ru: 'Всего отмечено' },
  chkStatsRate: { uz: 'Bajarilish darajasi', ru: 'Уровень выполнения' },
  chkStatsRecent: { uz: '🗓 Oxirgi kunlar', ru: '🗓 Последние дни' },
  chkStatsNoData: { uz: 'Bu davrda ma\'lumot yo\'q.', ru: 'За этот период данных нет.' },
  chkStartDayDone: {
    uz: '🌅 <b>Ish kuni boshlandi!</b>\n\nVaqt: {time}',
    ru: '🌅 <b>Рабочий день начат!</b>\n\nВремя: {time}',
  },
  chkStartDayAlready: {
    uz: '✅ Bugungi ish kuningiz allaqachon boshlangan ({time}).',
    ru: '✅ Ваш рабочий день уже начат сегодня ({time}).',
  },

  // ========== KOORDINATORLAR ==========
  coordMenuBtn: { uz: '🧭 Koordinatorlar', ru: '🧭 Координаторы' },
  coordTitle: {
    uz: '🧭 <b>Koordinatorlar</b>\n\nKoordinatorlar xodimlar bo\'limini va cheklist tekshiruvini boshqara oladi.',
    ru: '🧭 <b>Координаторы</b>\n\nКоординаторы могут управлять разделом сотрудников и проверять чек-листы.',
  },
  coordEmpty: { uz: 'Koordinatorlar yo\'q.', ru: 'Координаторов нет.' },
  coordAddBtn: { uz: '➕ Koordinator qo\'shish', ru: '➕ Добавить координатора' },
  coordAskTgId: {
    uz: '🆔 Koordinatorning <b>Telegram ID</b> raqamini yuboring.\n\n💡 U @userinfobot orqali ID sini bilib oladi.\n\n/cancel — bekor',
    ru: '🆔 Отправьте <b>Telegram ID</b> координатора.\n\n💡 Узнать ID можно через @userinfobot.\n\n/cancel — отмена',
  },
  coordAskName: {
    uz: '👤 Ism familiyasini yuboring (yoki "—" o\'tkazish):',
    ru: '👤 Введите имя и фамилию (или "—" чтобы пропустить):',
  },
  coordInvalidTgId: {
    uz: '⚠️ Telegram ID faqat raqamlardan iborat bo\'lishi kerak.',
    ru: '⚠️ Telegram ID должен состоять только из цифр.',
  },
  coordDuplicate: {
    uz: '⚠️ Bu Telegram ID allaqachon koordinator sifatida ro\'yxatdan o\'tgan.',
    ru: '⚠️ Этот Telegram ID уже зарегистрирован как координатор.',
  },
  coordAdded: { uz: '✅ Koordinator qo\'shildi.', ru: '✅ Координатор добавлен.' },
  coordDeleted: { uz: '🗑 Koordinator o\'chirildi.', ru: '🗑 Координатор удалён.' },

  // Koordinator portali (panel)
  coordPortalTitle: {
    uz: '🧭 <b>Koordinator paneli</b>\n\nKerakli bo\'limni tanlang:',
    ru: '🧭 <b>Панель координатора</b>\n\nВыберите раздел:',
  },
  coordGreeting: {
    uz: '👋 Salom, <b>{name}</b>!\n\nSiz koordinator sifatida ro\'yxatdan o\'tgansiz.',
    ru: '👋 Здравствуйте, <b>{name}</b>!\n\nВы зарегистрированы как координатор.',
  },
  coordMenu: {
    staff: { uz: '👥 Xodimlar', ru: '👥 Сотрудники' },
    pending: { uz: '⏳ Tekshiruvlar', ru: '⏳ Проверки' },
    attendance: { uz: '📅 Davomat', ru: '📅 Посещаемость' },
    exit: { uz: '🚪 Chiqish', ru: '🚪 Выход' },
  },
  coordExited: {
    uz: '🚪 Koordinator panelidan chiqdingiz. Qayta kirish: /coordinator',
    ru: '🚪 Вы вышли из панели координатора. Повторно: /coordinator',
  },

  // Tekshiruv (review) — koordinatorga keladigan xabar
  coordReviewNew: {
    uz: '🔔 <b>Yangi cheklist tekshiruvi!</b>\n\n👤 Xodim: <b>{name}</b>\n💼 Lavozim: <i>{position}</i>\n📋 Cheklist: <b>{title}</b>\n📊 Bajarilgan: <b>{done}/{total}</b>\n📅 Sana: {date}',
    ru: '🔔 <b>Новая проверка чек-листа!</b>\n\n👤 Сотрудник: <b>{name}</b>\n💼 Должность: <i>{position}</i>\n📋 Чек-лист: <b>{title}</b>\n📊 Выполнено: <b>{done}/{total}</b>\n📅 Дата: {date}',
  },
  coordReviewItemsHeader: {
    uz: '\n\n<b>Punktlar:</b>',
    ru: '\n\n<b>Пункты:</b>',
  },
  coordApproveBtn: { uz: '✅ To\'g\'ri', ru: '✅ Верно' },
  coordRejectBtn: { uz: '❌ Noto\'g\'ri', ru: '❌ Неверно' },
  coordReviewApproved: {
    uz: '✅ Tekshirildi va tasdiqlandi. Xodimga xabar yuborildi.',
    ru: '✅ Проверено и подтверждено. Сотруднику отправлено уведомление.',
  },
  coordReviewRejected: {
    uz: '❌ Tekshirildi va rad etildi. Xodimga qaytadan to\'ldirish kerakligi haqida xabar yuborildi.',
    ru: '❌ Проверено и отклонено. Сотруднику отправлено уведомление о повторной проверке.',
  },
  coordReviewAlreadyDone: {
    uz: '⚠️ Bu tekshiruv allaqachon ko\'rib chiqilgan.',
    ru: '⚠️ Эта проверка уже рассмотрена.',
  },

  // Xodimga xabar (tasdiq / rad)
  staffDayClosed: {
    uz: '🎉 <b>Bugungi kun yopildi!</b>\n\nKoordinator cheklistingizni to\'g\'ri to\'ldirilgan deb tasdiqladi. Yaxshi ish! 💪\n\n<i>Cheklist:</i> {title}',
    ru: '🎉 <b>Сегодняшний день закрыт!</b>\n\nКоординатор подтвердил, что ваш чек-лист заполнен правильно. Хорошая работа! 💪\n\n<i>Чек-лист:</i> {title}',
  },
  staffChecklistRejected: {
    uz: '⚠️ <b>Cheklist noto\'g\'ri to\'ldirilgan</b>\n\nKoordinator sizning cheklistingizni qaytadan tekshirishingizni so\'radi.\n\n<i>Cheklist:</i> {title}\n\nIltimos, har bir punktni qayta ko\'rib chiqing va to\'g\'ri belgilang.',
    ru: '⚠️ <b>Чек-лист заполнен неверно</b>\n\nКоординатор просит вас повторно проверить чек-лист.\n\n<i>Чек-лист:</i> {title}\n\nПожалуйста, перепроверьте каждый пункт и отметьте корректно.',
  },
  chkSentForReviewBadge: {
    uz: '\n\n⏳ <i>Tekshirish uchun koordinatorga yuborildi.</i>',
    ru: '\n\n⏳ <i>Отправлено координатору на проверку.</i>',
  },
  chkApprovedBadge: {
    uz: '\n\n✅ <i>Koordinator tomonidan tasdiqlangan.</i>',
    ru: '\n\n✅ <i>Подтверждено координатором.</i>',
  },
  chkRejectedBadge: {
    uz: '\n\n❌ <i>Koordinator qaytadan to\'ldirishni so\'radi.</i>',
    ru: '\n\n❌ <i>Координатор просит перепроверить.</i>',
  },

  // Koordinator: pending tekshiruvlar ro'yxati
  coordPendingTitle: {
    uz: '⏳ <b>Tekshirilmagan cheklistlar</b>',
    ru: '⏳ <b>Непроверенные чек-листы</b>',
  },
  coordPendingEmpty: {
    uz: '✨ Hozircha tekshirilishi kerak bo\'lgan cheklist yo\'q.',
    ru: '✨ Сейчас нет чек-листов, требующих проверки.',
  },

  // Koordinator: davomat
  coordAttendanceTitle: {
    uz: '📅 <b>Bugungi davomat</b>',
    ru: '📅 <b>Посещаемость на сегодня</b>',
  },
  coordAttendanceEmpty: {
    uz: 'Bugun hech kim ish kunini boshlamagan.',
    ru: 'Сегодня никто не начал рабочий день.',
  },
  coordAttendanceCame: { uz: '🟢 Keldi', ru: '🟢 Пришёл' },
  coordAttendanceMissing: { uz: '⚪ Yo\'q', ru: '⚪ Нет' },

  // ========== KOORDINATOR XODIM PORTALIDA (qo'shimcha tugmalar) ==========
  // Koordinator oddiy xodim portaliga kiradi, lekin unga 2 ta qo'shimcha tugma ko'rinadi
  coordExtraStaff: { uz: '👥 Xodimlar (admin)', ru: '👥 Сотрудники (админ)' },
  coordExtraStats: { uz: '📊 Statistika', ru: '📊 Статистика' },

  // Koordinator statistikasi: bo'limlar
  coordStatsTitle: {
    uz: '📊 <b>Koordinator statistikasi</b>\n\nKerakli bo\'limni tanlang:',
    ru: '📊 <b>Статистика координатора</b>\n\nВыберите раздел:',
  },
  coordStatsAttendance: { uz: '📅 Xodimlar davomati', ru: '📅 Посещаемость сотрудников' },
  coordStatsChecklists: { uz: '📋 Cheklistlar holati', ru: '📋 Статус чек-листов' },
  coordStatsPatients: { uz: '👥 Bemorlar ro\'yxati', ru: '👥 Список пациентов' },
  coordStatsBack: { uz: '⬅️ Statistikaga qaytish', ru: '⬅️ К статистике' },

  // Cheklistlar holati hisoboti
  coordChkReportTitle: {
    uz: '📋 <b>Bugungi cheklistlar holati</b>',
    ru: '📋 <b>Статус чек-листов на сегодня</b>',
  },
  coordChkReportEmpty: {
    uz: 'Bugun majburiy cheklistlar belgilanmagan.',
    ru: 'На сегодня обязательные чек-листы не назначены.',
  },
  coordChkStatusDone: { uz: '✅ To\'liq', ru: '✅ Полностью' },
  coordChkStatusPartial: { uz: '🟡 Qisman', ru: '🟡 Частично' },
  coordChkStatusEmpty: { uz: '⚪ Boshlanmagan', ru: '⚪ Не начат' },
  coordChkStatusApproved: { uz: '✅ Tasdiqlangan', ru: '✅ Подтверждён' },
  coordChkStatusPending: { uz: '⏳ Tekshiruvda', ru: '⏳ На проверке' },
  coordChkStatusRejected: { uz: '❌ Qaytarilgan', ru: '❌ Отклонён' },

  // Bemorlar ro'yxati
  coordPatientsTitle: {
    uz: '👥 <b>Bemorlar ro\'yxati</b>\n<i>Eng yangilari (50 ta)</i>',
    ru: '👥 <b>Список пациентов</b>\n<i>Последние (50)</i>',
  },
  coordPatientsEmpty: {
    uz: 'Hali bemorlar ro\'yxatdan o\'tmagan.',
    ru: 'Пока пациенты не зарегистрированы.',
  },

  // ========== REZIDENTURA (admin tugmasi) ==========
  adminMenuResidency: { uz: '🎓 Rezidentura', ru: '🎓 Резидентура' },
  residencyNotAuthorized: {
    uz: '🚫 Sizga rezidentura bo\'limiga ruxsat berilmagan.\n\nAgar siz rezident bo\'lsangiz, admin sizni ro\'yxatga olishi kerak.',
    ru: '🚫 У вас нет доступа к разделу резидентуры.\n\nЕсли вы резидент, администратор должен вас зарегистрировать.',
  },

  // ========== LABORATORIYA ==========
  adminMenuLab: { uz: '🦷 Laboratoriya', ru: '🦷 Лаборатория' },
  labNotAuthorized: {
    uz: '🚫 Sizga laboratoriya bo\'limiga ruxsat berilmagan.\n\nAgar siz lab xodimi bo\'lsangiz, admin sizni ro\'yxatga olishi kerak.',
    ru: '🚫 У вас нет доступа к разделу лаборатории.\n\nЕсли вы сотрудник лаборатории, администратор должен вас зарегистрировать.',
  },
  // Lab xodim portali (reply tugmalar)
  labMenuNew: { uz: '🆕 Yangi apparatlar', ru: '🆕 Новые аппараты' },
  labMenuInProgress: { uz: '⚙️ Tayyorlanayotgan', ru: '⚙️ В процессе' },
  labMenuDone: { uz: '✅ Tugallangan', ru: '✅ Завершённые' },
  labMenuExit: { uz: '🚪 Chiqish', ru: '🚪 Выход' },
  labGreeting: {
    uz: '🦷 <b>Laboratoriya</b>\n\nSalom, <b>{name}</b>!\n\nKerakli bo\'limni tanlang:',
    ru: '🦷 <b>Лаборатория</b>\n\nЗдравствуйте, <b>{name}</b>!\n\nВыберите раздел:',
  },
  labExited: {
    uz: '🚪 Laboratoriya bo\'limidan chiqdingiz. Qayta kirish: /laboratoriya',
    ru: '🚪 Вы вышли из раздела лаборатории. Снова войти: /laboratoriya',
  },
  labListNewTitle: { uz: '🆕 <b>Yangi apparatlar</b>', ru: '🆕 <b>Новые аппараты</b>' },
  labListInProgressTitle: { uz: '⚙️ <b>Tayyorlanayotgan</b>', ru: '⚙️ <b>В процессе</b>' },
  labListDoneTitle: { uz: '✅ <b>Tugallangan apparatlar</b>', ru: '✅ <b>Завершённые аппараты</b>' },
  labListEmpty: { uz: 'Hozircha hech narsa yo\'q.', ru: 'Пока ничего нет.' },

  // Lab buyurtma kartochkasi
  labOrderCardNew: {
    uz: '🆕 <b>Yangi apparat</b>\n\n👤 Bemor: <b>{patient}</b>\n🦷 Apparat: <b>{appliance}</b>\n👨‍⚕️ Shifokor: <b>{doctor}</b>\n📅 Yuborilgan: {created}',
    ru: '🆕 <b>Новый аппарат</b>\n\n👤 Пациент: <b>{patient}</b>\n🦷 Аппарат: <b>{appliance}</b>\n👨‍⚕️ Врач: <b>{doctor}</b>\n📅 Отправлено: {created}',
  },
  labOrderCardInProgress: {
    uz: '⚙️ <b>Tayyorlanmoqda</b>\n\n👤 Bemor: <b>{patient}</b>\n🦷 Apparat: <b>{appliance}</b>\n👨‍⚕️ Shifokor: <b>{doctor}</b>\n📅 Qabul qilingan: {accepted}\n⏰ Tayyor bo\'lish sanasi: <b>{due}</b>',
    ru: '⚙️ <b>В процессе</b>\n\n👤 Пациент: <b>{patient}</b>\n🦷 Аппарат: <b>{appliance}</b>\n👨‍⚕️ Врач: <b>{doctor}</b>\n📅 Принято: {accepted}\n⏰ Срок готовности: <b>{due}</b>',
  },
  labOrderCardDone: {
    uz: '✅ <b>Tugallangan</b>\n\n👤 Bemor: <b>{patient}</b>\n🦷 Apparat: <b>{appliance}</b>\n👨‍⚕️ Shifokor: <b>{doctor}</b>\n✅ Tugallangan: {completed}',
    ru: '✅ <b>Завершено</b>\n\n👤 Пациент: <b>{patient}</b>\n🦷 Аппарат: <b>{appliance}</b>\n👨‍⚕️ Врач: <b>{doctor}</b>\n✅ Завершено: {completed}',
  },
  labOrderNotesLabel: { uz: '📝 Qo\'shimcha izoh', ru: '📝 Дополнительная заметка' },
  labOrderXrayLabel: { uz: '🦴 3D rentgen', ru: '🦴 3D рентген' },
  labOrderScannerLabel: { uz: '📡 Skaner', ru: '📡 Сканер' },

  // Lab amallar tugmalari
  labAcceptBtn: { uz: '✅ Qabul qilaman', ru: '✅ Принимаю' },
  labRejectBtn: { uz: '❌ Qabul qilmayman', ru: '❌ Не принимаю' },
  labReadyBtn: { uz: '✅ Tayyor', ru: '✅ Готово' },
  labRejectAskReason: {
    uz: '❌ Iltimos, rad etish sababini yozing:\n\n/cancel — bekor qilish',
    ru: '❌ Пожалуйста, напишите причину отказа:\n\n/cancel — отменить',
  },
  labAcceptedMsg: {
    uz: '✅ Qabul qilindi! "Tayyorlanayotgan" bo\'limiga o\'tdi.\n⏰ Tayyor bo\'lish sanasi: <b>{due}</b>',
    ru: '✅ Принято! Перешло в раздел «В процессе».\n⏰ Срок готовности: <b>{due}</b>',
  },
  labRejectedMsg: {
    uz: '❌ Apparat rad etildi. Koordinatorga xabar yuborildi.',
    ru: '❌ Аппарат отклонён. Координатор уведомлён.',
  },
  labReadyDoneMsg: {
    uz: '🎉 Apparat tayyor deb belgilandi! "Tugallangan" bo\'limiga o\'tdi.',
    ru: '🎉 Аппарат отмечен как готовый! Перешло в раздел «Завершённые».',
  },

  // ========== KOORDINATOR LAB BO'LIMI ==========
  coordExtraLab: { uz: '🦷 Laboratoriya', ru: '🦷 Лаборатория' },
  coordLabTitle: {
    uz: '🦷 <b>Laboratoriya</b>\n\nKerakli amalni tanlang:',
    ru: '🦷 <b>Лаборатория</b>\n\nВыберите действие:',
  },
  coordLabAddBtn: { uz: '➕ Yangi apparat qo\'shish', ru: '➕ Добавить новый аппарат' },
  coordLabReadyBtn: { uz: '✅ Tayyor apparatlar', ru: '✅ Готовые аппараты' },

  // Yangi apparat qadamlari (koordinator)
  labAskPatient: {
    uz: '👤 <b>Bemor ism-familiyasini</b> kiriting:\n\n/cancel — bekor qilish',
    ru: '👤 Введите <b>ФИО пациента</b>:\n\n/cancel — отменить',
  },
  labAskAppliance: { uz: '🦷 Apparat nomini tanlang:', ru: '🦷 Выберите название аппарата:' },
  labAskDoctor: { uz: '👨‍⚕️ Shifokorni tanlang:', ru: '👨‍⚕️ Выберите врача:' },
  labAskXray: {
    uz: '🦴 <b>Bemor 3D rentgenini</b> yuboring (rasm yoki fayl).\n\n<i>O\'tkazib yuborish:</i> /skip\n/cancel — bekor',
    ru: '🦴 Отправьте <b>3D рентген пациента</b> (фото или файл).\n\n<i>Пропустить:</i> /skip\n/cancel — отмена',
  },
  labAskScanner: {
    uz: '📡 <b>Bemor skaneri</b> yuboring (rasm, video yoki fayl).\n\n<i>O\'tkazib yuborish:</i> /skip\n/cancel — bekor',
    ru: '📡 Отправьте <b>сканер пациента</b> (фото, видео или файл).\n\n<i>Пропустить:</i> /skip\n/cancel — отмена',
  },
  labAskNotes: {
    uz: '📝 <b>Qo\'shimcha izoh</b> yuboring (matn, rasm, audio, fayl yoki ovozli xabar).\n\n<i>O\'tkazib yuborish:</i> /skip\n/cancel — bekor',
    ru: '📝 Отправьте <b>дополнительную заметку</b> (текст, фото, аудио, файл или голосовое).\n\n<i>Пропустить:</i> /skip\n/cancel — отмена',
  },
  labFileSaved: { uz: '✅ Saqlandi.', ru: '✅ Сохранено.' },
  labMoreFilesHint: {
    uz: 'Yana fayl yuborishingiz mumkin yoki <b>/next</b> orqali keyingi qadamga o\'ting.',
    ru: 'Можете отправить ещё файл или продолжить через <b>/next</b>.',
  },
  labOrderCreated: {
    uz: '✅ <b>Apparat yuborildi!</b>\n\nLaboratoriya xodimlariga xabar yuborildi.',
    ru: '✅ <b>Аппарат отправлен!</b>\n\nСотрудники лаборатории уведомлены.',
  },
  labReadyOrdersTitle: {
    uz: '✅ <b>Tayyor apparatlar</b>',
    ru: '✅ <b>Готовые аппараты</b>',
  },

  // Bildirishnomalar
  labNotifyNewToWorker: {
    uz: '🔔 <b>Yangi apparat keldi!</b>\n\n👤 Bemor: <b>{patient}</b>\n🦷 Apparat: <b>{appliance}</b>\n👨‍⚕️ Shifokor: <b>{doctor}</b>\n\n/laboratoriya — Yangi apparatlar bo\'limiga kiring.',
    ru: '🔔 <b>Новый аппарат!</b>\n\n👤 Пациент: <b>{patient}</b>\n🦷 Аппарат: <b>{appliance}</b>\n👨‍⚕️ Врач: <b>{doctor}</b>\n\n/laboratoriya — откройте раздел «Новые аппараты».',
  },
  labNotifyAcceptedToCoord: {
    uz: '✅ <b>Lab qabul qildi</b>\n\n👤 Bemor: <b>{patient}</b>\n🦷 {appliance}\n🧑‍🔧 Lab xodim: <b>{worker}</b>\n⏰ Tayyor: <b>{due}</b>',
    ru: '✅ <b>Лаборатория приняла</b>\n\n👤 Пациент: <b>{patient}</b>\n🦷 {appliance}\n🧑‍🔧 Сотрудник: <b>{worker}</b>\n⏰ Готов: <b>{due}</b>',
  },
  labNotifyRejectedToCoord: {
    uz: '❌ <b>Lab rad etdi</b>\n\n👤 Bemor: <b>{patient}</b>\n🦷 {appliance}\n🧑‍🔧 Lab xodim: <b>{worker}</b>\n💬 Sabab: <i>{reason}</i>\n\nMa\'lumotlarni tahrirlab qaytadan yuborishingiz mumkin: /koordinator → 🦷 Laboratoriya',
    ru: '❌ <b>Лаборатория отклонила</b>\n\n👤 Пациент: <b>{patient}</b>\n🦷 {appliance}\n🧑‍🔧 Сотрудник: <b>{worker}</b>\n💬 Причина: <i>{reason}</i>\n\nВы можете отредактировать и отправить снова: /koordinator → 🦷 Лаборатория',
  },
  labNotifyDoneToCoord: {
    uz: '🎉 <b>Apparat tayyor!</b>\n\n👤 Bemor: <b>{patient}</b>\n🦷 {appliance}\n🧑‍🔧 Lab xodim: <b>{worker}</b>',
    ru: '🎉 <b>Аппарат готов!</b>\n\n👤 Пациент: <b>{patient}</b>\n🦷 {appliance}\n🧑‍🔧 Сотрудник: <b>{worker}</b>',
  },

  // ========== ADMIN: LABORATORIYA BOSHQARUVI ==========
  adminLabHomeTitle: {
    uz: '🦷 <b>Laboratoriya — Admin</b>\n\nKerakli bo\'limni tanlang:',
    ru: '🦷 <b>Лаборатория — Админ</b>\n\nВыберите раздел:',
  },
  adminLabWorkersBtn: { uz: '👥 Lab xodimlari', ru: '👥 Сотрудники лаборатории' },
  adminLabAppliancesBtn: { uz: '🦷 Apparat nomlari', ru: '🦷 Названия аппаратов' },
  adminLabDoctorsBtn: { uz: '👨‍⚕️ Shifokorlar', ru: '👨‍⚕️ Врачи' },
  adminLabOrdersNewBtn: { uz: '🆕 Yangi ishlar', ru: '🆕 Новые работы' },
  adminLabOrdersInProgressBtn: { uz: '⚙️ Tayyorlanayotgan', ru: '⚙️ В процессе' },
  adminLabOrdersDoneBtn: { uz: '✅ Tugagan ishlar', ru: '✅ Завершённые' },

  adminLabWorkersTitle: { uz: '👥 <b>Lab xodimlari</b>', ru: '👥 <b>Сотрудники лаборатории</b>' },
  adminLabWorkersEmpty: { uz: 'Hali lab xodimi yo\'q.', ru: 'Сотрудников ещё нет.' },
  adminLabWorkerAdd: { uz: '➕ Yangi xodim', ru: '➕ Новый сотрудник' },
  adminLabAskWorkerTg: {
    uz: '🆔 Yangi lab xodimining <b>Telegram ID</b> sini yuboring:\n\n💡 @userinfobot orqali bilib oladi.\n\n/cancel — bekor',
    ru: '🆔 Отправьте <b>Telegram ID</b> нового сотрудника:\n\n💡 Через @userinfobot.\n\n/cancel — отмена',
  },
  adminLabAskWorkerName: { uz: '👤 Ism familiyasini yuboring:', ru: '👤 Введите имя и фамилию:' },
  adminLabWorkerInvalidTg: {
    uz: '⚠️ Telegram ID faqat raqamlardan iborat bo\'lishi kerak.',
    ru: '⚠️ Telegram ID должен состоять только из цифр.',
  },
  adminLabWorkerDuplicate: {
    uz: '⚠️ Bu Telegram ID allaqachon lab xodimi sifatida ro\'yxatda.',
    ru: '⚠️ Этот Telegram ID уже есть в списке сотрудников.',
  },
  adminLabWorkerAdded: { uz: '✅ Lab xodim qo\'shildi.', ru: '✅ Сотрудник добавлен.' },
  adminLabWorkerDeleted: { uz: '🗑 Xodim o\'chirildi.', ru: '🗑 Сотрудник удалён.' },

  adminLabAppliancesTitle: { uz: '🦷 <b>Apparat nomlari</b>', ru: '🦷 <b>Названия аппаратов</b>' },
  adminLabAppliancesEmpty: { uz: 'Apparat nomlari yo\'q.', ru: 'Названий нет.' },
  adminLabApplianceAdd: { uz: '➕ Yangi apparat nomi', ru: '➕ Новое название' },
  adminLabAskApplianceName: {
    uz: '🦷 Yangi apparat nomini kiriting (masalan: <i>Twin block</i>):\n\n/cancel — bekor',
    ru: '🦷 Введите название аппарата (например: <i>Twin block</i>):\n\n/cancel — отмена',
  },
  adminLabApplianceAdded: { uz: '✅ Apparat nomi qo\'shildi.', ru: '✅ Название добавлено.' },
  adminLabApplianceDeleted: { uz: '🗑 O\'chirildi.', ru: '🗑 Удалено.' },
  adminLabApplianceDuplicate: { uz: '⚠️ Bu nom allaqachon mavjud.', ru: '⚠️ Это название уже есть.' },

  adminLabDoctorsTitle: { uz: '👨‍⚕️ <b>Shifokorlar (lab uchun)</b>', ru: '👨‍⚕️ <b>Врачи (для лаборатории)</b>' },
  adminLabDoctorsEmpty: { uz: 'Shifokorlar yo\'q.', ru: 'Врачей нет.' },
  adminLabDoctorAdd: { uz: '➕ Yangi shifokor', ru: '➕ Новый врач' },
  adminLabAskDoctorName: {
    uz: '👨‍⚕️ Shifokor ism-familiyasini kiriting (masalan: <i>Ahrorxon Sobirov</i>):\n\n/cancel — bekor',
    ru: '👨‍⚕️ Введите ФИО врача (например: <i>Ahrorxon Sobirov</i>):\n\n/cancel — отмена',
  },
  adminLabDoctorAdded: { uz: '✅ Shifokor qo\'shildi.', ru: '✅ Врач добавлен.' },
  adminLabDoctorDeleted: { uz: '🗑 O\'chirildi.', ru: '🗑 Удалено.' },
  adminLabDoctorDuplicate: { uz: '⚠️ Bu shifokor allaqachon mavjud.', ru: '⚠️ Этот врач уже есть.' },

  adminLabOrdersEmpty: { uz: 'Hozircha ishlar yo\'q.', ru: 'Пока работ нет.' },
};

export function tr(key: keyof typeof t, lang: Lang): string {
  const v = t[key];
  if (typeof v === 'object' && 'uz' in v) return v[lang];
  return '';
}
