# 🚀 How to Deploy Dharshii's Room (Like RuuSpace)

## What you need
- VS Code installed
- Node.js installed (download from nodejs.org)
- A GitHub account
- A Render account (render.com) — for the backend (FREE)
- A Vercel account (vercel.com) — for the frontend (FREE)

---

## STEP 1 — Set up the project in VS Code

1. Create a folder called `dharshii-room` on your Desktop
2. Inside it, create two folders: `client` and `server`
3. Copy all the files from this project into their folders
4. Open the `dharshii-room` folder in VS Code

---

## STEP 2 — Deploy the BACKEND on Render

1. Go to **render.com** → Sign up / Log in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub → upload your `server` folder as a repo
   - Or use Render's manual deploy by uploading the server files
4. Settings:
   - **Name:** dharshii-room-server
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Plan:** Free
5. Click **"Create Web Service"**
6. Wait ~2 mins → you'll get a URL like:
   `https://dharshii-room-server.onrender.com`
7. **Copy this URL** — you need it for Step 3!

---

## STEP 3 — Set the API URL in the frontend

1. In your `client` folder, create a file called `.env`
2. Add this line (replace with YOUR Render URL):
   ```
   VITE_API_URL=https://dharshii-room-server.onrender.com
   ```

---

## STEP 4 — Deploy the FRONTEND on Vercel

1. Go to **vercel.com** → Sign up / Log in
2. Click **"New Project"**
3. Upload / connect your `client` folder
4. Settings:
   - **Framework:** Vite
   - **Root Directory:** client
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: `https://dharshii-room-server.onrender.com`
6. Click **"Deploy"**
7. You'll get a URL like:
   `https://dharshii-room.vercel.app` ✨

---

## STEP 5 — How to use it with friends!

### YOU (Dharshii):
1. Open your Vercel link
2. Enter YOUR name + set a password (e.g. `bestiesonly`)
3. Click **"Create My Room"**
4. You'll see a **Room Code** (like `AB12XY`)
5. Share 2 things with your friends:
   - 🔗 The link: `https://dharshii-room.vercel.app`
   - 🔑 Room Code: `AB12XY`
   - 🔐 Password: `bestiesonly`

### FRIENDS:
1. Open the link you shared
2. Enter their name
3. Enter the Room Code
4. Enter the Password
5. They're IN your chat! 💜

---

## 📌 Important Notes

- The room stays alive as long as people are in it
- When everyone leaves, the room auto-deletes (no database)
- To make a new room, just refresh and create again
- The free Render server sleeps after 15 mins of no traffic
  (first load might take 30 seconds to wake up — that's normal!)

---

## 🆘 If something doesn't work

- Make sure your `.env` file has the correct Render URL
- Make sure both Render and Vercel are deployed successfully
- Check the Render logs for any errors
- The server URL must NOT have a `/` at the end

---

Happy chatting Dharshii! 💜👑
