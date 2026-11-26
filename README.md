# spiky.team

The team landing page published at [spiky.team](https://spiky.team).

GitHub Pages builds this repository itself: `.github/workflows/publish.yml`
takes `spiky/` from [SpikyMC-Sites](../SpikyMC-Sites), where the page is
edited, and pushes it onto the `gh-pages` branch Pages serves. A push to `main`
here (which only happens when the workflow changes) triggers the same build.
