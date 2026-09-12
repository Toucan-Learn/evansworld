# Evan’s Universe workflow

- Keep the existing galaxy background and sky settings when adding or switching sections.
- Games has one compact Bag Bashers launcher. Mike Tyson and Chicken Boss are separate campaigns inside that game.
- Keep user-facing explanations short.
- The user wants requested changes published automatically after validation: run `pnpm test` and `pnpm build:pages`, commit source and generated `docs/` together, then push to `main` at `https://github.com/Toucan-Learn/evansworld.git` and verify the GitHub Pages deployment.
- Follow a later request to keep an update preview-only. Do not publish failed checks, overwrite remote changes, change the audience, or bypass access requirements.
- The public site is https://toucan-learn.github.io/evansworld/ and Pages serves `main:/docs`.
