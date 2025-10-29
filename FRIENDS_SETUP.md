# Friends System Setup

## Database Setup

1. **Run the SQL script**: Execute the `friends-system.sql` file in your Supabase SQL editor to create the necessary tables and functions.

2. **Verify tables**: Make sure the following tables are created:
   - `friends` - stores accepted friendships
   - `friend_requests` - stores pending friend requests

## Features Added

### 🎯 **Friend Management**

- **Send friend requests** to any user in the app
- **Accept/decline** incoming friend requests
- **Remove friends** from your friends list
- **View all users** and discover new people

### 🔍 **User Discovery**

- **Search users** by name or email
- **Browse all users** in the app
- **See user profiles** with avatars and join dates

### 📱 **UI Components**

- **Friends button** in the main header
- **Tabbed interface** with three sections:
  - **Friends** - Your current friends list
  - **Requests** - Pending friend requests
  - **Discover** - Find and add new friends

### 🛡️ **Security Features**

- **Row Level Security (RLS)** policies protect user data
- **Bidirectional friendships** - both users must be friends
- **Prevent self-friending** and duplicate requests
- **Secure database functions** for friend operations

## How to Use

1. **Click the "Friends" button** in the header
2. **Discover users** in the "Discover" tab
3. **Send friend requests** by clicking "Add Friend"
4. **Manage requests** in the "Requests" tab
5. **View your friends** in the "Friends" tab

## Database Functions Available

- `accept_friend_request(request_id)` - Accept a friend request
- `decline_friend_request(request_id)` - Decline a friend request
- `are_friends(user1_id, user2_id)` - Check if two users are friends
- `get_user_friends(user_uuid)` - Get user's friends list
- `get_pending_friend_requests(user_uuid)` - Get pending requests
- `get_sent_friend_requests(user_uuid)` - Get sent requests

## Next Steps

The friends system is now fully functional! Users can:

- Send and receive friend requests
- Manage their friends list
- Discover new users
- Build their social network within the app

The system is ready for integration with memory sharing features and other social functionalities.
