# Recordings

A small web app for recording, organising and playing audio on your phone. It installs to the home screen and works offline. Recordings are stored only on the device. Nothing is uploaded.

## Put it online (GitHub Pages, free)

1. Create a free account at github.com.
2. Click **+ → New repository**. Name it e.g. `recordings`, set it to **Public**, and click **Create repository**.
3. On the new repository page, click **uploading an existing file**. Drag in **all the files and the `icons` folder** from this zip, then click **Commit changes**.
4. Go to **Settings → Pages**. Under *Branch*, choose `main` and `/ (root)`, then click **Save**.
5. After a minute or two the app is live at `https://YOUR-USERNAME.github.io/recordings/`.

## Install on your Pixel

1. Open that address in **Chrome** on the phone.
2. Tap **⋮ → Add to Home screen → Install**.
3. Open it from the home screen and allow the microphone the first time you record.

Once it's installed, the app also appears in Android's **Share** menu for audio files, so you can send recordings straight in from Google Recorder, Files or WhatsApp.

## Updating the app

After changing any file, open `sw.js` and bump `CACHE = 'recordings-v1'` to `v2`, `v3` and so on, then upload again. Phones pick up the new version the next time the app is opened (sometimes it takes two opens).

## Good to know

- Recordings live in Chrome's storage for this site. **Clearing Chrome's site data or uninstalling the app deletes them.** Use **⋮ → Share or save a copy** on a recording to back it up.
- New recordings are saved as `.webm` (Opus) files. They play in Chrome, VLC and most modern players.
