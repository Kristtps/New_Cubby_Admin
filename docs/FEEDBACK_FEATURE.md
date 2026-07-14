# Customer Feedback Feature

## Overview
The Customer Feedback system allows administrators to view and manage customer ratings and reviews for completed transactions. This feature helps you understand customer satisfaction and identify areas for improvement.

## Database Table
The feedback system uses the `public.feedback` table with the following structure:

```sql
CREATE TABLE public.feedback (
    feedback_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    transaction_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT feedback_pkey PRIMARY KEY (feedback_id),
    CONSTRAINT feedback_transaction_id_key UNIQUE (transaction_id),
    CONSTRAINT fk_feedback_customer FOREIGN KEY (customer_id) 
        REFERENCES customers (customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_transaction FOREIGN KEY (transaction_id) 
        REFERENCES transactions (transaction_id) ON DELETE CASCADE
);
```

### Key Features:
- **One feedback per transaction**: Each transaction can only have one feedback entry (enforced by unique constraint)
- **Star rating**: 1-5 star rating system
- **Optional comments**: Customers can provide additional text feedback
- **Automatic timestamps**: Created at timestamp is automatically set
- **Cascade deletion**: Feedback is automatically deleted if customer or transaction is removed

## Admin UI Features

### Feedback Page (`pages/feedback.html`)
The feedback page provides a comprehensive view of all customer feedback with the following features:

#### Statistics Dashboard
- **Total Feedback**: Count of all feedback entries
- **Average Rating**: Overall average rating across all feedback
- **5-Star Reviews**: Count of excellent ratings
- **Low Ratings**: Count of 1-2 star ratings for quick issue identification

#### Feedback Table
Displays all feedback with:
- Customer name and email
- Transaction ID and amount
- Star rating (visual display)
- Truncated comment preview
- Submission date
- "View Details" action button

#### Filters
- **Rating Filter**: Filter feedback by star rating (1-5 stars or all)

#### Modal Details View
Clicking "View Details" shows complete information:
- Full customer information (name, email, phone)
- Complete transaction details (ID, amount, date)
- Full star rating
- Complete comment text

### Navigation
A "Feedback" menu item has been added to the sidebar of all admin pages with a chat bubble icon.

## JavaScript Module (`js/feedback.js`)

### Key Functions:

#### `loadFeedback()`
Loads all feedback from the database with related customer and transaction data:
```javascript
await loadFeedback();
```

#### `renderFeedback()`
Renders the feedback table based on current filter settings.

#### `showFeedbackDetails(feedbackId)`
Opens a modal with complete feedback details:
```javascript
await showFeedbackDetails('uuid-here');
```

#### `updateStats()`
Calculates and updates all statistics in the dashboard.

### Auto-Refresh
Feedback data automatically refreshes every 30 seconds to show the latest submissions.

## Usage

### For Administrators:

1. **View All Feedback**
   - Navigate to the Feedback page from the sidebar
   - View statistics at the top
   - Browse all feedback in the table

2. **Filter Feedback**
   - Use the rating filter dropdown to view specific star ratings
   - Filter helps focus on excellent or poor experiences

3. **View Details**
   - Click "View Details" button for any feedback
   - See complete customer info and full comments
   - Review transaction details

### For Developers:

#### Adding Feedback (Mobile App/Customer Portal)
When a customer completes a transaction, allow them to submit feedback:

```javascript
const { data, error } = await supabaseClient
    .from('feedback')
    .insert({
        transaction_id: 'transaction-uuid',
        customer_id: 'customer-uuid',
        rating: 5, // 1-5
        comment: 'Great service!' // Optional
    });
```

#### Querying Feedback
```javascript
// Get feedback for a specific transaction
const { data } = await supabaseClient
    .from('feedback')
    .select('*, customers(*), transactions(*)')
    .eq('transaction_id', transactionId)
    .single();

// Get all feedback with related data
const { data } = await supabaseClient
    .from('feedback')
    .select('*, customers(*), transactions(*)')
    .order('created_at', { ascending: false });
```

## Integration Points

### Existing Pages Updated
All admin pages now include the Feedback navigation item:
- index.html (Overview)
- lockers.html
- customers.html
- transactions.html
- rentals.html
- rates.html
- reports.html
- auditlog.html
- profile.html

### Database Dependencies
The feedback system depends on:
- `customers` table (customer_id reference)
- `transactions` table (transaction_id reference)

Ensure these tables exist before creating the feedback table.

## Best Practices

1. **Respond to Low Ratings**: Monitor the "Low Ratings" stat and review those feedback entries regularly
2. **Track Trends**: Use the average rating to track overall customer satisfaction over time
3. **Read Comments**: Don't just rely on star ratings - read customer comments for detailed insights
4. **Follow Up**: Use the customer contact info to follow up on negative feedback

## Future Enhancements

Potential improvements:
- Email notifications for low ratings
- Trend analysis charts
- Response system for admins to reply to feedback
- Export feedback data to CSV
- Filter by date range
- Search feedback by customer name or keyword

## Troubleshooting

### Feedback Not Showing
1. Check database connection (Supabase must be connected)
2. Verify the feedback table exists in your database
3. Check browser console for error messages

### Auto-Refresh Not Working
- The page uses a 30-second interval
- Check that `loadFeedback()` is not throwing errors in console
- Verify Supabase connection is stable

### Modal Not Opening
- Ensure feedback.js is properly loaded
- Check that the feedback_id exists in the allFeedback array
- Verify no JavaScript errors in console
