// Language System for CoinCubby Admin Panel
// Supports English and Tagalog

const translations = {
    en: {
        // ── Sidebar ──────────────────────────────────────────────────────────
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
        'nav.notifications': 'Notifications',
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

        // ── Lockers Page ──────────────────────────────────────────────────────
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

        // ── Transactions Page ─────────────────────────────────────────────────
        'transactions.title': 'Transactions',
        'transactions.subtitle': 'View all payment and transaction history.',
        'transactions.id': 'TRANSACTION ID',
        'transactions.date': 'DATE & TIME',
        'transactions.customer': 'CUSTOMER',
        'transactions.userId': 'USER ID',
        'transactions.type': 'TYPE',
        'transactions.method': 'METHOD',
        'transactions.locker': 'LOCKER',
        'transactions.amount': 'AMOUNT',
        'transactions.status': 'STATUS',
        'transactions.loading': 'Loading transactions...',
        'transactions.search': 'Search by customer, locker, or type...',
        'transactions.allTransactions': 'All Transactions',
        'transactions.payment': 'Payment',
        'transactions.walletLoad': 'Wallet Load',
        'transactions.cashCollection': 'Cash Collection',
        'transactions.todayTotal': 'TODAY\'S TOTAL',
        'transactions.coinsOnHand': 'COINS ON HAND',
        'transactions.allCount': 'ALL TRANSACTIONS',
        'transactions.sectionTitle': 'All Transactions',
        'transactions.resetTitle': 'Reset Coins on Hand',
        'transactions.currentCoins': 'Current Coins on Hand',
        'transactions.whatIsReset': 'What is Reset For?',
        'transactions.resetDesc': 'Use this reset function when you have physically collected the coins from your device. This will set the counter to ₱0.00 and start tracking from zero again. Your transaction history will remain unchanged.',
        'transactions.cancel': 'Cancel',
        'transactions.resetTo': 'Reset to ₱0.00',

        // ── Rentals Page ──────────────────────────────────────────────────────
        'rentals.title': 'Active Rentals',
        'rentals.subtitle': 'Monitor all ongoing locker rentals.',
        'rentals.locker': 'LOCKER',
        'rentals.customer': 'CUSTOMER',
        'rentals.startTime': 'START TIME',
        'rentals.startDate': 'START DATE',
        'rentals.endDate': 'END DATE',
        'rentals.duration': 'DURATION',
        'rentals.cost': 'COST',
        'rentals.amount': 'AMOUNT',
        'rentals.status': 'STATUS',
        'rentals.actions': 'ACTIONS',
        'rentals.loading': 'Loading rentals...',
        'rentals.moreThan1hr': 'More than 1 hour',
        'rentals.under1hr': 'Under 1 hour',
        'rentals.under30min': 'Under 30 minutes',
        'rentals.overtime': 'Overtime',
        'rentals.detailsTitle': 'Rental Details',
        'rentals.detailCustomer': 'Customer:',
        'rentals.detailLocker': 'Locker:',
        'rentals.detailStart': 'Start Date:',
        'rentals.detailEnd': 'End Date:',
        'rentals.detailDuration': 'Duration:',
        'rentals.detailType': 'Rental Type:',
        'rentals.detailStatus': 'Status:',
        'rentals.detailOvertime': 'Overtime:',
        'rentals.detailFee': 'Additional Fee:',
        'rentals.detailAmount': 'Amount:',
        
        // Rates Page
        'rates.title': 'Payment Rates',
        'rates.subtitle': 'Configure hourly rates displayed on the machine.',
        'rates.small': 'Small',
        'rates.medium': 'Medium',
        'rates.large': 'Large',
        'rates.smallDesc': 'shoes / small pack',
        'rates.mediumDesc': 'helmet / backpack',
        'rates.largeDesc': 'blue jug / luggage',
        'rates.ratePerHour': 'Rate per hour (₱)',
        'rates.editRates': 'Edit Rates',
        'rates.saveRates': 'Save Rates',
        'rates.history': 'Rate Change History',
        'rates.historyDate': 'Date & Time',
        'rates.historyChangedBy': 'Changed By',
        'rates.historySmall': 'Small (₱/hr)',
        'rates.historyMedium': 'Medium (₱/hr)',
        'rates.historyLarge': 'Large (₱/hr)',
        'rates.historyChanges': 'Changes',
        'rates.clearHistory': 'Clear History',
        'rates.noHistory': 'No rate changes recorded yet.',
        'rates.historyDesc': 'Changes will appear here after you save rates.',
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
        'profile.subtitle': 'Manage your account settings and kiosk credentials.',
        'profile.kioskCredentials': 'Kiosk Credentials',
        'profile.kioskDesc': 'These credentials are used to log in to the CoinCubby Kiosk. Both must be exactly 6 digits.',
        'profile.kioskAdminId': 'Kiosk Admin ID',
        'profile.kioskAdminPassword': 'Kiosk Admin Password',
        'profile.kioskHint': 'Must be exactly 6 digits (0-9).',
        'profile.saveKiosk': 'Save Kiosk Credentials',
        'profile.security': 'Security',
        'profile.securityDesc': 'Change the password you use to log in to this admin web application.',
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
        // ── Sidebar ───────────────────────────────────────────────────────────
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
        'nav.notifications': 'Mga Abiso',
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

        // ── Lockers Page ──────────────────────────────────────────────────────
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

        // ── Transactions Page ─────────────────────────────────────────────────
        'transactions.title': 'Mga Transaksyon',
        'transactions.subtitle': 'Tingnan ang lahat ng bayad at kasaysayan ng transaksyon.',
        'transactions.id': 'TRANSACTION ID',
        'transactions.date': 'PETSA AT ORAS',
        'transactions.customer': 'CUSTOMER',
        'transactions.userId': 'USER ID',
        'transactions.type': 'TIPO',
        'transactions.method': 'PARAAN',
        'transactions.locker': 'LOCKER',
        'transactions.amount': 'HALAGA',
        'transactions.status': 'KALAGAYAN',
        'transactions.loading': 'Nilo-load ang mga transaksyon...',
        'transactions.search': 'Maghanap gamit ang customer, locker, o tipo...',
        'transactions.allTransactions': 'Lahat ng Transaksyon',
        'transactions.payment': 'Bayad',
        'transactions.walletLoad': 'Pagkarga ng Wallet',
        'transactions.cashCollection': 'Koleksyon ng Pera',
        'transactions.todayTotal': 'KABUUAN NGAYONG ARAW',
        'transactions.coinsOnHand': 'PISO SA KAMAY',
        'transactions.allCount': 'LAHAT NG TRANSAKSYON',
        'transactions.sectionTitle': 'Lahat ng Transaksyon',
        'transactions.resetTitle': 'I-reset ang Piso sa Kamay',
        'transactions.currentCoins': 'Kasalukuyang Piso sa Kamay',
        'transactions.whatIsReset': 'Para Saan ang Reset?',
        'transactions.resetDesc': 'Gamitin ang reset function na ito kapag nakolekta mo na ang mga piso mula sa iyong device. Itatakda nito ang counter sa ₱0.00 at magsisimulang mag-track muli. Ang kasaysayan ng transaksyon ay mananatiling hindi nagbabago.',
        'transactions.cancel': 'Kanselahin',
        'transactions.resetTo': 'I-reset sa ₱0.00',

        // ── Rentals Page ──────────────────────────────────────────────────────
        'rentals.title': 'Aktibong Renta',
        'rentals.subtitle': 'Subaybayan ang lahat ng kasalukuyang renta ng locker.',
        'rentals.locker': 'LOCKER',
        'rentals.customer': 'CUSTOMER',
        'rentals.startTime': 'ORAS NG SIMULA',
        'rentals.startDate': 'PETSA NG SIMULA',
        'rentals.endDate': 'PETSA NG PAGTATAPOS',
        'rentals.duration': 'TAGAL',
        'rentals.cost': 'GASTOS',
        'rentals.amount': 'HALAGA',
        'rentals.status': 'KALAGAYAN',
        'rentals.actions': 'MGA AKSYON',
        'rentals.loading': 'Nilo-load ang mga renta...',
        'rentals.moreThan1hr': 'Higit sa 1 oras',
        'rentals.under1hr': 'Wala pang 1 oras',
        'rentals.under30min': 'Wala pang 30 minuto',
        'rentals.overtime': 'Overtime',
        'rentals.detailsTitle': 'Detalye ng Renta',
        'rentals.detailCustomer': 'Customer:',
        'rentals.detailLocker': 'Locker:',
        'rentals.detailStart': 'Petsa ng Simula:',
        'rentals.detailEnd': 'Petsa ng Pagtatapos:',
        'rentals.detailDuration': 'Tagal:',
        'rentals.detailType': 'Uri ng Renta:',
        'rentals.detailStatus': 'Kalagayan:',
        'rentals.detailOvertime': 'Overtime:',
        'rentals.detailFee': 'Karagdagang Bayad:',
        'rentals.detailAmount': 'Halaga:',
        
        // Rates Page (Tagalog)
        'rates.title': 'Mga Presyo ng Bayad',
        'rates.subtitle': 'I-configure ang hourly rates na ipapakita sa makina.',
        'rates.small': 'Maliit',
        'rates.medium': 'Katamtaman',
        'rates.large': 'Malaki',
        'rates.smallDesc': 'sapatos / maliit na bag',
        'rates.mediumDesc': 'helmet / backpack',
        'rates.largeDesc': 'blue jug / maleta',
        'rates.ratePerHour': 'Rate bawat oras (₱)',
        'rates.editRates': 'I-edit ang Rates',
        'rates.saveRates': 'I-save ang Rates',
        'rates.history': 'Kasaysayan ng Pagbabago ng Rate',
        'rates.historyDate': 'Petsa at Oras',
        'rates.historyChangedBy': 'Binago Ni',
        'rates.historySmall': 'Maliit (₱/oras)',
        'rates.historyMedium': 'Katamtaman (₱/oras)',
        'rates.historyLarge': 'Malaki (₱/oras)',
        'rates.historyChanges': 'Mga Pagbabago',
        'rates.clearHistory': 'Burahin ang Kasaysayan',
        'rates.noHistory': 'Walang naitala pang pagbabago sa rate.',
        'rates.historyDesc': 'Ang mga pagbabago ay lalabas dito pagkatapos mong i-save ang rates.',
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
        'profile.subtitle': 'Pamahalaan ang iyong mga setting ng account at kiosk credentials.',
        'profile.kioskCredentials': 'Kiosk Credentials',
        'profile.kioskDesc': 'Ginagamit ang mga credential na ito para mag-log in sa CoinCubby Kiosk. Dapat na eksaktong 6 digits ang bawat isa.',
        'profile.kioskAdminId': 'Kiosk Admin ID',
        'profile.kioskAdminPassword': 'Kiosk Admin Password',
        'profile.kioskHint': 'Dapat na eksaktong 6 digits (0-9).',
        'profile.saveKiosk': 'I-save ang Kiosk Credentials',
        'profile.security': 'Seguridad',
        'profile.securityDesc': 'Palitan ang password na ginagamit mo para mag-log in sa admin web application na ito.',
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


class LanguageManager {
    constructor() {
        this.STORAGE_KEY = 'coincubby_language';
        this.currentLang = this.getStoredLanguage();
        this.init();
    }

    init() {
        this.applyLanguage(this.currentLang);
        document.documentElement.lang = this.currentLang === 'tl' ? 'tl' : 'en';
    }

    getStoredLanguage() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return (saved === 'en' || saved === 'tl') ? saved : 'en';
        } catch (e) {
            return 'en';
        }
    }

    /**
     * Set language: updates localStorage, DOM, and optionally persists to DB.
     * @param {string} lang - 'en' or 'tl'
     * @param {boolean} [saveToDb=false] - whether to write to admin table
     */
    setLanguage(lang, saveToDb = false) {
        if (lang !== 'en' && lang !== 'tl') return;
        this.currentLang = lang;
        try { localStorage.setItem(this.STORAGE_KEY, lang); } catch (e) {}
        this.applyLanguage(lang);
        document.documentElement.lang = lang === 'tl' ? 'tl' : 'en';
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
        if (saveToDb) this._saveToDb(lang);
    }

    /** Persist language preference to the admin table in Supabase */
    async _saveToDb(lang) {
        try {
            if (typeof window.supabase === 'undefined' || typeof window.supabase.from !== 'function') return;
            const auth = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
            if (!auth.email) return;
            await window.supabase.from('admin').update({ language: lang }).eq('email', auth.email);
        } catch (e) {
            console.warn('Could not save language to DB:', e);
        }
    }

    /**
     * Load language preference from DB and apply it.
     * Falls back silently to localStorage value if DB unavailable.
     */
    async loadFromDb() {
        try {
            if (typeof window.supabase === 'undefined' || typeof window.supabase.from !== 'function') return;
            const auth = JSON.parse(localStorage.getItem('coincubby_auth') || '{}');
            if (!auth.email) return;
            const { data } = await window.supabase
                .from('admin').select('language').eq('email', auth.email).single();
            if (data && (data.language === 'en' || data.language === 'tl')) {
                if (data.language !== this.currentLang) {
                    this.setLanguage(data.language, false);
                }
            }
        } catch (e) {
            console.warn('Could not load language from DB:', e);
        }
    }

    applyLanguage(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.translate(key, lang);
            if (!text) return;
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = text;
            } else {
                el.textContent = text;
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const text = this.translate(key, lang);
            if (text && el.tagName === 'INPUT') el.placeholder = text;
        });
    }

    translate(key, lang) {
        const l = lang || this.currentLang;
        return (translations[l] && translations[l][key]) || (translations.en && translations.en[key]) || key;
    }

    getCurrentLanguage() { return this.currentLang; }
}

// Initialise immediately so every page gets translated on load
const languageManager = new LanguageManager();

// Convenience helper
function t(key) { return languageManager.translate(key); }

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LanguageManager, languageManager, t };
}
