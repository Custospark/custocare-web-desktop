import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import {
  selectVerificationContext,
  selectPendingLogin,
  selectToken,
  selectUser,
  selectPasswordResetEmail,
} from '../../../../../app/store/slices/authSlice';

/**
 * ============================================================================
 * AUTH SLICE TEST COMPONENT
 * ============================================================================
 *
 * Simple test component to verify auth slice state after verification flows.
 * Displays current values from auth slice and checks localStorage persistence.
 * 
 * Usage: Temporarily replace your AuthStatus with this component
 * to debug auth state after verification.
 */

export const AuthStatus: React.FC = () => {
  const verification = useAppSelector(selectVerificationContext);
  const pendingLogin = useAppSelector(selectPendingLogin);
  const token = useAppSelector(selectToken);
  const user = useAppSelector(selectUser);
  const resetEmail = useAppSelector(selectPasswordResetEmail);
  
  // Get email and userId from verification context (they're stored there)
  const email = verification.email;
  const userId = verification.userId;
  
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null);
  const [localStorageUser, setLocalStorageUser] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Check localStorage on mount and whenever token changes
  useEffect(() => {
    const checkLocalStorage = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      
      setLocalStorageToken(storedToken);
      setLocalStorageUser(storedUser);
    };

    checkLocalStorage();
    
    // Set up an interval to check localStorage periodically
    // This helps detect changes from other components
    const interval = setInterval(checkLocalStorage, 1000);
    
    return () => clearInterval(interval);
  }, [token]); // Re-run when Redux token changes

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshCounter(prev => prev + 1);
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    setLocalStorageToken(storedToken);
    setLocalStorageUser(storedUser);
  };

  // Check if we have a complete authenticated session
  const isAuthenticated = !!token && !!user && !!localStorageToken;
  const hasVerificationData = verification.type !== null || pendingLogin !== null;
  const hasLocalStoragePersistence = !!localStorageToken && !!localStorageUser;

  return (
    <div style={{ 
      padding: '30px', 
      fontFamily: 'monospace',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        <h2 style={{ margin: 0, color: '#61dafb' }}>
          🔐 Auth Slice Test
        </h2>
        <div>
          <span style={{ 
            backgroundColor: '#333', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#888'
          }}>
            v1.0 | Auto-refresh: {refreshCounter}
          </span>
        </div>
      </div>

      {/* Authentication Status Banner */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '6px',
        backgroundColor: isAuthenticated ? '#1a3a1a' : '#3a1a1a',
        border: `1px solid ${isAuthenticated ? '#2a5a2a' : '#5a2a2a'}`,
        textAlign: 'center'
      }}>
        <strong style={{ fontSize: '16px' }}>
          Status: {isAuthenticated ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED'}
        </strong>
        <div style={{ fontSize: '12px', marginTop: '5px', color: '#aaa' }}>
          {isAuthenticated 
            ? 'Token present in both Redux and localStorage' 
            : hasVerificationData 
              ? 'In verification flow - waiting for completion' 
              : 'No active session'}
        </div>
      </div>

      {/* Token Status */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '15px', 
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#ffaa00', fontSize: '14px' }}>
          🔑 TOKEN STATUS
        </h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          <div>
            <span style={{ color: '#888', width: '120px', display: 'inline-block' }}>
              Redux Token:
            </span>
            <span style={{ 
              color: token ? '#4caf50' : '#f44336',
              fontWeight: 'bold'
            }}>
              {token ? '✅ Present' : '❌ Missing'}
            </span>
            {token && (
              <span style={{ marginLeft: '10px', fontSize: '11px', color: '#aaa' }}>
                (starts with: {token.substring(0, 15)}...)
              </span>
            )}
          </div>
          <div>
            <span style={{ color: '#888', width: '120px', display: 'inline-block' }}>
              localStorage Token:
            </span>
            <span style={{ 
              color: localStorageToken ? '#4caf50' : '#f44336',
              fontWeight: 'bold'
            }}>
              {localStorageToken ? '✅ Present' : '❌ Missing'}
            </span>
          </div>
          <div>
            <span style={{ color: '#888', width: '120px', display: 'inline-block' }}>
              Persistence:
            </span>
            <span style={{ 
              color: hasLocalStoragePersistence ? '#4caf50' : '#f44336',
              fontWeight: 'bold'
            }}>
              {hasLocalStoragePersistence ? '✅ OK' : '❌ Failed'}
            </span>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '15px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4caf50', fontSize: '14px' }}>
            👤 USER INFO
          </h3>
          <pre style={{ 
            margin: 0, 
            fontSize: '12px', 
            color: '#e0e0e0',
            backgroundColor: '#1e1e1e',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}

      {/* Verification Context Fields */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '15px', 
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#61dafb', fontSize: '14px' }}>
          📍 VERIFICATION CONTEXT FIELDS
        </h3>
        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <span style={{ color: '#888' }}>email:</span>{' '}
            <span style={{ color: email && typeof email === 'string' && email.length > 0 ? '#4caf50' : '#f44336' }}>
              {email && typeof email === 'string' && email.length > 0 ? email : '<null>'}
            </span>
          </div>
          <div>
            <span style={{ color: '#888' }}>userId:</span>{' '}
            <span style={{ color: userId != null ? '#4caf50' : '#f44336' }}>
              {userId != null ? String(userId) : '<null>'}
            </span>
          </div>
          <div>
            <span style={{ color: '#888' }}>type:</span>{' '}
            <span style={{ color: verification.type ? '#4caf50' : '#f44336' }}>
              {verification.type || '<null>'}
            </span>
          </div>
          <div>
            <span style={{ color: '#888' }}>flow:</span>{' '}
            <span style={{ color: verification.flow ? '#4caf50' : '#f44336' }}>
              {verification.flow || '<null>'}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Login */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '15px', 
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#ffaa00', fontSize: '14px' }}>
          ⏳ PENDING LOGIN
        </h3>
        {pendingLogin ? (
          <div>
            <div><span style={{ color: '#888' }}>email:</span> {pendingLogin.email}</div>
            <div><span style={{ color: '#888' }}>password:</span> {'•'.repeat(8)}</div>
            <div><span style={{ color: '#888' }}>remember_me:</span> {String(pendingLogin.remember_me)}</div>
          </div>
        ) : (
          <span style={{ color: '#888' }}>&lt;null&gt;</span>
        )}
      </div>

      {/* localStorage Contents */}
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '15px', 
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#9c27b0', fontSize: '14px' }}>
          💾 LOCALSTORAGE CONTENTS
        </h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div>
            <span style={{ color: '#888' }}>authToken:</span>{' '}
            {localStorageToken ? (
              <span style={{ color: '#4caf50', wordBreak: 'break-all' }}>
                {localStorageToken.substring(0, 30)}...
              </span>
            ) : (
              <span style={{ color: '#f44336' }}>❌ Missing</span>
            )}
          </div>
          <div>
            <span style={{ color: '#888' }}>authUser:</span>{' '}
            {localStorageUser ? (
              <span style={{ color: '#4caf50' }}>✅ Present</span>
            ) : (
              <span style={{ color: '#f44336' }}>❌ Missing</span>
            )}
          </div>
        </div>
      </div>

      {/* Debug Actions */}
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        marginTop: '20px',
        justifyContent: 'center'
      }}>
        <button
          onClick={handleRefresh}
          style={{
            backgroundColor: '#61dafb',
            color: '#1a1a1a',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          🔄 Refresh localStorage Check
        </button>
        
        <button
          onClick={() => {
            console.log('Auth Slice State:', {
              verification,
              pendingLogin,
              token,
              user,
              resetEmail
            });
            alert('State logged to console');
          }}
          style={{
            backgroundColor: '#4caf50',
            color: '#1a1a1a',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          📝 Log to Console
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            handleRefresh();
            alert('localStorage cleared - refresh the page to see effect');
          }}
          style={{
            backgroundColor: '#f44336',
            color: '#1a1a1a',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          🗑️ Clear localStorage
        </button>
      </div>

      {/* Flow-specific Instructions */}
      <div style={{ 
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#333',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#aaa'
      }}>
        <strong>Test Instructions:</strong>
        <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
          <li>After successful verification, you should see "AUTHENTICATED" banner</li>
          <li>Token should be present in both Redux and localStorage</li>
          <li>User object should be populated with your profile data</li>
          <li>Verification context should be cleared (all null)</li>
          <li>Refresh the page - token should persist from localStorage</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthStatus;