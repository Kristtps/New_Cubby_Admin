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
        'nav.auditlog': 'Audit Log',
        'sidebar.adminPanel': 'Admin Panel',
        
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
        'stat.totalLockers': 'TOTAL LOCKERS',
        'stat.activeRentals': 'ACTIVE RENTALS',
        'stat.customers': 'CUSTOMERS',
        'stat.totalRevenue': 'TOTAL REVENUE',
        'chart.sales': 'Sales — Last 7 Days',
        'chart.dailyRevenue': 'Daily revenue in PHP',
        'overview.recentRentals': 'Recent Rentals',
        'overview.noRecentRentals': 'No recent rentals.',
        'overview.loading': 'Loading modules and lockers...',
        
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
        'lockers.code': 'Code',
        'lockers.size': 'Size',
        'lockers.module': 'Module',
        'lockers.device': 'Device',
        'lockers.status': 'Status',
        'lockers.actions': 'Actions',
        
        // Customers Page
        'customers.title': 'Customers',
        'customers.subtitle': 'All registered users of your CoinCubby.',
        'customers.search': 'Search by name, email, or user ID...',
        'customers.newest': 'Newest First',
        'customers.oldest': 'Oldest First',
        'customers.nameAsc': 'Name (A-Z)',
        'customers.nameDesc': 'Name (Z-A)',
        'customers.name': 'Name',
        'customers.email': 'Email',
        'customers.userId': 'User ID',
        'customers.wallet': 'Wallet',
        'customers.rentals': 'Rentals',
        'customers.totalSpent': 'Total Spent',
        'customers.joined': 'Joined',
        'customers.loading': 'Loading customers...',
        
        // Transactions Page
        'transactions.title': 'Transactions',
        'transactions.subtitle': 'View all payment and transaction history.',
        'transactions.id': 'Transaction ID',
        'transactions.date': 'Date & Time',
        'transactions.customer': 'Customer',
        'transactions.type': 'Type',
        'transactions.method': 'Method',
        'transactions.locker': 'Locker',
        'transactions.amount': 'Amount',
        'transactions.loading': 'Loading transactions...',
        
        // Rentals Page
        'rentals.title': 'Active Rentals',
        'rentals.subtitle': 'Monitor all ongoing locker rentals.',
        'rentals.locker': 'Locker',
        'rentals.customer': 'Customer',
        'rentals.startTime': 'Start Time',
        'rentals.duration': 'Duration',
        'rentals.cost': 'Cost',
        'rentals.status': 'Status',
        'rentals.actions': 'Actions',
        'rentals.loading': 'Loading rentals...',
        
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
        
        // Buttons
        'btn.add': 'Add',
        'btn.edit': 'Edit',
        'btn.delete': 'Delete',
        'btn.save': 'Save',
        'btn.cancel': 'Cancel',
        'btn.confirm': 'Confirm',
        'btn.close': 'Close',
        
        // Days of week
        'day.mon': 'Mon',
        'day.tue': 'Tue',
        'day.wed': 'Wed',
        'day.thu': 'Thu',
        'day.fri': 'Fri',
        'day.sat': 'Sat',
        'day.sun': 'Sun',
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
        'nav.auditlog': 'Talaan ng Audit',
        'sidebar.adminPanel': 'Admin Panel',
        
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
        'stat.totalLockers': 'KABUUANG LOCKER',
        'stat.activeRentals': 'AKTIBONG RENTA',
        'stat.customers': 'MGA CUSTOMER',
        'stat.totalRevenue': 'KABUUANG KITA',
        'chart.sales': 'Benta — Nakaraang 7 Araw',
        'chart.dailyRevenue': 'Araw-araw na kita sa PHP',
        'overview.recentRentals': 'Kamakailang Renta',
        'overview.noRecentRentals': 'Walang kamakailang renta.',
        'overview.loading': 'Nilo-load ang mga module at locker...',
        
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
        'lockers.code': 'Code',
        'lockers.size': 'Laki',
        'lockers.module': 'Module',
        'lockers.device': 'Device',
        'lockers.status': 'Kalagayan',
        'lockers.actions': 'Mga Aksyon',
        
        // Customers Page (Tagalog)
        'customers.title': 'Mga Customer',
        'customers.subtitle': 'Lahat ng nakarehistrong user ng iyong CoinCubby.',
        'customers.search': 'Maghanap gamit ang pangalan, email, o user ID...',
        'customers.newest': 'Pinakabago Una',
        'customers.oldest': 'Pinaka-luma Una',
        'customers.nameAsc': 'Pangalan (A-Z)',
        'customers.nameDesc': 'Pangalan (Z-A)',
        'customers.name': 'Pangalan',
        'customers.email': 'Email',
        'customers.userId': 'User ID',
        'customers.wallet': 'Wallet',
        'customers.rentals': 'Mga Renta',
        'customers.totalSpent': 'Kabuuang Ginastos',
        'customers.joined': 'Sumali',
        'customers.loading': 'Nilo-load ang mga customer...',
        
        // Transactions Page (Tagalog)
        'transactions.title': 'Mga Transaksyon',
        'transactions.subtitle': 'Tingnan ang lahat ng bayad at kasaysayan ng transaksyon.',
        'transactions.id': 'Transaction ID',
        'transactions.date': 'Petsa at Oras',
        'transactions.customer': 'Customer',
        'transactions.type': 'Uri',
        'transactions.method': 'Paraan',
        'transactions.locker': 'Locker',
        'transactions.amount': 'Halaga',
        'transactions.loading': 'Nilo-load ang mga transaksyon...',
        
        // Rentals Page (Tagalog)
        'rentals.title': 'Aktibong Renta',
        'rentals.subtitle': 'Subaybayan ang lahat ng kasalukuyang renta ng locker.',
        'rentals.locker': 'Locker',
        'rentals.customer': 'Customer',
        'rentals.startTime': 'Oras ng Simula',
        'rentals.duration': 'Tagal',
        'rentals.cost': 'Gastos',
        'rentals.status': 'Kalagayan',
        'rentals.actions': 'Mga Aksyon',
        'rentals.loading': 'Nilo-load ang mga renta...',
        
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
        
        // Buttons (Tagalog)
        'btn.add': 'Magdagdag',
        'btn.edit': 'I-edit',
        'btn.delete': 'Tanggalin',
        'btn.save': 'I-save',
        'btn.cancel': 'Kanselahin',
        'btn.confirm': 'Kumpirmahin',
        'btn.close': 'Isara',
        
        // Days of week (Tagalog)
        'day.mon': 'Lun',
        'day.tue': 'Mar',
        'day.wed': 'Miy',
        'day.thu': 'Huw',
        'day.fri': 'Biy',
        'day.sat': 'Sab',
        'day.sun': 'Lin',
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
