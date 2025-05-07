const CLIENT_ID = '1361826455406772408';
const REDIRECT_URI = 'https://dashboard-nabot.vercel.app/#dashboard';

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

// Fonction pour récupérer les serveurs de l'utilisateur
async function fetchUserGuilds(accessToken) {
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const guilds = await response.json();
        displayGuilds(guilds);
    } catch (error) {
        console.error('Erreur lors de la récupération des serveurs:', error);
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

// Fonction pour afficher le profil utilisateur
async function displayUserProfile(accessToken) {
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const userData = await response.json();
        
        const avatarUrl = userData.avatar 
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';

        document.getElementById('profile-section').style.display = 'flex';
        document.getElementById('profile-avatar').src = avatarUrl;
        document.getElementById('profile-username').textContent = userData.username;
        document.getElementById('profile-discriminator').textContent = `#${userData.discriminator}`;
        
        // Récupérer les serveurs après le profil
        await fetchUserGuilds(accessToken);
        
        // Cacher le bouton de connexion
        document.getElementById('login-discord').style.display = 'none';
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
    }
}

// Vérifier l'auth au chargement
checkAuth();

// Vérifier l'authentification au chargement
window.onload = async () => {
    const code = getAuthCode();
    if (code) {
        // TODO: Échanger le code contre un token d'accès via votre backend
        // Pour l'exemple, on simule un token
        const mockAccessToken = code;
        await displayUserProfile(mockAccessToken);
    }
};
