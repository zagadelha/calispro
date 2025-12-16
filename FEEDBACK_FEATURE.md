# Feedback Feature

## Overview
A floating feedback button has been added to the application, allowing users to:
- Report bugs
- Ask questions
- Suggest improvements
- Contact support

## Implementation Details

### Components
- **FeedbackButton.jsx**: Main component with floating button and modal
  - Location: `src/components/FeedbackButton.jsx`
  - Features:
    - Floating button with pulse animation
    - Modal with 4 feedback types
    - Form validation
    - Success confirmation
    - Firebase Firestore integration

### Styling
- Added comprehensive CSS in `index.css`
- Matches app's premium dark theme
- Fully responsive design
- Smooth animations and transitions

### Database
- **Collection**: `feedback`
- **Schema**:
  ```javascript
  {
    user_id: string,
    user_email: string,
    user_name: string,
    type: string, // 'bug' | 'question' | 'suggestion' | 'contact'
    message: string,
    created_at: string (ISO),
    status: string // 'pending'
  }
  ```

### Firestore Rules
Updated `firestore.rules` to allow authenticated users to create feedback entries:
```javascript
match /feedback/{feedbackId} {
  allow create: if request.auth != null;
  allow read, update, delete: if false; // Only admins
}
```

## User Experience
1. Users see a floating button in the bottom-right corner
2. Button has a subtle pulse animation to draw attention
3. Clicking opens a modal with feedback type selection
4. User selects type (Bug, Question, Suggestion, or Contact)
5. User writes their message
6. Form submits to Firebase
7. Success confirmation is shown
8. Modal auto-closes after 2 seconds

## Future Enhancements
- Admin dashboard to view and manage feedback
- Email notifications when feedback is received
- In-app responses to user feedback
- Feedback status tracking (pending, in-progress, resolved)
