"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjk5OTdjNDBhODQzNzQxNTk0MGFjYzNmIiwiZW1haWwiOiJhZG1pbkBtb3ZlaW5zeW5jLmNvbSIsInJvbGUiOiJhZG1pbiJ9LCJpYXQiOjE3NzE2NjY1NDIsImV4cCI6MTc3MjI3MTM0Mn0.c0Aacfusbkhhb-6az6aGPpkXM5wdAsOiJboe8t7j67s"





**Part 1: Project Summary - What Have We Built?**

The Big Picture

We've built a Mobile Device Management (MDM) System for Moveinsync - think of it as a control tower for managing thousands of mobile devices running the Moveinsync app.



**Real-World Analogy**

Imagine you're the IT administrator for a company with 10,000 employees using a company app on their phones. You need to:



📱 Track which phones have which app version



🔄 Roll out updates without crashing everyone's phones



🚫 Prevent employees from using outdated, insecure versions



📊 Monitor the entire process in real-time



That's exactly what this system does!



**Key Features Breakdown**

**Feature	What It Does	Real-World Benefit**

Device Registry	Tracks every device's IMEI, OS, location, last seen	Know exactly what devices are out there

Version Management	Stores all app versions with metadata	Control which versions are available

Update Scheduling	Rolls out updates to specific regions/groups	No more "update all at once" crashes

Phased Rollouts	Updates devices in batches	If something breaks, only 5% are affected

Downgrade Prevention	Blocks attempts to install older versions	Security - can't go back to vulnerable versions

Real-time Monitoring	Live dashboard of update progress	See problems as they happen

Audit Trail	Logs every action taken	Compliance - prove what happened and who did it

Role-Based Access	Admins vs Managers vs Viewers	Security - not everyone can push updates





**Part 2: Data Flow - Where Does Data Come From?**

The Two-Way Street

text

┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐

│   Mobile App    │ ──────> │   Our Backend   │ ──────> │    MongoDB      │

│  (10,000 devices│   API    │   (Node.js)     │   Save   │   Database      │

└─────────────────┘         └─────────────────┘         └─────────────────┘

         ^                           │                           │

         │                           │                           │

         │                      ┌─────▼─────┐                     │

         │                      │  Dashboard│                     │

         └──────────────────────┤  (You!)   │ <───────────────────┘

            Update commands      └───────────┘      Display data



Data Sources Explained

Mobile Devices (The Real Data Source)



Every time a user opens the Moveinsync app, it calls our /api/devices/heartbeat endpoint



The device sends: IMEI, app version, OS, location, battery level



This is REAL DATA - not demo data



Admin Users (You!)



When you log in as admin, you can:



Upload new app versions



Create update schedules



Block compromised devices



These actions are saved to the database

