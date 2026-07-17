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
        'nav.auditlog': 'Audit Log',
        'nav.notifications': 'Notifications',
        'sidebar.adminPanel': 'Admin Panel',

        // ── Overview Page ─────────────────────────────────────────────────────
        'overview.title': 'Admin Overview',
        'overview.subtitle': 'Real-time status of your CoinCubby network.',
        'overview.last7days': 'Last 7 Days',
        'overview.last14days': 'Last 14 Days',
        'overview.last30days': 'Last 30 Days',
        'overview.thisMonth': 'This Month',
        'overview.customRange': 'Custom Range',
        'overview.from': 'From',
        'overview.to': 'To',
        'overview.recentRentals': 'Recent Rentals',
        'overview.noRecentRentals': 'No recent rentals.',
        'overview.loading': 'Loading modules and lockers...',
        'stat.totalLockers': 'TOTAL LOCKERS',
        'stat.activeRentals': 'ACTIVE RENTALS',
        'stat.customers': 'CUSTOMERS',
        'stat.totalRevenue': 'TOTAL REVENUE',
        'chart.sales': 'Sales — Last 7 Days',
        'chart.dailyRevenue': 'Daily revenue in PHP',

        // ── Status Legend ─────────────────────────────────────────────────────
        'status.available': 'Available',
        'status.occupied': 'Occupied',
        'status.payment': 'Payment Required',
        'status.maintenance': 'Maintenance',

        // ── Lockers Page ──────────────────────────────────────────────────────
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
        'lockers.addNew': 'Add New Module',
        'lockers.moduleName': 'Module Name',
        'lockers.moduleNamePlaceholder': 'e.g., M1, M2, Module A...',
        'lockers.moduleNameHint': 'This will be displayed as the module identifier',
        'lockers.moduleId': 'Module ID',
        'lockers.moduleIdPlaceholder': 'Auto-generated 16-char ID',
        'lockers.moduleIdHint': 'Unique 16-character identifier (editable).',
        'lockers.regenerate': 'Regenerate',
        'lockers.lockerConfig': 'Locker Configuration',
        'lockers.smallCompartments': 'Small Compartments',
        'lockers.smallHint': 'Perfect for phones, keys, wallets',
        'lockers.mediumCompartments': 'Medium Compartments',
        'lockers.mediumHint': 'Ideal for bags, laptops, tablets',
        'lockers.largeCompartments': 'Large Compartments',
        'lockers.largeHint': 'Great for luggage, backpacks, large items',
        'lockers.summary': 'Summary:',
        'lockers.totalCompartments': 'Total Compartments:',
        'lockers.createModule': 'Create Module',
        'lockers.addLocker': 'Add Locker',
        'lockers.lockerCode': 'Locker Code',
        'lockers.lockerCodePlaceholder': 'L1, M2, S3...',
        'lockers.lockerSize': 'Size',
        'lockers.selectSize': 'Select Size',
        'lockers.small': 'Small',
        'lockers.medium': 'Medium',
        'lockers.large': 'Large',
        'lockers.selectModule': 'Select Module',
        'lockers.deviceId': 'Device ID',
        'lockers.deleteModuleTitle': 'Delete Module',
        'lockers.selectModuleDelete': 'Select Module to Delete',
        'lockers.deleteWarning': '⚠️ Warning: This will delete the entire module and all its lockers. This action cannot be undone.',
        'lockers.rentalDetails': 'Rental Details',
        'lockers.lockerInfo': 'Locker Information',
        'lockers.lockerNumber': 'Locker Number:',
        'lockers.renterInfo': 'Renter Information',
        'lockers.customerName': 'Customer Name:',
        'lockers.email': 'Email:',
        'lockers.phone': 'Phone:',
        'lockers.rentalDetailsSection': 'Rental Details',
        'lockers.startTime': 'Start Time:',
        'lockers.duration': 'Duration:',
        'lockers.rentalType': 'Rental Type:',
        'lockers.overtime': 'Overtime:',
        'lockers.additionalCharge': 'Additional Charge:',
        'lockers.amountPaid': 'Amount Paid:',

        // ── Customers Page ────────────────────────────────────────────────────
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

        // ── Transactions Page ─────────────────────────────────────────────────
        'transactions.title': 'Transactions',
        'transactions.subtitle': 'Payments, wallet loads, and cash collection.',
        'transactions.search': 'Search by customer, locker, or type...',
        'transactions.allTransactions': 'All Transactions',
        'transactions.payment': 'Payment',
        'transactions.walletLoad': 'Wallet Load',
        'transactions.cashCollection': 'Cash Collection',
        'transactions.todayTotal': "TODAY'S TOTAL",
        'transactions.coinsOnHand': 'COINS ON HAND',
        'transactions.allCount': 'ALL TRANSACTIONS',
        'transactions.sectionTitle': 'All Transactions',
        'transactions.date': 'Date',
        'transactions.customer': 'Customer',
        'transactions.userId': 'User ID',
        'transactions.type': 'Type',
        'transactions.method': 'Method',
        'transactions.locker': 'Locker',
        'transactions.amount': 'Amount',
        'transactions.loading': 'Loading transactions...',
        'transactions.resetTitle': 'Reset Coins on Hand',
        'transactions.currentCoins': 'Current Coins on Hand',
        'transactions.whatIsReset': 'What is Reset For?',
        'transactions.resetDesc': 'Use this reset function when you have physically collected the coins from your device. This will set the counter to ₱0.00 and start tracking from zero again. Your transaction history will remain unchanged.',
        'transactions.cancel': 'Cancel',
        'transactions.resetTo': 'Reset to ₱0.00',

        // ── Rentals Page ──────────────────────────────────────────────────────
        'rentals.title': 'Active Rentals',
        'rentals.subtitle': 'Monitor all ongoing locker rentals.',
        'rentals.search': 'Search by customer, locker, or ID...',
        'rentals.locker': 'Locker',
        'rentals.customer': 'Customer',
        'rentals.startTime': 'Start Time',
        'rentals.startDate': 'Start Date',
        'rentals.endDate': 'End Date',
        'rentals.duration': 'Duration',
        'rentals.cost': 'Cost',
        'rentals.status': 'Status',
        'rentals.actions': 'Actions',
        'rentals.amount': 'Amount',
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

        // ── Rates Page ────────────────────────────────────────────────────────
        'rates.title': 'Payment Rates',
        'rates.subtitle': 'Configure hourly rates displayed on the machine.',
        'rates.small': 'Small',
        'rates.smallDesc': 'shoes / small pack',
        'rates.medium': 'Medium',
        'rates.mediumDesc': 'helmet / backpack',
        'rates.large': 'Large',
        'rates.largeDesc': 'blue jug / luggage',
        'rates.ratePerHour': 'Rate per hour (₱)',
        'rates.editRates': 'Edit Rates',
        'rates.saveRates': 'Save Rates',
        'rates.history': 'Rate Change History',
        'rates.records': 'records',
        'rates.clearHistory': 'Clear History',
        'rates.historyNum': '#',
        'rates.historyDate': 'Date & Time',
        'rates.historyBy': 'Changed By',
        'rates.historySmall': 'Small (₱/hr)',
        'rates.historyMedium': 'Medium (₱/hr)',
        'rates.historyLarge': 'Large (₱/hr)',
        'rates.historyChanges': 'Changes',
        'rates.noHistory': 'No rate changes recorded yet.',
        'rates.noHistoryHint': 'Changes will appear here after you save rates.',
        // ── Reports Page ──────────────────────────────────────────────────────
        'reports.title': 'Reports',
        'reports.subtitle': 'Graphical overview of your CoinCubby operations.',
        'reports.last7days': 'Last 7 Days',
        'reports.last14days': 'Last 14 Days',
        'reports.last30days': 'Last 30 Days',
        'reports.thisMonth': 'This Month',
        'reports.customRange': 'Custom Range',
        'reports.from': 'From',
        'reports.to': 'To',
        'reports.print': 'Print',
        'reports.export': 'Export',
        'reports.totalRevenue': 'TOTAL REVENUE',
        'reports.totalRentals': 'TOTAL RENTALS',
        'reports.mostUsedLocker': 'MOST USED LOCKER',
        'reports.mostUsedPayment': 'MOST USED PAYMENT',
        'reports.revenueChart': 'Revenue & Rentals — 14 Days',
        'reports.rentalsBySize': 'Rentals by Size',

        // ── Feedback Page ─────────────────────────────────────────────────────
        'feedback.title': 'Customer Feedback',
        'feedback.subtitle': 'View and manage customer ratings and reviews.',
        'feedback.allRatings': 'All Ratings',
        'feedback.totalFeedback': 'TOTAL FEEDBACK',
        'feedback.avgRating': 'AVERAGE RATING',
        'feedback.fiveStar': '5-STAR REVIEWS',
        'feedback.lowRatings': 'LOW RATINGS',
        'feedback.customer': 'Customer',
        'feedback.rating': 'Rating',
        'feedback.comment': 'Comment',
        'feedback.date': 'Date',
        'feedback.actions': 'Actions',
        'feedback.loading': 'Loading feedback...',
        'feedback.detailsTitle': 'Feedback Details',
        'feedback.customerInfo': 'Customer Information',
        'feedback.name': 'Name:',
        'feedback.email': 'Email:',
        'feedback.phone': 'Phone:',
        'feedback.feedbackSection': 'Feedback',
        'feedback.ratingLabel': 'Rating:',
        'feedback.submitted': 'Submitted:',
        'feedback.commentLabel': 'Comment:',

        // ── Notifications Page ────────────────────────────────────────────────
        'notifications.title': 'Notifications',
        'notifications.subtitle': 'Stay updated with system events and activities.',
        'notifications.markAllRead': 'Mark All Read',
        'notifications.clearRead': 'Clear Read',
        'notifications.loading': 'Loading notifications...',

        // ── Audit Log Page ────────────────────────────────────────────────────
        'auditlog.title': 'Audit Log',
        'auditlog.subtitle': 'Every action, tracked in real time.',
        'auditlog.search': 'Search by action, description, or user...',

        // ── Profile Page ──────────────────────────────────────────────────────
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
        'profile.accountCreated': 'Account Created',
        'profile.lastLogin': 'Last Login',
        'profile.fullName': 'Full Name',
        'profile.emailAddress': 'Email Address',

        // ── Shared / Buttons ──────────────────────────────────────────────────
        'btn.add': 'Add',
        'btn.edit': 'Edit',
        'btn.delete': 'Delete',
        'btn.save': 'Save',
        'btn.cancel': 'Cancel',
        'btn.confirm': 'Confirm',
        'btn.close': 'Close',

        // ── Days of week ──────────────────────────────────────────────────────
        'day.mon': 'Mon', 'day.tue': 'Tue', 'day.wed': 'Wed',
        'day.thu': 'Thu', 'day.fri': 'Fri', 'day.sat': 'Sat', 'day.sun': 'Sun',
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
        'nav.auditlog': 'Talaan ng Audit',
        'nav.notifications': 'Mga Abiso',
        'sidebar.adminPanel': 'Admin Panel',

        // ── Overview Page ─────────────────────────────────────────────────────
        'overview.title': 'Pangkalahatang-Tanaw ng Admin',
        'overview.subtitle': 'Real-time na kalagayan ng iyong CoinCubby network.',
        'overview.last7days': 'Nakaraang 7 Araw',
        'overview.last14days': 'Nakaraang 14 na Araw',
        'overview.last30days': 'Nakaraang 30 Araw',
        'overview.thisMonth': 'Ngayong Buwan',
        'overview.customRange': 'Pasadyang Saklaw',
        'overview.from': 'Mula',
        'overview.to': 'Hanggang',
        'overview.recentRentals': 'Kamakailang Renta',
        'overview.noRecentRentals': 'Walang kamakailang renta.',
        'overview.loading': 'Nilo-load ang mga module at locker...',
        'stat.totalLockers': 'KABUUANG LOCKER',
        'stat.activeRentals': 'AKTIBONG RENTA',
        'stat.customers': 'MGA CUSTOMER',
        'stat.totalRevenue': 'KABUUANG KITA',
        'chart.sales': 'Benta — Nakaraang 7 Araw',
        'chart.dailyRevenue': 'Araw-araw na kita sa PHP',

        // ── Status Legend ─────────────────────────────────────────────────────
        'status.available': 'Magagamit',
        'status.occupied': 'May Laman',
        'status.payment': 'Kailangan Magbayad',
        'status.maintenance': 'Kinakaayos',

        // ── Lockers Page ──────────────────────────────────────────────────────
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
        'lockers.addNew': 'Magdagdag ng Bagong Module',
        'lockers.moduleName': 'Pangalan ng Module',
        'lockers.moduleNamePlaceholder': 'hal., M1, M2, Module A...',
        'lockers.moduleNameHint': 'Ito ang ipapakita bilang identifier ng module',
        'lockers.moduleId': 'Module ID',
        'lockers.moduleIdPlaceholder': 'Awtomatikong-generated na 16-char ID',
        'lockers.moduleIdHint': 'Natatanging 16-character identifier (maaaring baguhin).',
        'lockers.regenerate': 'Mag-regenerate',
        'lockers.lockerConfig': 'Konfigurasyon ng Locker',
        'lockers.smallCompartments': 'Maliliit na Compartment',
        'lockers.smallHint': 'Para sa telepono, susi, pitaka',
        'lockers.mediumCompartments': 'Katamtamang Compartment',
        'lockers.mediumHint': 'Para sa bag, laptop, tablet',
        'lockers.largeCompartments': 'Malalaking Compartment',
        'lockers.largeHint': 'Para sa maleta, backpack, malalaking bagay',
        'lockers.summary': 'Buod:',
        'lockers.totalCompartments': 'Kabuuang Compartment:',
        'lockers.createModule': 'Gumawa ng Module',
        'lockers.addLocker': 'Magdagdag ng Locker',
        'lockers.lockerCode': 'Code ng Locker',
        'lockers.lockerCodePlaceholder': 'L1, M2, S3...',
        'lockers.lockerSize': 'Laki',
        'lockers.selectSize': 'Pumili ng Laki',
        'lockers.small': 'Maliit',
        'lockers.medium': 'Katamtaman',
        'lockers.large': 'Malaki',
        'lockers.selectModule': 'Pumili ng Module',
        'lockers.deviceId': 'Device ID',
        'lockers.deleteModuleTitle': 'Tanggalin ang Module',
        'lockers.selectModuleDelete': 'Piliin ang Module na Tatanggalin',
        'lockers.deleteWarning': '⚠️ Babala: Matatanggal ang buong module at lahat ng locker nito. Hindi na ito maibabalik.',
        'lockers.rentalDetails': 'Detalye ng Renta',
        'lockers.lockerInfo': 'Impormasyon ng Locker',
        'lockers.lockerNumber': 'Numero ng Locker:',
        'lockers.renterInfo': 'Impormasyon ng Nangungupahan',
        'lockers.customerName': 'Pangalan ng Customer:',
        'lockers.email': 'Email:',
        'lockers.phone': 'Telepono:',
        'lockers.rentalDetailsSection': 'Detalye ng Renta',
        'lockers.startTime': 'Oras ng Simula:',
        'lockers.duration': 'Tagal:',
        'lockers.rentalType': 'Uri ng Renta:',
        'lockers.overtime': 'Overtime:',
        'lockers.additionalCharge': 'Karagdagang Bayad:',
        'lockers.amountPaid': 'Halagang Binayad:',

        // ── Customers Page ────────────────────────────────────────────────────
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

        // ── Transactions Page ─────────────────────────────────────────────────
        'transactions.title': 'Mga Transaksyon',
        'transactions.subtitle': 'Mga bayad, wallet load, at koleksyon ng piso.',
        'transactions.search': 'Maghanap gamit ang customer, locker, o uri...',
        'transactions.allTransactions': 'Lahat ng Transaksyon',
        'transactions.payment': 'Bayad',
        'transactions.walletLoad': 'Wallet Load',
        'transactions.cashCollection': 'Koleksyon ng Pera',
        'transactions.todayTotal': 'KABUUAN NGAYON',
        'transactions.coinsOnHand': 'PISO SA KAMAY',
        'transactions.allCount': 'LAHAT NG TRANSAKSYON',
        'transactions.sectionTitle': 'Lahat ng Transaksyon',
        'transactions.date': 'Petsa',
        'transactions.customer': 'Customer',
        'transactions.userId': 'User ID',
        'transactions.type': 'Uri',
        'transactions.method': 'Paraan',
        'transactions.locker': 'Locker',
        'transactions.amount': 'Halaga',
        'transactions.loading': 'Nilo-load ang mga transaksyon...',
        'transactions.resetTitle': 'I-reset ang Piso sa Kamay',
        'transactions.currentCoins': 'Kasalukuyang Piso sa Kamay',
        'transactions.whatIsReset': 'Para Saan ang Reset?',
        'transactions.resetDesc': 'Gamitin ang reset function na ito kapag nakolekta mo na ang mga piso mula sa iyong device. Itatakda nito ang counter sa ₱0.00 at magsisimulang mag-track muli. Ang kasaysayan ng transaksyon ay mananatiling hindi nagbabago.',
        'transactions.cancel': 'Kanselahin',
        'transactions.resetTo': 'I-reset sa ₱0.00',

        // ── Rentals Page ──────────────────────────────────────────────────────
        'rentals.title': 'Aktibong Renta',
        'rentals.subtitle': 'Subaybayan ang lahat ng kasalukuyang renta ng locker.',
        'rentals.search': 'Maghanap gamit ang customer, locker, o ID...',
        'rentals.locker': 'Locker',
        'rentals.customer': 'Customer',
        'rentals.startTime': 'Oras ng Simula',
        'rentals.startDate': 'Petsa ng Simula',
        'rentals.endDate': 'Petsa ng Pagtatapos',
        'rentals.duration': 'Tagal',
        'rentals.cost': 'Gastos',
        'rentals.status': 'Kalagayan',
        'rentals.actions': 'Mga Aksyon',
        'rentals.amount': 'Halaga',
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

        // ── Rates Page ────────────────────────────────────────────────────────
        'rates.title': 'Mga Presyo ng Bayad',
        'rates.subtitle': 'I-configure ang oras-oras na presyo na ipinapakita sa makina.',
        'rates.small': 'Maliit',
        'rates.smallDesc': 'sapatos / maliit na bag',
        'rates.medium': 'Katamtaman',
        'rates.mediumDesc': 'helmet / backpack',
        'rates.large': 'Malaki',
        'rates.largeDesc': 'blue jug / maleta',
        'rates.ratePerHour': 'Presyo bawat oras (₱)',
        'rates.editRates': 'I-edit ang Presyo',
        'rates.saveRates': 'I-save ang Presyo',
        'rates.history': 'Kasaysayan ng Pagbabago ng Presyo',
        'rates.records': 'rekord',
        'rates.clearHistory': 'Linisin ang Kasaysayan',
        'rates.historyNum': '#',
        'rates.historyDate': 'Petsa at Oras',
        'rates.historyBy': 'Binago Ni',
        'rates.historySmall': 'Maliit (₱/hr)',
        'rates.historyMedium': 'Katamtaman (₱/hr)',
        'rates.historyLarge': 'Malaki (₱/hr)',
        'rates.historyChanges': 'Mga Pagbabago',
        'rates.noHistory': 'Wala pang naitala na pagbabago ng presyo.',
        'rates.noHistoryHint': 'Lilitaw ang mga pagbabago dito pagkatapos mag-save ng presyo.',

        // ── Reports Page ──────────────────────────────────────────────────────
        'reports.title': 'Mga Ulat',
        'reports.subtitle': 'Grapikong pangkalahatang-tanaw ng iyong mga operasyon sa CoinCubby.',
        'reports.last7days': 'Nakaraang 7 Araw',
        'reports.last14days': 'Nakaraang 14 na Araw',
        'reports.last30days': 'Nakaraang 30 Araw',
        'reports.thisMonth': 'Ngayong Buwan',
        'reports.customRange': 'Pasadyang Saklaw',
        'reports.from': 'Mula',
        'reports.to': 'Hanggang',
        'reports.print': 'I-print',
        'reports.export': 'I-export',
        'reports.totalRevenue': 'KABUUANG KITA',
        'reports.totalRentals': 'KABUUANG RENTA',
        'reports.mostUsedLocker': 'PINAKA-GAMIT NA LOCKER',
        'reports.mostUsedPayment': 'PINAKA-GAMIT NA BAYAD',
        'reports.revenueChart': 'Kita at Renta — 14 Araw',
        'reports.rentalsBySize': 'Renta ayon sa Laki',

        // ── Feedback Page ─────────────────────────────────────────────────────
        'feedback.title': 'Feedback ng Customer',
        'feedback.subtitle': 'Tingnan at pamahalaan ang mga rating at review ng customer.',
        'feedback.allRatings': 'Lahat ng Rating',
        'feedback.totalFeedback': 'KABUUANG FEEDBACK',
        'feedback.avgRating': 'AVERAGE NA RATING',
        'feedback.fiveStar': '5-BITUIN NA REVIEW',
        'feedback.lowRatings': 'MABABANG RATING',
        'feedback.customer': 'Customer',
        'feedback.rating': 'Rating',
        'feedback.comment': 'Komento',
        'feedback.date': 'Petsa',
        'feedback.actions': 'Mga Aksyon',
        'feedback.loading': 'Nilo-load ang feedback...',
        'feedback.detailsTitle': 'Detalye ng Feedback',
        'feedback.customerInfo': 'Impormasyon ng Customer',
        'feedback.name': 'Pangalan:',
        'feedback.email': 'Email:',
        'feedback.phone': 'Telepono:',
        'feedback.feedbackSection': 'Feedback',
        'feedback.ratingLabel': 'Rating:',
        'feedback.submitted': 'Isinumite:',
        'feedback.commentLabel': 'Komento:',

        // ── Notifications Page ────────────────────────────────────────────────
        'notifications.title': 'Mga Abiso',
        'notifications.subtitle': 'Manatiling updated sa mga kaganapan at aktibidad ng system.',
        'notifications.markAllRead': 'Markahan Lahat na Nabasa',
        'notifications.clearRead': 'Alisin ang Nabasa',
        'notifications.loading': 'Nilo-load ang mga abiso...',

        // ── Audit Log Page ────────────────────────────────────────────────────
        'auditlog.title': 'Talaan ng Audit',
        'auditlog.subtitle': 'Bawat aksyon, sinusubaybayan sa real time.',
        'auditlog.search': 'Maghanap gamit ang aksyon, paglalarawan, o user...',

        // ── Profile Page ──────────────────────────────────────────────────────
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
        'profile.accountCreated': 'Petsa ng Paglikha',
        'profile.lastLogin': 'Huling Pag-login',
        'profile.fullName': 'Buong Pangalan',
        'profile.emailAddress': 'Email Address',

        // ── Shared / Buttons ──────────────────────────────────────────────────
        'btn.add': 'Magdagdag',
        'btn.edit': 'I-edit',
        'btn.delete': 'Tanggalin',
        'btn.save': 'I-save',
        'btn.cancel': 'Kanselahin',
        'btn.confirm': 'Kumpirmahin',
        'btn.close': 'Isara',

        // ── Days of week ──────────────────────────────────────────────────────
        'day.mon': 'Lun', 'day.tue': 'Mar', 'day.wed': 'Miy',
        'day.thu': 'Huw', 'day.fri': 'Biy', 'day.sat': 'Sab', 'day.sun': 'Lin',
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
