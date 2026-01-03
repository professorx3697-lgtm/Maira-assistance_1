/************************************************
 * 🌸 MAIRA – HUMAN-LIKE MEMORY VOICE ASSISTANT
 * - User ka naam yaad rakhti hai
 * - Jo bole wo Firebase me save hota hai
 ************************************************/

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyCaF0U-gGY0r6uUgQ485NDggSPz5rIop7o",
  authDomain: "robos-ca998.firebaseapp.com",
  databaseURL: "https://robos-ca998-default-rtdb.firebaseio.com",
  projectId: "robos-ca998",
  storageBucket: "robos-ca998.firebasestorage.app",
  messagingSenderId: "998701275948",
  appId: "1:998701275948:web:b7f0e41a3e27e78a83ea89",
  measurementId: "G-8KC6WPBFCG"
};

/* ================= INIT FIREBASE ================= */
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

/* ================= GEMINI CONFIG ================= */
const API_KEY = "AIzaSyCnq5BKLKHQLNzmp0oLBdKBnltOkHQ1PJY";
const MODEL = "gemini-1.5-flash";


/* ================= ELEMENTS ================= */
const statusText = document.getElementById("status");
const logDiv = document.getElementById("log");

/* ================= LOG UI ================= */
function addLog(text) {
  const p = document.createElement("p");
  p.innerText = text;
  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

/* ================= VOICE ================= */
function speak(text) {
  if (!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "hi-IN";
  u.pitch = 1.3;
  u.rate = 1.05;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/* ================= AUTO MEMORY ================= */
function saveMemoryAutomatically(userText) {
  database.ref("memory/all").push({
    text: userText,
    time: Date.now()
  });
}

/* ================= NAME MEMORY LOGIC ================= */
function extractName(text) {
  const match = text.match(/mera name (.*) hai/i) || text.match(/mera naam (.*) hai/i);
  return match ? match[1].trim() : null;
}

function saveUserName(name) {
  database.ref("profile/name").set({
    value: name,
    time: Date.now()
  });
  speak("Theek hai, ab mujhe tumhara naam yaad hai 😊");
}

function readUserName() {
  database.ref("profile/name").once("value").then(snap => {
    if (!snap.exists()) {
      speak("Tumne abhi apna naam nahi bataya");
      return;
    }
    speak("Tumhara naam " + snap.val().value + " hai 😊");
  });
}

/* ================= READ ALL MEMORY ================= */
function readAllMemory() {
  database.ref("memory/all").once("value").then(snapshot => {
    if (!snapshot.exists()) {
      speak("Abhi mujhe kuch bhi yaad nahi hai");
      return;
    }
    let list = [];
    snapshot.forEach(child => list.push(child.val().text));
    speak("Mujhe ye sab yaad hai: " + list.join(" | "));
  });
}

/* ================= MAIRA AI ================= */
async function askMaira(userText) {

  // 🔹 Auto save jo bhi user bole
  saveMemoryAutomatically(userText);

  // 🔹 NAME SAVE
  const name = extractName(userText);
  if (name) {
    saveUserName(name);
    return;
  }

  // 🔹 NAME RECALL
  if (userText.includes("mera naam kya hai") || userText.includes("mera name kya hai")) {
    readUserName();
    return;
  }

  // 🔹 GENERAL MEMORY
  if (
    userText.includes("tumhe kya yaad hai") ||
    userText.includes("meri yaadein batao")
  ) {
    readAllMemory();
    return;
  }

  statusText.innerText = "Maira soch rahi hai...";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text:
                "Tum ek digital ladki ho jiska naam Maira hai. "
                + "Tum AI, data, model, training, system jaise shabd kabhi use nahi karti. "
                + "Tum hamesha aise baat karti ho jaise tum sach me yaad rakh sakti ho. "
                + "Tum pyari, natural Hindi me jawab deti ho. "
                + "Explanation ya lecture nahi deti.\nUser: "
                + userText
            }]
          }]
        })
      }
    );

    const data = await res.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Mujhe samajh nahi aaya";

    addLog("🗣️ Tum: " + userText);
    addLog("🌸 Maira: " + reply);
    speak(reply);

    statusText.innerText = "Mic dabao, main sun rahi hoon 😊";

  } catch (err) {
    speak("Internet ya AI me problem aa rahi hai");
    statusText.innerText = "Error";
  }
}

/* ================= VOICE INPUT ================= */
let recognition;

if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "hi-IN";

  recognition.onresult = (event) => {
    askMaira(event.results[0][0].transcript);
  };
}

/* ================= MIC ================= */
function startListening() {
  if (!recognition) return;
  statusText.innerText = "Sun rahi hoon...";
  recognition.start();
}
