# Firebase Environment Guide (Beginner-Friendly)

This short guide shows **exactly** how to work with two separate Firebase set-ups:

* **Local Emulator** – safe "practice" copy that lives only on your computer.  
* **Production Firebase** – the real online project that powers the live website.

The goal is to let you test freely **without ever hurting live data**.

---

## 1. Local Emulator vs. Production (What's the difference?)

| Feature               | Local **Emulator** (_safe_)                 | **Production** Firebase (_live_)                |
|-----------------------|---------------------------------------------|-------------------------------------------------|
| Runs on               | **Your computer** – `localhost` addresses   | Google's servers – project URL ends in `firebaseio.com` |
| Data persistence      | Disappears when you stop the emulator       | Permanent database for real users               |
| Billing               | **Free**                                    | Counts toward usage/billing                     |
| Best for              | Coding, trying ideas, breaking things       | Real users, real content                        |

**Visual markers**

* 🟢 **Green prompt** in the terminal means you are inside the **emulator**.  
* 🔴 **Red prompt** means you are connected to **production**.

---

## 2. Step-by-Step: Setting up Environment Variables

Environment variables let the code know **which** Firebase to talk to.

### 2.1 Files you will create


### 2.2 Add these lines

**.env.local**
