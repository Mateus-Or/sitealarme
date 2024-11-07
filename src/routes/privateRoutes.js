import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import useSuapClient from '../login_suap/client';
import Loading from '../components/layouts/Loading';
import Cookies from 'js-cookie';
import { ip } from '../components/ip';

export default function PrivateRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    const clientID = 'S3uUVTw2uvD0hixw0zsrJxlNJt8aWIPXU70LhtYH';
    const redirectURI = 'http://localhost:3000/times';
    const authHost = 'https://suap.ifro.edu.br';
    const scope = 'identificacao email documentos_pessoais';

    const { initToken, getResource, logout, isAuthenticated: checkAuth } = useSuapClient(
        authHost,
        clientID,
        redirectURI,
        scope
    );

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                console.log('Iniciando fetch para usuários...');
                const response = await fetch(`http://${ip}:5000/users`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Erro na resposta da API: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Dados recebidos da API de usuários:', data);
                setUsers(data);
            } catch (error) {
                console.error('Erro ao buscar usuários:', error);
                alert('Erro ao buscar usuários autorizados. Por favor, tente novamente mais tarde.');
            }
        };

        fetchUsers();
    }, [ip]);

    useEffect(() => {
        const verifyAuthentication = () => {
            const tokenInfo = Cookies.get('suapToken');
            if (tokenInfo) {
                getResource((data) => {
                    if (data) {
                        console.log("Identificação do usuário autenticado:", data.identificacao);

                        const userExists = users.some(user => user.identificacao.trim() === data.identificacao.trim());

                        console.log('Usuário está na lista de usuários autorizados:', userExists);

                        if (userExists) {
                            setIsAuthenticated(true);
                        } else {
                            logout();
                            alert('Você não tem acesso a esta área.');
                            
                            
                            setIsAuthenticated(false);
                        }
                    } else {
                        logout();
                        alert('Erro ao obter dados do usuário.');
                        
                        setIsAuthenticated(false);
                    }
                    setLoading(false);
                });
            } else {
                const authStatus = checkAuth();
                console.log('Status de autenticação sem token:', authStatus);
                setIsAuthenticated(authStatus);
                setLoading(false);
                console.log("veio pra ca");
            }
        };

        if (users.length > 0) {
            verifyAuthentication();
        }
    }, [users, getResource, logout, checkAuth]);

    if (loading) {
        return <Loading />;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}