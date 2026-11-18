# Vitest Chromium shared-memory limit repro

On Linux, Vitest browser mode fails with `Browser connection was closed while running tests` once one Chromium page has run enough spec files. Vitest's workaround for this, which runs a GC between files, never fires here.

The cause is the Chromium leak from https://issues.chromium.org/issues/530892387:

1. Each `304` module response leaves a 2 MiB `/memfd:shared-memory-region` mapping in the renderer until the next V8 GC.
2. Chromium caps a process's mapped shared memory at 32 GiB.
3. Once the renderer reaches that cap, Chromium drops the page's websockets.

Vitest only collects when `/tmp` is low on space, but these buffers never touch `/tmp`.

## Run it

```sh
npm install
npx playwright install chromium
npm test
```

`npm test` generates 1,000 one-line modules and 100 spec files that each import all of them, then runs every file on one page (`--maxWorkers=1`). Each spec file revalidates the 1,000 modules as `304`s.

To watch the mappings grow by ~1,000 (2 GiB) per file, run `npm run watch-renderer` in a second terminal.

## Results

Measured on Linux aarch64 in Docker, with Node 24.22.3 and Playwright 1.64.1 (`chrome-headless-shell` 156.0.8078.4). `/tmp` had 800 GB free.

| Command | Runs | Result |
| --- | --- | --- |
| `npm test` | 3 | Every run dies after 17 of 100 files, at 27-29 GiB in the last one-second sample |
| `VITEST_CHROMIUM_GC_FORCE=1 npm test` | 2 | Same: dies after 17 files |
| `VITEST_CHROMIUM_GC_DISK_THRESHOLD_GB=100000 npm test` | 2 | All 100 files pass, peaking under 1 GiB |
