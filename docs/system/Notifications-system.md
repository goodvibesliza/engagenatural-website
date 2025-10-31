## 3) Notifications (MVP — Telegram)

### Overview
Replace Email + Push with Telegram-based notifications for app updates, new lessons, brand challenges, and reward confirmations.  
This system connects verified users’ EngageNatural accounts to their Telegram accounts via the official @EngageNaturalBot.

---

### Telegram Bot (Core Setup)
- Create bot via BotFather (`@EngageNaturalBot`).
- Functions: `functions/src/telegram/webhook.ts` for webhook handling.
- Store bot credentials in env:
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=EngageNaturalBot
TELEGRAM_WEBHOOK_URL=https://<cloud-function-url>/telegram/webhook
TELEGRAM_ANNOUNCE_CHANNEL_ID=@engagenatural_updates

yaml
Copy code
- Enable HTTPS webhook in Cloud Functions, receive and verify updates.

---

### User Linking
- Add “Connect Telegram” button in Profile:
- Deep link: `https://t.me/EngageNaturalBot?start=link_<uid>`
- When bot receives `/start link_<uid>`, store in Firestore:
users/{uid}/telegram:
chat_id: string
username: string
linked_at: timestamp

yaml
Copy code
- Show linked status + disconnect option in profile.

---

### Notification Types
| Type | Trigger | Target | Example Message |
|------|----------|---------|-----------------|
| Account Verified | verification.status=approved | DM | ✅ You’re verified! Start earning rewards. |
| Quiz Passed | lesson completion passed=true | DM | 🎉 You passed [Lesson Name]! You earned 0.5 TON. |
| Challenge Milestone | challenge streak/day met | DM | 🔥 Day 3 complete in [Challenge]! Keep it up. |
| Reward Sent | reward tx confirmed | DM | 💎 You just received 0.7 TON for your training. |
| New Lesson | lesson.status=active | Channel Broadcast | 📘 New training: [Lesson Title]. Earn rewards now. |
| New Challenge | challenge.status=active | Channel Broadcast | 🧭 Join [Challenge Name] and win TON rewards! |
| Admin Message | admin sends update | Channel Broadcast | 🗞️ App update: new features live this week. |

---

### Functions

**`functions/src/telegram/sendMessage.ts`**
- Helper: `sendTelegram({ chat_id|channel_id, text, parse_mode?, reply_markup? })`
- Supports retries and logs to Firestore:
notifications_meta/{uid}/telegram:
messages/{messageId}:
type: string
text: string
status: "sent" | "failed"
error?: string
sent_at: timestamp


**`functions/src/telegram/webhook.ts`**
- Handles `/start`, `/help`, `/unsubscribe`.
- Links chat_id on `/start link_<uid>`.
- Replies with confirmation or help text.

**`functions/src/telegram/enqueue.ts`**
- Adds outbound messages to a queue for rate limiting.
- Drains via background worker:
`functions/src/telegram/worker.ts`
- Implements Telegram rate limits (≤30 msgs/sec global).

---

### App Integration

**Notify Facade**
- Replace `notify()` calls to route via Telegram:
```ts
import { sendTelegram } from "@/lib/telegram";
await sendTelegram({ chat_id, text });
Automatically fallback to in-app notifications if user not linked.

UI

Profile toggle: “Receive Telegram updates”

When enabled and linked, show username + manage link.

System notifications tab still shows in-app messages (unchanged).

Acceptance Criteria
✅ User can link Telegram from profile; chat_id stored.

✅ @EngageNaturalBot webhook functional and verified.

✅ Notifications sent for quiz passes, challenge milestones, and reward confirmations.

✅ Admin can broadcast new lessons/challenges via channel.

✅ All sends logged under notifications_meta/{uid}/telegram.

✅ Rate limits respected; failed messages retried.

✅ Works seamlessly with TON reward events and brand campaign triggers.

Future Enhancements
Add rich messages with inline buttons (“View Lesson”, “Join Challenge”).

Support multi-channel topics (Beauty, Supplements, CBD, etc.).

Add batch send from Brand Dashboard for campaign updates.

Enable Telegram Mini-App deep links for instant claim and wallet view.

