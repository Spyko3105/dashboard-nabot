const CLIENT_ID = '1361826455406772408';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'gjtCsa642TLGIMaQS0j9CaqLa-xcaOYM';
const REDIRECT_URI = 'https://dashboard-nabot.vercel.app/callback';
const API_ENDPOINT = 'https://discord.com/api/v10';

// État de l'application
const state = {
    user: null,
    guilds: null,
    selectedGuild: null
};

// Fonction d'initialisation
async function init() {
    const token = localStorage.getItem('discord_token');
    if (token) {
        try {
            await fetchUserData(token);
            hideLoginButton();
            showDashboard();
        } catch (error) {
            localStorage.removeItem('discord_token');
            showLoginButton();
        }
    }
}

// Fonction d'authentification améliorée
async function authenticateWithDiscord() {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds bot applications.commands',
        prompt: 'consent'
    });

    window.location.href = `${API_ENDPOINT}/oauth2/authorize?${params}`;
}

// Gestion du callback
async function handleCallback(code) {
    try {
        const tokenResponse = await fetch(`${API_ENDPOINT}/oauth2/token`, {
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

        const tokenData = await tokenResponse.json();
        localStorage.setItem('discord_token', tokenData.access_token);
        localStorage.setItem('refresh_token', tokenData.refresh_token);
        
        await fetchUserData(tokenData.access_token);
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
    }
}

// Récupération des données utilisateur
async function fetchUserData(token) {
    const userResponse = await fetch(`${API_ENDPOINT}/users/@me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!userResponse.ok) throw new Error('Token invalide');
    
    state.user = await userResponse.json();
    updateProfileUI(state.user);
    
    // Récupérer les serveurs
    await fetchUserGuilds(token);
}

// Mise à jour de l'interface utilisateur
function updateProfileUI(user) {
    const avatarUrl = user.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;

    document.getElementById('profile-avatar').src = avatarUrl;
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-tag').textContent = `#${user.discriminator}`;
    
    document.getElementById('profile-section').style.display = 'flex';
}

// Écouteurs d'événements
document.getElementById('login-discord').addEventListener('click', authenticateWithDiscord);

// Gestionnaire de navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        switchSection(section);
    });
});

function switchSection(sectionId) {
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

    // Afficher la section
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    // Charger les données spécifiques
    loadSectionData(sectionId);
}

async function loadSectionData(section) {
    const token = localStorage.getItem('discord_token');
    if (!token) return;

    try {
        switch(section) {
            case 'commands':
                await loadCommands();
                break;
            case 'automod':
                await loadAutoModSettings();
                break;
            // Ajouter d'autres cas pour les différentes sections
        }
    } catch (error) {
        console.error(`Erreur lors du chargement de la section ${section}:`, error);
    }
}

// Fonction pour charger les commandes
async function loadCommands() {
    const commandsContainer = document.querySelector('.command-list');
    try {
        const response = await fetch('/api/commands', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('discord_token')}`
            }
        });
        const commands = await response.json();
        
        commandsContainer.innerHTML = commands.map(cmd => `
            <div class="command-item">
                <div class="command-info">
                    <h4>${cmd.name}</h4>
                    <p>${cmd.description}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" ${cmd.enabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
    }
}

// Vérification de l'URL pour le callback
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        handleCallback(code);
    } else {
        init();
    }
};
