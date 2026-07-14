# Customer Feedback - Quick Start Guide

## Setup (5 minutes)

### Step 1: Create the Database Table
1. Open your Supabase project
2. Go to the SQL Editor
3. Copy and paste the contents of `docs/CREATE_FEEDBACK_TABLE.sql`
4. Click "Run" to execute the script
5. Verify the table was created successfully

### Step 2: Test the Admin Interface
1. Open your admin panel
2. You should see a new "Feedback" menu item in the sidebar (with a chat bubble icon)
3. Click on "Feedback" to view the feedback management page
4. You should see statistics cards and an empty feedback table (if no feedback exists yet)

## How It Works

### For Customers (Mobile App/Customer Portal)
After completing a transaction, customers can submit feedback:
- Rate their experience (1-5 stars)
- Optionally add a text comment
- Submit once per transaction

### For Admins (Admin Panel)
View and analyze customer feedback:
- **Dashboard**: See total feedback, average rating, 5-star count, and low ratings
- **Table View**: Browse all feedback with customer info and ratings
- **Filters**: Filter by star rating to focus on specific experiences
- **Details Modal**: Click "View Details" to see complete feedback information

## Features

✅ Real-time statistics dashboard  
✅ Filter feedback by star rating  
✅ View complete customer and transaction details  
✅ Auto-refresh every 30 seconds  
✅ Responsive design  
✅ Dark mode support  
✅ One feedback per transaction (enforced)  

## Database Structure

```
feedback
├── feedback_id (UUID, Primary Key)
├── transaction_id (UUID, Unique, Foreign Key → transactions)
├── customer_id (UUID, Foreign Key → customers)
├── rating (1-5 stars, Required)
├── comment (Text, Optional)
└── created_at (Timestamp, Auto-generated)
```

## Example: Adding Feedback via Code

### From Customer App/Portal:
```javascript
// After transaction completion
const { data, error } = await supabaseClient
    .from('feedback')
    .insert({
        transaction_id: completedTransactionId,
        customer_id: currentCustomerId,
        rating: 5, // 1-5
        comment: 'Great service!'
    });

if (error) {
    console.error('Error submitting feedback:', error);
} else {
    console.log('Feedback submitted successfully!');
}
```

### Check if Feedback Already Exists:
```javascript
const { data, error } = await supabaseClient
    .from('feedback')
    .select('feedback_id')
    .eq('transaction_id', transactionId)
    .single();

if (data) {
    // Feedback already exists for this transaction
    console.log('You have already submitted feedback for this transaction');
} else {
    // Show feedback form
}
```

## Quick Navigation

- **Documentation**: `docs/FEEDBACK_FEATURE.md` - Complete documentation
- **SQL Setup**: `docs/CREATE_FEEDBACK_TABLE.sql` - Database setup script
- **Admin Page**: `pages/feedback.html` - Admin interface
- **JavaScript**: `js/feedback.js` - Frontend logic

## Troubleshooting

### Issue: Feedback page shows "Database not connected"
**Solution**: 
1. Check your Supabase credentials in `js/supabase-client.js`
2. Verify your internet connection
3. Check browser console for connection errors

### Issue: Feedback table is empty
**Solution**: 
1. Verify customers have submitted feedback
2. Check that the feedback table exists in your database
3. Try manually inserting test data (see CREATE_FEEDBACK_TABLE.sql)

### Issue: "View Details" button doesn't work
**Solution**: 
1. Check browser console for JavaScript errors
2. Verify feedback.js is loaded correctly
3. Clear browser cache and reload

## Statistics Explained

- **Total Feedback**: Count of all feedback entries in the database
- **Average Rating**: Mean rating across all feedback (1.0 - 5.0)
- **5-Star Reviews**: Count of excellent ratings - indicates very satisfied customers
- **Low Ratings**: Count of 1-2 star ratings - needs immediate attention

## Best Practices

1. **Monitor Regularly**: Check feedback at least daily to identify issues quickly
2. **Respond to Low Ratings**: Follow up with customers who left 1-2 star ratings
3. **Track Trends**: Use average rating to measure improvement over time
4. **Read Comments**: Star ratings tell you "what" but comments tell you "why"
5. **Celebrate Wins**: Share 5-star reviews with your team for motivation

## Next Steps

1. ✅ Create the feedback table in Supabase
2. ✅ Test the admin interface
3. 📱 Add feedback submission to your customer app
4. 📊 Monitor feedback regularly
5. 📈 Use insights to improve service quality

## Support

If you encounter any issues:
1. Check the main documentation in `docs/FEEDBACK_FEATURE.md`
2. Review the SQL setup script for any errors
3. Check browser console for JavaScript errors
4. Verify Supabase connection and permissions

---

**Quick Test**: To quickly test the feature, manually insert a feedback entry using the sample data in `CREATE_FEEDBACK_TABLE.sql`, then view it in the admin panel.
