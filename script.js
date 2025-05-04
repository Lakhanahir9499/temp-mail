const domainAPI = "https://api.mail.tm/domains";
const accountAPI = "https://api.mail.tm/accounts";
const tokenAPI = "https://api.mail.tm/token";
const messagesAPI = "https://api.mail.tm/messages";

let userEmail = "";
let userPassword = "";
let userToken = "";

// 📌 Step 1: Get Domain
async function getDomain() {
    let response = await fetch(domainAPI);
    let data = await response.json();
    return data["hydra:member"][0].domain;
}

// 📌 Step 2: Generate Email
async function generateEmail() {
    let domain = await getDomain();
    let username = Math.random().toString(36).substring(7);
    userEmail = `${username}@${domain}`;
    userPassword = "Password123!";

    let response = await fetch(accountAPI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: userEmail, password: userPassword })
    });

    document.getElementById("email").innerText = userEmail;
    getToken();
}

// 📌 Step 3: Get Token
async function getToken() {
    let response = await fetch(tokenAPI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: userEmail, password: userPassword })
    });

    let data = await response.json();
    userToken = data.token;
}

// 📌 Step 4: Check Inbox & Show Full Email Content
async function checkInbox() {
    if (!userToken) {
        alert("No email generated yet!");
        return;
    }

    let response = await fetch(messagesAPI, {
        headers: { "Authorization": `Bearer ${userToken}` }
    });

    let data = await response.json();
    let inboxDiv = document.getElementById("inbox");
    inboxDiv.innerHTML = "<h3>Inbox:</h3>";

    if (data["hydra:member"].length === 0) {
        inboxDiv.innerHTML += "<p>No new messages.</p>";
    } else {
        for (let msg of data["hydra:member"]) {
            let emailContent = await fetch(`https://api.mail.tm/messages/${msg.id}`, {
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            let emailData = await emailContent.json();

            let emailBody = emailData.html ? emailData.html.join(" ") : emailData.text;

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
}

// 📌 Step 5: Copy Email to Clipboard
function copyEmail() {
    if (!userEmail) {
        alert("No email generated yet!");
        return;
    }
    navigator.clipboard.writeText(userEmail);
    alert("Email copied to clipboard!");
}
