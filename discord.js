const CLIENT_ID = '1361826455406772408'; // Remplacez par votre vrai Client ID
const REDIRECT_URI = window.location.origin + '/callback'; // Utilise l'URL actuelle du site

document.getElementById('login-discord').addEventListener('click', () => {
    // Assurez-vous que cette URL correspond EXACTEMENT à celle configurée dans le portail Discord
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds bot',
        permissions: '8'
    });

    window.location.href = `https://discord.com/api/oauth2/authorize?${params}`;
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

// Vérifier l'auth au chargement
checkAuth();
