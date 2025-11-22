EngageNatural Pre-Pilot Architecture & Development Plan
Phased Blueprint Based on Developer Recommendations

Version: November 2025
Owner: Liza Boone
Status: Active

1. Purpose

This document outlines the practical development strategy for EngageNatural from now through the first live pilot (Rescue Remedy). It incorporates the recommendations from the developer review but adapts them into a lean, efficient plan that avoids premature complexity until actual customers and usage data exist.

This plan preserves long-term architecture goals (Node API, MongoDB, event-based notifications, RBAC) while prioritizing speed, simplicity, and rapid iteration.

2. Why We Are NOT Doing a Full Rebuild Now

The developer’s PDF recommended:

Full MERN rewrite

Custom JWT auth

Cloudinary migration

Full RBAC overhaul

Audit logs, feature flags, microservices

Complete API rearchitecture

This would be correct after revenue, but at the current stage—no clients, no public launch—it would be:

slow

expensive

brittle

unnecessary

and risky

A rebuild now would lock in architecture before gathering real product insight from brands and staff.

The right move is a phased hybrid approach.

3. High-Level Strategy
Keep for now:

Firebase Auth (identity, reset, verification)

Firestore for small/noncritical data

Your existing React/Tailwind/TSX shell and layouts

Add incrementally:

MongoDB Atlas for new modules

Node/Express API layer (sidecar architecture)

Event-based notifications (Telegram first, push later)

TON reward ledger (no auto payout yet)

UPC lookup (v1: manual entry search)

Delay until after first client:

Clearinghouse coupon integration

Full Mongo rewrite and migration

Custom JWT + session refresh system

Cloudinary migration

Audit logs and multi-tenant RBAC

Production-grade performance tuning

This ensures speed and minimizes unnecessary cost.

4. Phase-by-Phase Roadmap
⭐ Phase 0 — Pre-Pilot Essentials (Now → Rescue Pilot)

Goal: A working pilot-ready environment to test with real staff and a real brand.

Deliverables

Staff verification (photo/GPS/store code)

Community feed (What’s Good + Pro Feed)

Lessons, Challenges, Templates (Phase 8.9)

Brand Content Manager shell (TSX)

Admin basic RBAC (view/edit roles)

UPC Lookup v1 (manual entry)

Sampling “lite” (no clearinghouse)

Telegram Bot (notifications)

TON reward ledger (no payout)

Node/Express API for new modules

MongoDB for notifications, sampling, UPC lookups

Notes

No full rearchitecture.
No clearinghouse yet.
No Cloudinary yet.
This phase is the functional MVP.

⭐ Phase 1 — Pilot Execution (Rescue Remedy)

Goal: Validate features with actual retail staff.

Deliverables

Staff engagement analytics

Brand dashboard improvements

Additional Telegram events (training completed, sample redeemed)

Limited TON rewards (manual payouts as needed)

MongoDB migrations for high-traffic modules (notifications, sampling)

Bugfixes from pilot feedback

Notes

Still no clearinghouse integration.
Still no enterprise audit/auth rebuild.
Focus is on learning + proving value.

⭐ Phase 2 — First Paying Client (Post-Pilot)

Goal: Harden the backend and UX based on pilot results.

Deliverables

Full Mongo migration

Node/Express API replaces Firebase calls

Fine-grained RBAC + permissions

Brand plan-based feature flags

Cloudinary migration (if needed)

Clearinghouse coupon integration

TON automated payouts (post-legal review)

Audit logs + observability

Notes

This is the “production-grade” version.
Not needed before first revenue.

5. Architectural Principles

AI-first development: UI, TSX components, API stubs, layouts generated via Factory + GPT.

Sidecar backend: Node/Express handles new modules while Firestore remains for legacy until migration is complete.

Event-driven notifications: MongoDB-triggered events → Telegram → in-app notifications.

Security-first simplification: Firebase Auth handles identity; Node verifies Firebase ID tokens as JWT.

Iterate → observe → harden: no feature is hardened until tested with real staff/brands.

6. What We Are Explicitly Delaying

The following items from the developer PDF will be implemented after the pilot, not before:

Full custom JWT password flows

Centralized media storage (Cloudinary)

Multi-module audit log system

Global caching layer

Complete API rewrite

Clearinghouse-integrated coupon redemption

Multi-tenant enterprise permissions

Sentry/log aggregation stack

These add cost and complexity without delivering pre-pilot value.

7. Summary

EngageNatural moves forward with a lean, fast, AI-powered MVP, not a full enterprise rebuild.
The system will be validated in a live pilot before committing to full rearchitecture.

This approach:

preserves speed,

minimizes cost,

enables rapid iteration,

and ensures decisions are made with real user insight.

This is the correct approach for your current stage.