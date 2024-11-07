import Cookies from 'js-cookie';
import { useCallback } from 'react';

const useSuapClient = (authHost, clientID, redirectURI, scope) => {
  const resourceURL = `${authHost}/api/eu/`;
  const authorizationURL = `${authHost}/o/authorize/`;
  const logoutURL = `${authHost}/o/revoke_token/`;

  const responseType = 'token';

  const extractToken = () => {
    const match = window.location.hash.match(/access_token=([^&]+)/);
    return match ? match[1] : null;
  };

  const extractScope = () => {
    const match = window.location.hash.match(/scope=([^&]+)/);
    return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
  };

  const extractDuration = () => {
    const match = window.location.hash.match(/expires_in=(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  const clearUrl = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const initToken = useCallback(() => {
    const tokenValue = extractToken();
    const expirationTime = extractDuration();
    const extractedScope = extractScope();

    if (tokenValue) {
      Cookies.set('suapToken', tokenValue, { expires: expirationTime / 86400 });
      Cookies.set('suapScope', extractedScope);
      clearUrl();
    }

    return {
      tokenValue,
      expirationTime,
      scope: extractedScope,
    };
  }, []);

  const isAuthenticated = useCallback(() => {
    return !!Cookies.get('suapToken');
  }, []);

  const login = useCallback(() => {
    const loginUrl = `${authorizationURL}?response_type=${responseType}&client_id=${clientID}&scope=${scope}&redirect_uri=${redirectURI}`;
    
    window.location.href = loginUrl;
  }, [authorizationURL, responseType, clientID, scope, redirectURI]);

  const logoutHandler = useCallback(() => {
    fetch(logoutURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: Cookies.get('suapToken'),
        client_id: clientID,
      }),
    })
      .then(() => {
        Cookies.remove('suapToken');
        window.location.href = "http://localhost:3000/login";
      })
      .catch((error) => {
        console.error('Erro ao fazer logout:', error);
      });
  }, [logoutURL, clientID]);

  const getResource = useCallback((callback) => {
    fetch(resourceURL, {
      headers: {
        Authorization: `Bearer ${Cookies.get('suapToken')}`,
        Accept: 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        console.error('Erro ao obter recursos:', error);
        logoutHandler();
      });
  }, [resourceURL, logoutHandler]);

  return {
    initToken,
    isAuthenticated,
    login,
    logout: logoutHandler,
    getResource,
  };
};

export default useSuapClient;
