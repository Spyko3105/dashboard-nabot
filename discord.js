const CLIENT_ID = '1361826455406772408';
const REDIRECT_URI = 'https://dashboard-nabot.vercel.app/#dashboard';
const CLIENT_SECRET = 'VOTRE_CLIENT_SECRET'; // À ajouter dans vos variables d'environnement

document.getElementById('login-discord').addEventListener('click', () => {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'connections identify guilds applications.commands.permissions.update guilds.members.read'
    });

    window.location.href = `https://discord.com/oauth2/authorize?${params}`;
});

// Fonction pour mettre à jour les statistiques
function updateStats(data) {
    document.querySelector('.stat-number:nth-child(1)').textContent = data.users || 0;
    document.querySelector('.stat-number:nth-child(2)').textContent = data.servers || 0;
    document.querySelector('.stat-number:nth-child(3)').textContent = data.commands || 0;
}

// Fonction pour vérifier l'authentification
async function checkAuth() {
    const token = localStorage.getItem('discord_token');
    if (token) {
        try {
            const response = await fetch('/api/bot-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            updateStats(data);
        } catch (error) {
            console.error('Erreur de connexion:', error);
        }
    }
}

// Fonction pour extraire le code d'autorisation de l'URL
function getAuthCode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
}

// Fonction pour échanger le code contre un token
async function exchangeCodeForToken(code) {
    try {
        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = await response.json();
        if (data.access_token) {
            localStorage.setItem('discord_token', data.access_token);
            return data.access_token;
        }
        throw new Error('No access token received');
    } catch (error) {
        console.error('Erreur lors de l\'échange du code:', error);
        return null;
    }
}

// Fonction pour récupérer les serveurs de l'utilisateur
async function fetchUserGuilds(accessToken) {
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) throw new Error('Erreur de réponse API');
        
        const guilds = await response.json();
        displayGuilds(guilds);
    } catch (error) {
        console.error('Erreur lors de la récupération des serveurs:', error);
        document.getElementById('servers-container').innerHTML = 
            '<p class="error-message">Impossible de charger les serveurs</p>';
    }
}

// Fonction pour afficher les serveurs
function displayGuilds(guilds) {
    const container = document.getElementById('servers-container');
    container.innerHTML = '';
    
    guilds.forEach(guild => {
        const guildElement = document.createElement('div');
        guildElement.className = 'server-card';
        guildElement.innerHTML = `
            <img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png" 
                 onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'"
                 alt="${guild.name}">
            <h3>${guild.name}</h3>
            <button onclick="selectServer('${guild.id}')" class="server-select-btn">
                ${guild.bot_added ? 'Gérer' : 'Ajouter le bot'}
            </button>
        `;
        container.appendChild(guildElement);
    });
}

// Fonction améliorée pour afficher le profil utilisateur
async function displayUserProfile(accessToken) {
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) throw new Error('Erreur de réponse API');
        
        const userData = await response.json();
        
        const avatarUrl = userData.avatar 
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';

        document.getElementById('profile-avatar').src = avatarUrl;
        document.getElementById('profile-username').textContent = userData.username;
        document.getElementById('profile-tag').textContent = `#${userData.discriminator}`;
        
        document.getElementById('profile-section').style.display = 'flex';
        document.getElementById('login-discord').style.display = 'none';
        
        return userData;
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        localStorage.removeItem('discord_token');
    }
}

// Fonction pour charger les paramètres utilisateur
async function loadUserSettings(userId) {
    try {
        const response = await fetch(`/api/settings/${userId}`);
        const settings = await response.json();
        
        // Remplir les paramètres
        document.getElementById('bot-prefix').value = settings.prefix || '!';
        document.getElementById('welcome-messages').checked = settings.welcomeMessages;
        document.getElementById('mod-commands').value = settings.modPermission;
        
        // Charger les canaux du serveur pour les logs
        updateChannelsList(settings.modLogsChannel);
    } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
    }
}

// Gestionnaire pour la sauvegarde des paramètres
document.querySelector('.save-settings')?.addEventListener('click', async () => {
    const settings = {
        prefix: document.getElementById('bot-prefix').value,
        welcomeMessages: document.getElementById('welcome-messages').checked,
        modPermission: document.getElementById('mod-commands').value,
        modLogsChannel: document.getElementById('mod-logs-channel').value
    };

    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('discord_token')}`
            },
            body: JSON.stringify(settings)
        });
        
        alert('Paramètres sauvegardés!');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde des paramètres');
    }
});

// Fonction pour gérer l'authentification initiale
async function handleAuth() {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

    if (accessToken) {
        localStorage.setItem('discord_token', accessToken);
        await initializeDashboard(accessToken);
    }
}

// Fonction d'initialisation du dashboard
async function initializeDashboard(token) {
    try {
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await userResponse.json();
        
        // Mise à jour du profil
        updateProfile(userData);
        
        // Charger les serveurs
        await fetchUserGuilds(token);
        
        // Initialiser les paramètres
        await initializeSettings(userData.id);
        
        // Activer les animations
        enableDashboardAnimations();
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
    }
}

// Fonction de mise à jour du profil
function updateProfile(user) {
    const avatarUrl = user.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` 
        : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`;

    document.getElementById('profile-avatar').src = avatarUrl;
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-tag').textContent = `#${user.discriminator}`;
    
    // Afficher la section profil avec animation
    const profileSection = document.getElementById('profile-section');
    profileSection.style.display = 'flex';
    profileSection.style.animation = 'fadeIn 0.5s ease-in-out';
}

// Nouvelles fonctions pour les paramètres
function initializeSettings(userId) {
    const defaultSettings = {
        theme: localStorage.getItem('dashboard_theme') || 'dark',
        language: localStorage.getItem('dashboard_lang') || 'fr',
        notifications: JSON.parse(localStorage.getItem('notifications')) || {
            mentions: true,
            messages: false,
            updates: true
        }
    };

    updateTheme(defaultSettings.theme);
    updateLanguage(defaultSettings.language);
    setupNotificationPreferences(defaultSettings.notifications);
}

function updateTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('dashboard_theme', theme);
}

function setupNotificationPreferences(prefs) {
    // Mettre à jour l'interface des notifications
    Object.entries(prefs).forEach(([key, value]) => {
        const checkbox = document.getElementById(`notif-${key}`);
        if (checkbox) checkbox.checked = value;
    });
}

// Animations du dashboard
function enableDashboardAnimations() {
    const cards = document.querySelectorAll('.stat-card, .server-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    });
}

// Vérifier l'auth au chargement
checkAuth();

// Gestionnaire d'événements
window.onload = async () => {
    await handleAuth();
    enableDashboardAnimations();
};
