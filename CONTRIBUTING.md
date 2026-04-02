# Contributing

Thanks for your interest in JoeAmp. Contributions are welcome.

## Getting Started

```bash
git clone <your-fork>
cd winamp
npm install
npm run dev
```

## How to Contribute

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-thing`
3. Make your changes
4. Test in dev mode (`npm run dev`) and verify the build works (`CSC_IDENTITY_AUTO_DISCOVERY=false npm run build`)
5. Open a pull request with a clear description of what changed and why

## Guidelines

- Keep changes focused — one feature or fix per PR
- Match the existing code style (no TypeScript, plain JS, React functional components)
- If you change `electron/main.js` or `electron/preload.js`, test that the built `.app` still works, not just dev mode
- If you add a new audio format, add it to `AUDIO_EXTS` in `electron/main.js` and the dialog filter in `dialog:openFiles`

## Reporting Bugs

Open a GitHub issue with:
- What you did
- What you expected
- What actually happened
- macOS version and chip (Apple Silicon / Intel)
