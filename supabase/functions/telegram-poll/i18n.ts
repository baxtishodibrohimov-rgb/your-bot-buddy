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
};

export function tr(key: keyof typeof t, lang: Lang): string {
  const v = t[key];
  if (typeof v === 'object' && 'uz' in v) return v[lang];
  return '';
}
