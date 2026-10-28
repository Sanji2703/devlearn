import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, googleSignIn, logOut, getAccessToken } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  isTokenValid: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  retryTokenValidation: () => Promise<boolean>;
  isSigningIn: boolean;
  authError: string | null;
  tokenServiceNotice: string | null;
  clearAuthError: () => void;
  dismissTokenServiceNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tokenServiceNotice, setTokenServiceNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            await currentUser.getIdToken(false);
            setIsTokenValid(true);
            setTokenServiceNotice(null);
          } catch (tokenErr: any) {
            const msg = tokenErr?.message || String(tokenErr);
            console.warn('Firebase token verification notice:', msg);
            setIsTokenValid(false);
            if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken.googleapis.com')) {
              setTokenServiceNotice('https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=867733881087');
            }
          }

          try {
            const token = await getAccessToken();
            setAccessTokenState(token);
          } catch (e) {
            console.warn('Could not read access token:', e);
          }
        } else {
          setIsTokenValid(false);
          setAccessTokenState(null);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Auth state subscription notice:', error);
        setIsTokenValid(false);
        const msg = error?.message || String(error);
        if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken.googleapis.com')) {
          setTokenServiceNotice('https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=867733881087');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const retryTokenValidation = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await auth.currentUser.getIdToken(true);
      setIsTokenValid(true);
      setTokenServiceNotice(null);
      setAuthError(null);
      return true;
    } catch (err: any) {
      setIsTokenValid(false);
      const msg = err?.message || String(err);
      if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken.googleapis.com')) {
        setTokenServiceNotice('https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=867733881087');
      }
      return false;
    }
  };

  const login = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessTokenState(res.accessToken);
        try {
          await res.user.getIdToken(false);
          setIsTokenValid(true);
          setTokenServiceNotice(null);
        } catch (tokenErr: any) {
          setIsTokenValid(false);
          const msg = tokenErr?.message || String(tokenErr);
          if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken.googleapis.com')) {
            setTokenServiceNotice('https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=867733881087');
          }
        }
      }
    } catch (err: any) {
      console.warn('Login handled warning:', err);
      let msg = err.message || 'Erreur lors de la connexion Google';
      if (err.code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        msg = 'Domaine non autorisé dans Firebase : Veuillez ajouter l’URL de votre site (Netlify) dans Firebase Console > Authentication > Settings > Authorized domains.';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'La fenêtre de connexion a été bloquée par le navigateur. Veuillez autoriser les popups pour ce site.';
      } else if (msg.includes('token-service-api-has-not-been-used') || msg.includes('securetoken.googleapis.com')) {
        setTokenServiceNotice('https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=867733881087');
        msg = 'Le service Google Secure Token API doit être activé sur votre console Google Cloud. Vos données locales restent 100% sauvegardées.';
      }
      setAuthError(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    try {
      await logOut();
      setUser(null);
      setIsTokenValid(false);
      setAccessTokenState(null);
      setTokenServiceNotice(null);
    } catch (err: any) {
      console.warn('Logout warning:', err);
    }
  };

  const clearAuthError = () => setAuthError(null);
  const dismissTokenServiceNotice = () => setTokenServiceNotice(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        isTokenValid,
        login,
        logout,
        retryTokenValidation,
        isSigningIn,
        authError,
        tokenServiceNotice,
        clearAuthError,
        dismissTokenServiceNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
