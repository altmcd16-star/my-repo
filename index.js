const axios = require('axios');

// Automatically pulls your secret cookie from the environment variables
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

if (!ROBLOX_COOKIE || ROBLOX_COOKIE.includes("WARNING")) {
    console.error("ERROR: ROBLOX_COOKIE environment variable is missing or invalid!");
    process.exit(1);
}

const robloxClient = axios.create({
    headers: {
        'Cookie': `.ROBLOSECURITY=${ROBLOX_COOKIE}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

async function getCsrfToken() {
    try {
        await robloxClient.post('https://roblox.com');
    } catch (error) {
        const token = error.response?.headers['x-csrf-token'];
        if (token) return token;
        throw new Error("Could not fetch X-CSRF-TOKEN. Check if your cookie is valid.");
    }
}

async function getFriendRequests() {
    try {
        const response = await robloxClient.get('https://roblox.com');
        return response.data.data; 
    } catch (error) {
        console.error("Error fetching friend requests:", error.response?.data || error.message);
        return [];
    }
}

async function acceptFriendRequest(userId, csrfToken) {
    try {
        const response = await robloxClient.post(
            `https://roblox.com{userId}/accept-friend-request`,
            {}, 
            { headers: { 'X-CSRF-TOKEN': csrfToken } }
        );
        
        if (response.status === 200) {
            console.log(`Successfully accepted request from User ID: ${userId}`);
            return true;
        }
    } catch (error) {
        console.error(`Failed to accept request from User ID ${userId}:`, error.response?.data || error.message);
        return false;
    }
}

async function main() {
    console.log("Checking for friend requests...");
    
    const requests = await getFriendRequests();
    if (requests.length === 0) {
        console.log("No pending friend requests found.");
        return;
    }
    
    console.log(`Found ${requests.length} pending request(s). Fetching CSRF Token...`);
    let csrfToken;
    try {
        csrfToken = await getCsrfToken();
    } catch (e) {
        console.error(e.message);
        return;
    }
    
    for (const requester of requests) {
        console.log(`Processing request from: ${requester.name} (${requester.id})`);
        await acceptFriendRequest(requester.id, csrfToken);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
    }
    
    console.log("Finished checking requests.");
}

// Runs every 5 minutes in the background
main();
setInterval(main, 5 * 60 * 1000);
