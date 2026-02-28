// Authentication Module
// Handles all login, logout, and user authentication

import { auth } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// CEO Login (Email & Password)
export async function loginCEO(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    sessionStorage.setItem('userRole', 'ceo');
    sessionStorage.setItem('userId', user.uid);
    sessionStorage.setItem('userEmail', user.email);
    sessionStorage.setItem('userName', 'CEO Admin');
    
    return { success: true, user };
  } catch (error) {
    console.error('CEO login error:', error);
    return { success: false, error: error.message };
  }
}

// Agent Login (National ID + Password)
export async function loginAgent(nationalId, password) {
  try {
    const email = nationalId.toLowerCase() + '@agent.hawalina.com';
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    sessionStorage.setItem('userRole', 'agent');
    sessionStorage.setItem('userId', user.uid);
    sessionStorage.setItem('nationalId', nationalId);
    sessionStorage.setItem('userName', 'Agent');
    
    return { success: true, user, nationalId };
  } catch (error) {
    console.error('Agent login error:', error);
    return { success: false, error: error.message };
  }
}

// Create CEO Account
export async function createCEOAccount(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('CEO account creation error:', error);
    return { success: false, error: error.message };
  }
}

// Create Agent Account
export async function createAgentAccount(nationalId, password, agentData) {
  try {
    const email = nationalId.toLowerCase() + '@agent.hawalina.com';
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    return { 
      success: true, 
      user: userCredential.user,
      nationalId,
      agentData 
    };
  } catch (error) {
    console.error('Agent account creation error:', error);
    return { success: false, error: error.message };
  }
}

// Logout
export async function logout() {
  try {
    await signOut(auth);
    sessionStorage.clear();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Check if user is authenticated
export function isAuthenticated() {
  return auth.currentUser !== null;
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// Get user role from session
export function getUserRole() {
  return sessionStorage.getItem('userRole');
}

// Get user ID from session
export function getUserId() {
  return sessionStorage.getItem('userId');
}

// Get National ID from session (for agents)
export function getNationalId() {
  return sessionStorage.getItem('nationalId');
}

// Auth state observer
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ✅ FIXED requireRole — waits for Firebase to restore auth state
// before checking the role, preventing false redirects on page load.
export function requireRole(requiredRole) {
  return new Promise((resolve) => {
    // If sessionStorage already has the role (e.g. navigating between pages),
    // check immediately without waiting.
    const cachedRole = sessionStorage.getItem('userRole');
    if (cachedRole && cachedRole === requiredRole) {
      resolve(true);
      return;
    }

    // Otherwise wait for Firebase to finish restoring the auth session.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // stop listening after first call

      if (!user) {
        // Not logged in at all — redirect to home
        window.location.href = 'index.html';
        resolve(false);
        return;
      }

      // User is logged in — figure out their role from their email
      const email = user.email || '';
      let role = null;

      if (email.endsWith('@agent.hawalina.com')) {
        role = 'agent';
        // Restore session if it was cleared
        if (!sessionStorage.getItem('userRole')) {
          sessionStorage.setItem('userRole', 'agent');
          sessionStorage.setItem('userId', user.uid);
          // Extract national ID from email: gha-123456789-0@agent.hawalina.com
          const nationalId = email.replace('@agent.hawalina.com', '').toUpperCase();
          sessionStorage.setItem('nationalId', nationalId);
        }
      } else {
        role = 'ceo';
        // Restore session if it was cleared
        if (!sessionStorage.getItem('userRole')) {
          sessionStorage.setItem('userRole', 'ceo');
          sessionStorage.setItem('userId', user.uid);
          sessionStorage.setItem('userEmail', user.email);
        }
      }

      if (role !== requiredRole) {
        window.location.href = 'index.html';
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

console.log('Auth module loaded');