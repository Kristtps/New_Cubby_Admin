// Language System for CoinCubby Admin Panel
// Supports English and Tagalog

const translations = {
    en: {
        // Sidebar
        'nav.overview': 'Overview',
        'nav.lockers': 'Lockers',
        'nav.customers': 'Customers',
        'nav.transactions': 'Transactions',
        'nav.rentals': 'Rentals',
        'nav.rates': 'Rates',
        'nav.reports': 'Reports',
        'nav.feedback': 'Feedback',
        'nav.notifications': 'Notifications',
        'nav.auditlog': 'Audit Log',
        'sidebar.adminPanel': 'Admin Panel',
        
        // Login Page
        'login.title': 'Admin Login',
        'login.subtitle': 'Sign in to your CoinCubby admin panel',
        'login.email': 'Email Address',
        'login.emailPlaceholder': 'Enter your email',
        'login.password': 'Password',
        'login.passwordPlaceholder': 'Enter your password',
        'login.rememberMe': 'Remember me',
        'login.signIn': 'Sign In',
        'login.welcome': 'Welcome to',
        'login.desc': 'Manage your locker rental system efficiently',
        
        // Overview Page
        'overview.title': 'Admin Overview',
        'overview.subtitle': 'Real-time status of your CoinCubby network.',
        'overview.last7days': 'Last 7 Days',
        'overview.last14days': 'Last 14 Days',
        'overview.last30days': 'Last 30 Days',
        'overview.thisMonth': 'This Month',
        'overview.customRange': 'Custom Range',
        'overview.from': 'From',
        'overview.to': 'To',
        'overview.apply': 'Apply',
        'stat.totalLockers': 'TOTAL LOCKERS',
        'stat.activeRentals': 'ACTIVE RENTALS',
        'stat.customers': 'CUSTOMERS',
        'stat.totalRevenue': 'TOTAL REVENUE',
        'chart.sales': 'Sales — Last 7 Days',
        'chart.dailyRevenue': 'Daily revenue in PHP',
        'overview.recentRentals': 'Recent Rentals',
        'overview.noRecentRentals': 'No recent rentals.',
        'overview.loading': 'Loading modules and lockers...',
        'overview.available': 'available',
        
        // Status Legend
        'status.available': 'Available',
        'status.occupied': 'Occupied',
        'status.payment': 'Payment Required',
        'status.maintenance': 'Maintenance',
        
        // Lockers Page
        'lockers.title': 'Locker Management',
        'lockers.subtitle': 'Control compartments, toggle maintenance, and configure modules.',
        'lockers.addModule': 'Add Module',
        'lockers.deleteModule': 'Delete Module',
        'lockers.allModules': 'All Modules',
        'lockers.code': 'CODE',
        'lockers.size': 'SIZE',
        'lockers.module': 'MODULE',
        'lockers.device': 'DEVICE',
        'lockers.status': 'STATUS',
        'lockers.actions': 'ACTIONS',
        'lockers.lockers': 'LOCKERS',
        
        // Rental Details Modal
        'modal.rentalDetails': 'Rental Details',
        'modal.lockerInfo': 'Locker Information',
        'modal.lockerNumber': 'Locker Number',
        'modal.size': 'Size',
        'modal.module': 'Module',
        'modal.status': 'Status',
        'modal.renterInfo': 'Renter Information',
        'modal.customerName': 'Customer Name',
        'modal.email': 'Email',
        'modal.phone': 'Phone',
        'modal.rentalTime': 'Rental Time',
        'modal.startTime': 'Start Time',
        'modal.duration': 'Duration',
        'modal.amount': 'Amount',
        'modal.close': 'Close',
        
        // Customers Page
        'customers.title': 'Customers',
        'customers.subtitle': 'All registered users of your CoinCubby.',
        'customers.search': 'Search by name, email, or user ID...',
        'customers.newest': 'Newest First',
        'customers.oldest': 'Oldest First',
        'customers.nameAsc': 'Name (A-Z)',
        'customers.nameDesc': 'Name (Z-A)',
        'customers.name': 'NAME',
        'customers.email': 'EMAIL',
        'customers.userId': 'USER ID',
        'customers.wallet': 'WALLET',
        'customers.rentals': 'RENTALS',
        'customers.totalSpent': 'TOTAL SPENT',
        'customers.joined': 'JOINED',
        'customers.loading': 'Loading customers...',
        
        // Transactions Page
        'transactions.title': 'Transactions',
        'transactions.subtitle': 'View all payment and transaction history.',
        'transactions.id': 'TRANSACTION ID',
        'transactions.date': 'DATE & TIME',
        'transactions.customer': 'CUSTOMER',
        'transactions.type': 'TYPE',
        'transactions.method': 'METHOD',
        'transactions.locker': 'LOCKER',
        'transactions.amount': 'AMOUNT',
        'transactions.status': 'STATUS',
        'transactions.loading': 'Loading transactions...',
        
        // Rentals Page
        'rentals.title': 'Active Rentals',
        'rentals.subtitle': 'Monitor all ongoing locker rentals.',
        'rentals.locker': 'LOCKER',
        'rentals.customer': 'CUSTOMER',
        'rentals.startTime': 'START TIME',
        'rentals.duration': 'DURATION',
        'rentals.cost': 'COST',
        'rentals.status': 'STATUS',
        'rentals.actions': 'ACTIONS',
        'rentals.loading': 'Loading rentals...',
        
        // Rates Page
        'rates.title': 'Pricing & Rates',
        'rates.subtitle': 'Configure pricing for different locker sizes.',
        'rates.addRate': 'Add New Rate',
        'rates.size': 'SIZE',
        'rates.rate': 'RATE',
        'rates.duration': 'DURATION',
        'rates.description': 'DESCRIPTION',
        'rates.actions': 'ACTIONS',
        
        // Reports Page
        'reports.title': 'Reports & Analytics',
        'reports.subtitle': 'View comprehensive reports and insights.',
        'reports.dateRange': 'Date Range',
        'reports.generate': 'Generate Report',
        'reports.export': 'Export',
        'reports.revenue': 'Revenue',
        'reports.rentals': 'Rentals',
        'reports.customers': 'Customers',
        
        // Feedback Page
        'feedback.title': 'Customer Feedback',
        'feedback.subtitle': 'View and manage customer feedback.',
        'feedback.filter': 'Filter by Status',
        'feedback.all': 'All',
        'feedback.pending': 'Pending',
        'feedback.resolved': 'Resolved',
        
        // Notifications Page
        'notifications.title': 'Notifications',
        'notifications.subtitle': 'Manage system notifications.',
        'notifications.markAllRead': 'Mark All as Read',
        'notifications.new': 'New',
        'notifications.earlier': 'Earlier',
        
        // Audit Log Page
        'auditlog.title': 'Audit Log',
        'auditlog.subtitle': 'Track all system activities and changes.',
        'auditlog.action': 'ACTION',
        'auditlog.user': 'USER',
        'auditlog.timestamp': 'TIMESTAMP',
        'auditlog.details': 'DETAILS',
        
        // Profile Page
        'profile.title': 'Profile',
        'profile.subtitle': 'Manage your account settings.',
        'profile.personalInfo': 'Personal Information',
        'profile.edit': 'Edit',
        'profile.avatar': 'Avatar',
        'profile.changeAvatar': 'Change Avatar',
        'profile.fullName': 'Full Name',
        'profile.emailAddress': 'Email Address',
        'profile.saveChanges': 'Save Changes',
        'profile.changePassword': 'Change Password',
        'profile.currentPassword': 'Current Password',
        'profile.newPassword': 'New Password',
        'profile.confirmPassword': 'Confirm New Password',
        'profile.updatePassword': 'Update Password',
        'profile.preferences': 'Preferences',
        'profile.language': 'Language',
        'profile.languageDesc': 'Choose your preferred language.',
        'profile.appearance': 'Appearance',
        'profile.appearanceDesc': 'Toggle between Light and Dark mode.',
        'profile.light': 'Light',
        'profile.dark': 'Dark',
        'profile.dangerZone': 'Danger Zone',
        'profile.signOutDesc': 'Sign out of your account on this device.',
        'profile.signOut': 'Sign Out',
        'profile.administrator': 'Administrator',
        'profile.joined': 'Joined',
        'profile.admin': 'Admin',
        
        // Buttons
        'btn.add': 'Add',
        'btn.edit': 'Edit',
        'btn.delete': 'Delete',
        'btn.save': 'Save',
        'btn.cancel': 'Cancel',
        'btn.confirm': 'Confirm',
        'btn.close': 'Close',
        'btn.apply': 'Apply',
        'btn.export': 'Export',
        'btn.filter': 'Filter',
        
        // Days of week
        'day.mon': 'Mon',
        'day.tue': 'Tue',
        'day.wed': 'Wed',
        'day.thu': 'Thu',
        'day.fri': 'Fri',
        'day.sat': 'Sat',
        'day.sun': 'Sun',
        
        // Common
        'common.loading': 'Loading...',
        'common.noData': 'No data available',
        'common.search': 'Search',
        'common.sort': 'Sort',
    },
    
    tl: {
        // Sidebar (Tagalog)
        'nav.overview': 'Pangkalahatang-Tanaw',
        'nav.lockers': 'Mga Locker',
        'nav.customers': 'Mga Customer',
        'nav.transactions': 'Mga Transaksyon',
        'nav.rentals': 'Mga Renta',
        'nav.rates': 'Mga Presyo',
        'nav.reports': 'Mga Ulat',
        'nav.feedback': 'Feedback',
        'nav.notifications': 'Mga Abiso',
        'nav.auditlog': 'Talaan ng Audit',
        'sidebar.adminPanel': 'Admin Panel',
        
        // Login Page (Tagalog)
        'login.title': 'Pag-login ng Admin',
        'login.subtitle': 'Mag-sign in sa iyong CoinCubby admin panel',
        'login.email': 'Email Address',
        'login.emailPlaceholder': 'Ilagay ang iyong email',
        'login.password': 'Password',
        'login.passwordPlaceholder': 'Ilagay ang iyong password',
        'login.rememberMe': 'Tandaan ako',
        'login.signIn': 'Mag-sign In',
        'login.welcome': 'Maligayang pagdating sa',
        'login.desc': 'Pamahalaan ang iyong locker rental system nang mahusay',
        
        // Overview Page (Tagalog)
        'overview.title': 'Pangkalahatang-Tanaw ng Admin',
        'overview.subtitle': 'Real-time na kalagayan ng iyong CoinCubby network.',
        'overview.last7days': 'Nakaraang 7 Araw',
        'overview.last14days': 'Nakaraang 14 na Araw',
        'overview.last30days': 'Nakaraang 30 Araw',
        'overview.thisMonth': 'Ngayong Buwan',
        'overview.customRange': 'Pasadyang Saklaw',
        'overview.from': 'Mula',
        'overview.to': 'Hanggang',
        'overview.apply': 'Ilapat',
        'stat.totalLockers': 'KABUUANG LOCKER',
        'stat.activeRentals': 'AKTIBONG RENTA',
        'stat.customers': 'MGA CUSTOMER',
        'stat.totalRevenue': 'KABUUANG KITA',
        'chart.sales': 'Benta — Nakaraang 7 Araw',
        'chart.dailyRevenue': 'Araw-araw na kita sa PHP',
        'overview.recentRentals': 'Kamakailang Renta',
        'overview.noRecentRentals': 'Walang kamakailang renta.',
        'overview.loading': 'Nilo-load ang mga module at locker...',
        'overview.available': 'magagamit',
        
        // Status Legend (Tagalog)
        'status.available': 'Magagamit',
        'status.occupied': 'May Laman',
        'status.payment': 'Kailangan Magbayad',
        'status.maintenance': 'Kinakaayos',
        
        // Lockers Page (Tagalog)
        'lockers.title': 'Pamamahala ng Locker',
        'lockers.subtitle': 'Kontrolin ang mga compartment, i-toggle ang maintenance, at i-configure ang mga module.',
        'lockers.addModule': 'Magdagdag ng Module',
        'lockers.deleteModule': 'Tanggalin ang Module',
        'lockers.allModules': 'Lahat ng Module',
        'lockers.code': 'CODE',
        'lockers.size': 'LAKI',
        'lockers.module': 'MODULE',
        'lockers.device': 'DEVICE',
        'lockers.status': 'KALAGAYAN',
        'lockers.actions': 'MGA AKSYON',
        'lockers.lockers': 'LOCKER',
        
        // Rental Details Modal (Tagalog)
        'modal.rentalDetails': 'Detalye ng Renta',
        'modal.lockerInfo': 'Impormasyon ng Locker',
        'modal.lockerNumber': 'Numero ng Locker',
        'modal.size': 'Laki',
        'modal.module': 'Module',
        'modal.status': 'Kalagayan',
        'modal.renterInfo': 'Impormasyon ng Nangungupahan',
        'modal.customerName': 'Pangalan ng Customer',
        'modal.email': 'Email',
        'modal.phone': 'Telepono',
        'modal.rentalTime': 'Oras ng Renta',
        'modal.startTime': 'Oras ng Simula',
        'modal.duration': 'Tagal',
        'modal.amount': 'Halaga',
        'modal.close': 'Isara',
        
        // Customers Page (Tagalog)
        'customers.title': 'Mga Customer',
        'customers.subtitle': 'Lahat ng nakarehistrong user ng iyong CoinCubby.',
        'customers.search': 'Maghanap gamit ang pangalan, email, o user ID...',
        'customers.newest': 'Pinakabago Una',
        'customers.oldest': 'Pinaka-luma Una',
        'customers.nameAsc': 'Pangalan (A-Z)',
        'customers.nameDesc': 'Pangalan (Z-A)',
        'customers.name': 'PANGALAN',
        'customers.email': 'EMAIL',
        'customers.userId': 'USER ID',
        'customers.wallet': 'WALLET',
        'customers.rentals': 'MGA RENTA',
        'customers.totalSpent': 'KABUUANG GINASTOS',
        'customers.joined': 'SUMALI',
        'customers.loading': 'Nilo-load ang mga customer...',
        
        // Transactions Page (Tagalog)
        'transactions.title': 'Mga Transaksyon',
        'transactions.subtitle': 'Tingnan ang lahat ng bayad at kasaysayan ng transaksyon.',
        'transactions.id': 'TRANSACTION ID',
        'transactions.date': 'PETSA AT ORAS',
        'transactions.customer': 'CUSTOMER',
        'transactions.type': 'URI',
        'transactions.method': 'PARAAN',
        'transactions.locker': 'LOCKER',
        'transactions.amount': 'HALAGA',
        'transactions.status': 'KALAGAYAN',
        'transactions.loading': 'Nilo-load ang mga transaksyon...',
        
        // Rentals Page (Tagalog)
        'rentals.title': 'Aktibong Renta',
        'rentals.subtitle': 'Subaybayan ang lahat ng kasalukuyang renta ng locker.',
        'rentals.locker': 'LOCKER',
        'rentals.customer': 'CUSTOMER',
        'rentals.startTime': 'ORAS NG SIMULA',
        'rentals.duration': 'TAGAL',
        'rentals.cost': 'GASTOS',
        'rentals.status': 'KALAGAYAN',
        'rentals.actions': 'MGA AKSYON',
        'rentals.loading': 'Nilo-load ang mga renta...',
        
        // Rates Page (Tagalog)
        'rates.title': 'Presyo at Mga Rate',
        'rates.subtitle': 'I-configure ang presyo para sa iba\'t ibang laki ng locker.',
        'rates.addRate': 'Magdagdag ng Bagong Rate',
        'rates.size': 'LAKI',
        'rates.rate': 'RATE',
        'rates.duration': 'TAGAL',
        'rates.description': 'PAGLALARAWAN',
        'rates.actions': 'MGA AKSYON',
        
        // Reports Page (Tagalog)
        'reports.title': 'Mga Ulat at Pagsusuri',
        'reports.subtitle': 'Tingnan ang komprehensibong mga ulat at insight.',
        'reports.dateRange': 'Saklaw ng Petsa',
        'reports.generate': 'Gumawa ng Ulat',
        'reports.export': 'I-export',
        'reports.revenue': 'Kita',
        'reports.rentals': 'Mga Renta',
        'reports.customers': 'Mga Customer',
        
        // Feedback Page (Tagalog)
        'feedback.title': 'Feedback ng Customer',
        'feedback.subtitle': 'Tingnan at pamahalaan ang feedback ng customer.',
        'feedback.filter': 'I-filter ayon sa Kalagayan',
        'feedback.all': 'Lahat',
        'feedback.pending': 'Naghihintay',
        'feedback.resolved': 'Nalutas',
        
        // Notifications Page (Tagalog)
        'notifications.title': 'Mga Abiso',
        'notifications.subtitle': 'Pamahalaan ang mga abiso ng system.',
        'notifications.markAllRead': 'Markahan Lahat bilang Nabasa',
        'notifications.new': 'Bago',
        'notifications.earlier': 'Mas Maaga',
        
        // Audit Log Page (Tagalog)
        'auditlog.title': 'Talaan ng Audit',
        'auditlog.subtitle': 'Subaybayan ang lahat ng aktibidad at pagbabago ng system.',
        'auditlog.action': 'AKSYON',
        'auditlog.user': 'USER',
        'auditlog.timestamp': 'ORAS',
        'auditlog.details': 'MGA DETALYE',
        
        // Profile Page (Tagalog)
        'profile.title': 'Profile',
        'profile.subtitle': 'Pamahalaan ang iyong mga setting ng account.',
        'profile.personalInfo': 'Personal na Impormasyon',
        'profile.edit': 'I-edit',
        'profile.avatar': 'Avatar',
        'profile.changeAvatar': 'Palitan ang Avatar',
        'profile.fullName': 'Buong Pangalan',
        'profile.emailAddress': 'Email Address',
        'profile.saveChanges': 'I-save ang mga Pagbabago',
        'profile.changePassword': 'Palitan ang Password',
        'profile.currentPassword': 'Kasalukuyang Password',
        'profile.newPassword': 'Bagong Password',
        'profile.confirmPassword': 'Kumpirmahin ang Bagong Password',
        'profile.updatePassword': 'I-update ang Password',
        'profile.preferences': 'Mga Kagustuhan',
        'profile.language': 'Wika',
        'profile.languageDesc': 'Pumili ng iyong ginustong wika.',
        'profile.appearance': 'Hitsura',
        'profile.appearanceDesc': 'Lumipat sa pagitan ng Light at Dark mode.',
        'profile.light': 'Maliwanag',
        'profile.dark': 'Madilim',
        'profile.dangerZone': 'Danger Zone',
        'profile.signOutDesc': 'Mag-sign out mula sa iyong account sa device na ito.',
        'profile.signOut': 'Mag-sign Out',
        'profile.administrator': 'Tagapangasiwa',
        'profile.joined': 'Sumali',
        'profile.admin': 'Admin',
        
        // Buttons (Tagalog)
        'btn.add': 'Magdagdag',
        'btn.edit': 'I-edit',
        'btn.delete': 'Tanggalin',
        'btn.save': 'I-save',
        'btn.cancel': 'Kanselahin',
        'btn.confirm': 'Kumpirmahin',
        'btn.close': 'Isara',
        'btn.apply': 'Ilapat',
        'btn.export': 'I-export',
        'btn.filter': 'I-filter',
        
        // Days of week (Tagalog)
        'day.mon': 'Lun',
        'day.tue': 'Mar',
        'day.wed': 'Miy',
        'day.thu': 'Huw',
        'day.fri': 'Biy',
        'day.sat': 'Sab',
        'day.sun': 'Lin',
        
        // Common (Tagalog)
        'common.loading': 'Nilo-load...',
        'common.noData': 'Walang available na data',
        'common.search': 'Maghanap',
        'common.sort': 'I-sort',
    }
};

// Language Manager
class LanguageManager {
    constructor() {
        this.currentLang = this.getStoredLanguage() || 'en';
        this.init();
    }
    
    init() {
        // Set initial language
        this.applyLanguage(this.currentLang);
        
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang === 'tl' ? 'tl' : 'en';
    }
    
    getStoredLanguage() {
        try {
            return localStorage.getItem('coincubby_language') || 'en';
        } catch (e) {
            return 'en';
        }
    }
    
    setLanguage(lang) {
        if (lang !== 'en' && lang !== 'tl') {
            console.error('Invalid language:', lang);
            return;
        }
        
        this.currentLang = lang;
        
        try {
            localStorage.setItem('coincubby_language', lang);
        } catch (e) {
            console.error('Failed to save language preference:', e);
        }
        
        this.applyLanguage(lang);
        document.documentElement.lang = lang === 'tl' ? 'tl' : 'en';
        
        // Dispatch custom event for language change
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }
    
    applyLanguage(lang) {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key, lang);
            
            if (translation) {
                // Check if element is input placeholder
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Update all elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.translate(key, lang);
            
            if (translation && element.tagName === 'INPUT') {
                element.placeholder = translation;
            }
        });
    }
    
    translate(key, lang = null) {
        const language = lang || this.currentLang;
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }
    
    getCurrentLanguage() {
        return this.currentLang;
    }
}

// Initialize language manager
const languageManager = new LanguageManager();

// Helper function for easy access
function t(key) {
    return languageManager.translate(key);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LanguageManager, languageManager, t };
}
