const domainAPI = "https://api.mail.tm/domains";
const accountAPI = "https://api.mail.tm/accounts";
const tokenAPI = "https://api.mail.tm/token";
const messagesAPI = "https://api.mail.tm/messages";

let userEmail = "";
let userPassword = "";
let userToken = "";

// 📌 Step 1: Get Domain
async function getDomain() {
    try {
        let response = await fetch(domainAPI);
        let data = await response.json();
        return data["hydra:member"][0].domain;
    } catch (error) {
        console.error("Domain Error:", error);
        showNotification("Failed to get domain. Try again.");
    }
}

// 📌 Step 2: Generate Email
async function generateEmail() {
    try {
        document.getElementById("email").innerText = "Generating...";
        let domain = await getDomain();
        
        // Generate random username
        const username = Math.random().toString(36).substring(2, 10);
        userEmail = `${username}@${domain}`;
        userPassword = "Password123!";

        // Create account
        await fetch(accountAPI, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: userEmail, password: userPassword })
        });

        // Get token
        await getToken(); // Await added here

        document.getElementById("email").innerText = userEmail;
        showNotification("Email generated successfully!");

    } catch (error) {
        console.error("Generation Error:", error);
        document.getElementById("email").innerText = "Not Generated";
        showNotification("Failed to generate email. Please try again.");
    }
}

// 📌 Step 3: Get Token (Fixed)
async function getToken() {
    try {
        const response = await fetch(tokenAPI, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: userEmail, password: userPassword })
        });

        if (!response.ok) throw new Error("Token request failed");
        
        const data = await response.json();
        userToken = data.token;
        
    } catch (error) {
        console.error("Token Error:", error);
        showNotification("Authentication failed. Regenerate email.");
    }
}

// 📌 Step 4: Check Inbox (Fixed)
async function checkInbox() {
    try {
        // Double validation
        if (!userEmail || !userToken) {
            showNotification("Please generate an email first!");
            return;
        }

        const response = await fetch(messagesAPI, {
            headers: { "Authorization": `Bearer ${userToken}` }
        });

        const data = await response.json();
        const inboxDiv = document.getElementById("inbox");
        inboxDiv.innerHTML = "<h3>Inbox:</h3>";

        if (data["hydra:member"].length === 0) {
            inboxDiv.innerHTML += "<p>No new messages.</p>";
        } else {
            for (const msg of data["hydra:member"]) {
                const emailContent = await fetch(`https://api.mail.tm/messages/${msg.id}`, {
                    headers: { "Authorization": `Bearer ${userToken}` }
                });
                const emailData = await emailContent.json();
                const emailBody = emailData.html ? emailData.html.join(" ") : emailData.text;

                inboxDiv.innerHTML += `
                    <div class="email">
                        <p><b>From:</b> ${msg.from.address}</p>
                        <p><b>Subject:</b> ${msg.subject}</p>
                        <p><b>Message:</b> ${emailBody}</p>
                    </div>
                    <hr>
                `;
            }
        }
    } catch (error) {
        console.error("Inbox Error:", error);
        showNotification("Failed to load inbox. Try again.");
    }
}

// 📌 Step 5: Copy Email (Fixed)
function copyEmail() {
    if (!userEmail) {
        showNotification("No email generated yet!");
        return;
    }
    navigator.clipboard.writeText(userEmail);
    showNotification("Email copied to clipboard!");
}

// 📌 Notification System
function showNotification(message) {
    const notification = document.getElementById("customNotification");
    document.getElementById("notificationText").textContent = message;
    notification.style.display = "block";
    setTimeout(() => notification.style.display = "none", 3000); // Auto-close after 3s
}
