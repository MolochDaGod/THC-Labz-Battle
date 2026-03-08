# THC CLASH - Deployment Authentication System

## Overview
THC CLASH implements a secure wallet-based authentication system designed for Web3 deployment. The system restricts admin access to authorized wallets while providing seamless user login through Solana wallet integration.

## Authentication Features

### User Authentication
- **Wallet-Based Login**: Users authenticate through Solana wallets (Phantom, Solflare, Backpack, Magic Eden, Coinbase)
- **Auto-Connect**: Automatic reconnection for trusted wallet connections
- **Multi-Wallet Support**: Comprehensive detection and support for popular Solana wallets
- **Error Handling**: Clear error messages and wallet installation guidance
- **Secure Session**: No passwords required, cryptographic wallet signature verification

### Admin Access Control
- **Database-Driven**: Admin permissions stored in PostgreSQL `admin_users` table
- **Real-Time Verification**: Admin status checked on every wallet connection
- **Permission Levels**: Support for different admin permission levels
- **Restricted UI**: Admin tab only visible to verified admin wallets

## Current Admin Wallets

### Production Admin Wallets
```
98jzgFFkPhrw9sfr5YyttTpCBiJyid6tzxxJjXrj7xXK - Super Admin (Full Access)
CLbdnF3UmE8nJPPTR8ZiPPJmYSEVm17nySNNHYUD5B2c - Admin (Standard Access)
```

## Deployment Security

### Authentication Flow
1. **User Connection**: User connects Solana wallet through WalletLoginGuard
2. **Address Verification**: Wallet public key extracted and verified
3. **Admin Check**: Backend queries `admin_users` table for admin status
4. **UI Authorization**: Admin tab conditionally rendered based on permissions
5. **Session Management**: Connection state persisted in component state

### Security Measures
- **No Admin Bypasses**: Admin access impossible without database entry
- **Wallet Verification**: Cryptographic verification of wallet ownership
- **Database Security**: Admin permissions stored server-side only
- **Error Isolation**: Failed authentication doesn't expose system details

## Database Schema

### Admin Users Table
```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT '{admin}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Current Entries
```sql
INSERT INTO admin_users (wallet_address, permissions) VALUES
('98jzgFFkPhrw9sfr5YyttTpCBiJyid6tzxxJjXrj7xXK', '{admin,super_admin}'),
('CLbdnF3UmE8nJPPTR8ZiPPJmYSEVm17nySNNHYUD5B2c', '{admin}');
```

## API Endpoints

### Admin Verification
```
GET /api/admin/check/:walletAddress
Response: { success: boolean, isAdmin: boolean, permissions: string[] }
```

### Wallet Balance
```
GET /api/wallet/:walletAddress
Response: { success: boolean, balances: { sol, budz, gbux, thcLabz } }
```

## Component Architecture

### WalletLoginGuard
- Primary authentication gateway
- Wallet detection and connection
- Error handling and user guidance
- Auto-connect for trusted sessions

### THCClashTabsSimple
- Main game interface
- Admin status verification
- Conditional admin tab rendering
- Real-time admin permission checking

### AdminPanel
- Restricted to verified admin wallets only
- Card management and game configuration
- Database operations with admin verification

## Production Deployment Checklist

### Pre-Deployment
- [x] Wallet authentication system implemented
- [x] Admin access control configured
- [x] Database admin entries verified
- [x] Error handling and user guidance complete
- [x] Multi-wallet support tested

### Security Verification
- [x] Admin access restricted to database entries only
- [x] No hardcoded admin wallets in frontend
- [x] Proper error handling for failed authentication
- [x] Wallet connection security verified

### User Experience
- [x] Clear wallet installation guidance
- [x] Smooth authentication flow
- [x] Proper loading states and error messages
- [x] Multi-device wallet support

## Adding New Admin Users

### Database Method (Recommended)
```sql
INSERT INTO admin_users (wallet_address, permissions) 
VALUES ('NEW_WALLET_ADDRESS', '{admin}');
```

### Via Admin Panel
Admin users with `super_admin` permissions can add new admins through the admin interface.

## Environment Considerations

### Development
- Admin checking enabled
- Full admin panel access for development wallets
- Local database with test admin entries

### Production
- Strict admin verification
- Limited admin wallet list
- Secure database connection
- Production admin wallets only

## Support & Maintenance

### Adding Admins
1. Verify wallet address accuracy
2. Insert into `admin_users` table with appropriate permissions
3. User must reconnect wallet to see admin access

### Removing Admins
1. Delete entry from `admin_users` table
2. Admin access revoked immediately on next connection

### Troubleshooting
- Verify wallet address format (Solana base58 encoding)
- Check database connectivity
- Confirm admin table entries
- Test wallet connection flow

## Security Best Practices

1. **Never hardcode admin wallets** in frontend code
2. **Always verify admin status** server-side
3. **Use database-driven permissions** for scalability
4. **Log admin access attempts** for audit trails
5. **Regular admin access reviews** for security

This authentication system provides enterprise-grade security for Web3 deployment while maintaining an excellent user experience for both regular users and administrators.