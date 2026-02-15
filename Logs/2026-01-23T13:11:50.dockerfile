2026-01-23T13:11:50.016302627Z [inf]  
2026-01-23T13:11:51.524560953Z [inf]  [35m[Region: us-east4][0m
2026-01-23T13:11:51.614190633Z [inf]  
2026-01-23T13:11:51.614257664Z [inf]  [38;2;125;86;243m╭─────────────────╮[0m
2026-01-23T13:11:51.614263885Z [inf]  [38;2;125;86;243m│[0m Railpack 0.17.1 [38;2;125;86;243m│[0m
2026-01-23T13:11:51.614268618Z [inf]  [38;2;125;86;243m╰─────────────────╯[0m
2026-01-23T13:11:51.614276622Z [inf]  
2026-01-23T13:11:51.614280190Z [inf]  [97m↳ Detected Node[0m
2026-01-23T13:11:51.614284560Z [inf]  [97m↳ Using pnpm package manager[0m
2026-01-23T13:11:51.614289290Z [inf]  [97m↳ Installing pnpm@9.15.2 with Corepack[0m
2026-01-23T13:11:51.614298957Z [inf]  
2026-01-23T13:11:51.614303863Z [inf]  [1mPackages[0m
2026-01-23T13:11:51.614309057Z [inf]  [38;5;238m──────────[0m
2026-01-23T13:11:51.614314291Z [inf]  [95mnode[0m  [38;5;238m│[0m  [96m22.22.0[0m  [38;5;238m│[0m  railpack default (22)
2026-01-23T13:11:51.614318855Z [inf]  [95mpnpm[0m  [38;5;238m│[0m  [96m9.15.2[0m   [38;5;238m│[0m  package.json > packageManager (9.15.2)
2026-01-23T13:11:51.614323546Z [inf]  
2026-01-23T13:11:51.614328031Z [inf]  [1mSteps[0m
2026-01-23T13:11:51.614332292Z [inf]  [38;5;238m──────────[0m
2026-01-23T13:11:51.614337244Z [inf]  [95m▸ install[0m
2026-01-23T13:11:51.614341449Z [inf]  [38;5;245m$[0m [1mnpm i -g corepack@latest && corepack enable && corepack prepare --activate[0m
2026-01-23T13:11:51.614346241Z [inf]  [38;5;245m$[0m [1mpnpm install --frozen-lockfile --prefer-offline[0m
2026-01-23T13:11:51.614350210Z [inf]  
2026-01-23T13:11:51.614364861Z [inf]  [95m▸ build[0m
2026-01-23T13:11:51.614367759Z [inf]  [38;5;245m$[0m [1mpnpm run build[0m
2026-01-23T13:11:51.614370972Z [inf]  
2026-01-23T13:11:51.614375707Z [inf]  [1mDeploy[0m
2026-01-23T13:11:51.614380007Z [inf]  [38;5;238m──────────[0m
2026-01-23T13:11:51.614384194Z [inf]  [38;5;245m$[0m [1mpnpm run start[0m
2026-01-23T13:11:51.614388598Z [inf]  
2026-01-23T13:11:51.614392842Z [inf]  
2026-01-23T13:11:51.616050856Z [inf]  Successfully prepared Railpack plan for build
2026-01-23T13:11:51.616097662Z [inf]  
2026-01-23T13:11:51.616104326Z [inf]  
2026-01-23T13:11:51.616585377Z [inf]  context: ttw2-fbUZ
2026-01-23T13:11:51.776339911Z [inf]  [internal] load build definition from railpack-plan.json
2026-01-23T13:11:51.776384340Z [inf]  [internal] load build definition from railpack-plan.json
2026-01-23T13:11:51.776398582Z [inf]  [internal] load build definition from railpack-plan.json
2026-01-23T13:11:51.776411266Z [inf]  [internal] load build definition from railpack-plan.json
2026-01-23T13:11:51.786010232Z [inf]  [internal] load build definition from railpack-plan.json
2026-01-23T13:11:51.787503151Z [inf]  resolve image config for docker-image://ghcr.io/railwayapp/railpack-frontend:v0.17.1
2026-01-23T13:11:51.822711498Z [inf]  resolve image config for docker-image://ghcr.io/railwayapp/railpack-frontend:v0.17.1
2026-01-23T13:11:51.921265469Z [inf]  load build definition from railpack-plan.json
2026-01-23T13:11:51.921440763Z [inf]  load build definition from railpack-plan.json
2026-01-23T13:11:51.921501880Z [inf]  load build definition from railpack-plan.json
2026-01-23T13:11:51.930666113Z [inf]  load build definition from railpack-plan.json
2026-01-23T13:11:52.137440931Z [inf]  mkdir -p /app/node_modules/.cache
2026-01-23T13:11:52.137560559Z [inf]  [railpack] merge $packages:apt:runtime, $packages:mise, $build, $build
2026-01-23T13:11:52.137575441Z [inf]  copy /opt/corepack
2026-01-23T13:11:52.137588590Z [inf]  copy /app
2026-01-23T13:11:52.137602257Z [inf]  copy /root/.cache
2026-01-23T13:11:52.137614012Z [inf]  copy /app/node_modules
2026-01-23T13:11:52.137623997Z [inf]  pnpm run build
2026-01-23T13:11:52.137640716Z [inf]  [railpack] secrets hash
2026-01-23T13:11:52.137649578Z [inf]  copy / /app
2026-01-23T13:11:52.137661287Z [inf]  pnpm install --frozen-lockfile --prefer-offline
2026-01-23T13:11:52.137670956Z [inf]  copy pnpm-lock.yaml
2026-01-23T13:11:52.137680300Z [inf]  copy package.json
2026-01-23T13:11:52.137712005Z [inf]  loading .
2026-01-23T13:11:52.137723910Z [inf]  [railpack] secrets hash
2026-01-23T13:11:52.137739378Z [inf]  [railpack] secrets hash
2026-01-23T13:11:52.138042475Z [inf]  install apt packages: libatomic1
2026-01-23T13:11:52.138060069Z [inf]  install mise packages: node
2026-01-23T13:11:52.138074667Z [inf]  loading .
2026-01-23T13:11:52.138086485Z [inf]  [railpack] secrets hash
2026-01-23T13:11:52.156503762Z [inf]  [railpack] secrets hash
2026-01-23T13:11:52.232250432Z [inf]  loading .
2026-01-23T13:11:52.271732104Z [inf]  Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]

2026-01-23T13:11:52.280123934Z [inf]  Get:2 http://deb.debian.org/debian bookworm-updates InRelease [55.4 kB]

2026-01-23T13:11:52.280141558Z [inf]  Get:3 http://deb.debian.org/debian-security bookworm-security InRelease [48.0 kB]

2026-01-23T13:11:52.335650333Z [inf]  Get:4 http://deb.debian.org/debian bookworm/main amd64 Packages [8792 kB]

2026-01-23T13:11:52.391216404Z [inf]  Get:5 http://deb.debian.org/debian bookworm-updates/main amd64 Packages [6924 B]

2026-01-23T13:11:52.42076535Z [inf]  Get:6 http://deb.debian.org/debian-security bookworm-security/main amd64 Packages [292 kB]

2026-01-23T13:11:52.50454068Z [inf]  mise node@22.22.0    install

2026-01-23T13:11:52.505451076Z [inf]  mise node@22.22.0    download node-v22.22.0-linux-x64.tar.gz

2026-01-23T13:11:53.058984401Z [inf]  mise node@22.22.0    extract node-v22.22.0-linux-x64.tar.gz

2026-01-23T13:11:53.324752754Z [inf]  Fetched 9346 kB in 1s (8762 kB/s)
Reading package lists...
2026-01-23T13:11:53.776297337Z [inf]  

2026-01-23T13:11:53.793141414Z [inf]  Reading package lists...
2026-01-23T13:11:53.971598464Z [inf]  mise node@22.22.0    node -v

2026-01-23T13:11:53.975689305Z [inf]  mise node@22.22.0    v22.22.0

2026-01-23T13:11:53.976556027Z [inf]  mise node@22.22.0    npm -v

2026-01-23T13:11:54.066325358Z [inf]  mise node@22.22.0    10.9.4

2026-01-23T13:11:54.074393368Z [inf]  mise node@22.22.0    enable corepack shims

2026-01-23T13:11:54.193981182Z [inf]  mise node@22.22.0  ✓ installed

2026-01-23T13:11:54.245081436Z [inf]  

2026-01-23T13:11:54.256556089Z [inf]  Building dependency tree...
2026-01-23T13:11:54.264957309Z [inf]  install mise packages: node
2026-01-23T13:11:54.265957023Z [inf]  copy package.json
2026-01-23T13:11:54.309157457Z [inf]  copy package.json
2026-01-23T13:11:54.309987388Z [inf]  npm i -g corepack@latest && corepack enable && corepack prepare --activate
2026-01-23T13:11:54.367889155Z [inf]  
Reading state information...
2026-01-23T13:11:54.367956423Z [inf]  

2026-01-23T13:11:54.467220017Z [inf]  npm warn config production Use `--omit=dev` instead.

2026-01-23T13:11:54.48949852Z [inf]  The following NEW packages will be installed:

2026-01-23T13:11:54.490013946Z [inf]    libatomic1

2026-01-23T13:11:54.507406584Z [inf]  0 upgraded, 1 newly installed, 0 to remove and 12 not upgraded.
Need to get 9376 B of archives.
After this operation, 46.1 kB of additional disk space will be used.
Get:1 http://deb.debian.org/debian bookworm/main amd64 libatomic1 amd64 12.2.0-14+deb12u1 [9376 B]

2026-01-23T13:11:54.588739607Z [inf]  debconf: delaying package configuration, since apt-utils is not installed

2026-01-23T13:11:54.631602337Z [inf]  Fetched 9376 B in 0s (697 kB/s)

2026-01-23T13:11:54.645155442Z [inf]  Selecting previously unselected package libatomic1:amd64.
(Reading database ... 
2026-01-23T13:11:54.646051596Z [inf]  (Reading database ... 5%
(Reading database ... 10%
(Reading database ... 15%
(Reading database ... 20%
(Reading database ... 25%
(Reading database ... 30%
(Reading database ... 35%
(Reading database ... 40%
(Reading database ... 45%
(Reading database ... 50%
(Reading database ... 55%
(Reading database ... 60%
(Reading database ... 65%
(Reading database ... 70%
2026-01-23T13:11:54.647871145Z [inf]  (Reading database ... 75%
2026-01-23T13:11:54.64828897Z [inf]  (Reading database ... 80%
2026-01-23T13:11:54.648500672Z [inf]  (Reading database ... 85%
2026-01-23T13:11:54.648749618Z [inf]  (Reading database ... 90%
2026-01-23T13:11:54.64886029Z [inf]  (Reading database ... 95%
2026-01-23T13:11:54.649690767Z [inf]  (Reading database ... 100%
(Reading database ... 6622 files and directories currently installed.)

2026-01-23T13:11:54.650080525Z [inf]  Preparing to unpack .../libatomic1_12.2.0-14+deb12u1_amd64.deb ...

2026-01-23T13:11:54.652502648Z [inf]  Unpacking libatomic1:amd64 (12.2.0-14+deb12u1) ...

2026-01-23T13:11:54.668880705Z [inf]  Setting up libatomic1:amd64 (12.2.0-14+deb12u1) ...

2026-01-23T13:11:54.671841692Z [inf]  Processing triggers for libc-bin (2.36-9+deb12u13) ...

2026-01-23T13:11:54.709664014Z [inf]  install apt packages: libatomic1
2026-01-23T13:11:54.959748026Z [inf]  
changed 1 package in 515ms

2026-01-23T13:11:54.993940879Z [inf]  Reshimming mise 22.22.0...

2026-01-23T13:11:55.15518944Z [inf]  Preparing pnpm@9.15.2 for immediate activation...

2026-01-23T13:11:55.266396057Z [inf]  copy /mise/shims
2026-01-23T13:11:55.266463960Z [inf]  copy /mise/installs
2026-01-23T13:11:56.064257439Z [inf]  copy /mise/installs
2026-01-23T13:11:56.065260111Z [inf]  copy /usr/local/bin/mise
2026-01-23T13:11:56.102408063Z [inf]  npm i -g corepack@latest && corepack enable && corepack prepare --activate
2026-01-23T13:11:56.103515225Z [inf]  mkdir -p /app/node_modules/.cache
2026-01-23T13:11:56.152213599Z [inf]  copy /usr/local/bin/mise
2026-01-23T13:11:56.153151586Z [inf]  copy /etc/mise/config.toml
2026-01-23T13:11:56.163601405Z [inf]  copy /etc/mise/config.toml
2026-01-23T13:11:56.164551043Z [inf]  copy /root/.local/state/mise
2026-01-23T13:11:56.176425229Z [inf]  copy /root/.local/state/mise
2026-01-23T13:11:56.247873479Z [inf]  mkdir -p /app/node_modules/.cache
2026-01-23T13:11:56.248771869Z [inf]  copy package.json
2026-01-23T13:11:56.261132098Z [inf]  copy package.json
2026-01-23T13:11:56.262226568Z [inf]  copy pnpm-lock.yaml
2026-01-23T13:11:56.273324486Z [inf]  copy pnpm-lock.yaml
2026-01-23T13:11:56.274627594Z [inf]  pnpm install --frozen-lockfile --prefer-offline
2026-01-23T13:11:56.862555473Z [inf]  Lockfile is up to date, resolution step is skipped

2026-01-23T13:11:56.914228389Z [inf]  Progress: resolved 1, reused 0, downloaded 0, added 0

2026-01-23T13:11:57.015296987Z [inf]  Packages: +724
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

2026-01-23T13:11:57.919111583Z [inf]  Progress: resolved 724, reused 0, downloaded 286, added 278

2026-01-23T13:11:58.918918013Z [inf]  Progress: resolved 724, reused 0, downloaded 714, added 713

2026-01-23T13:11:59.91895025Z [inf]  Progress: resolved 724, reused 0, downloaded 721, added 721

2026-01-23T13:12:00.919809645Z [inf]  Progress: resolved 724, reused 0, downloaded 722, added 721

2026-01-23T13:12:01.920374509Z [inf]  Progress: resolved 724, reused 0, downloaded 723, added 723

2026-01-23T13:12:02.204615142Z [inf]  Progress: resolved 724, reused 0, downloaded 724, added 724, done

2026-01-23T13:12:02.388044484Z [inf]  .../node_modules/protobufjs postinstall$ node scripts/postinstall

2026-01-23T13:12:02.388653825Z [inf]  .../core-js@3.47.0/node_modules/core-js postinstall$ node -e "try{require('./postinstall')}catch(e){}"

2026-01-23T13:12:02.506889032Z [inf]  .../node_modules/protobufjs postinstall: Done

2026-01-23T13:12:02.511674803Z [inf]  .../node_modules/@sentry/cli postinstall$ node ./scripts/install.js

2026-01-23T13:12:02.51216112Z [inf]  .../node_modules/unrs-resolver postinstall$ napi-postinstall unrs-resolver 1.11.1 check

2026-01-23T13:12:02.566586699Z [inf]  .../esbuild@0.27.2/node_modules/esbuild postinstall$ node install.js

2026-01-23T13:12:02.686952007Z [inf]  .../core-js@3.47.0/node_modules/core-js postinstall: Done

2026-01-23T13:12:02.689162464Z [inf]  .../node_modules/unrs-resolver postinstall: Done

2026-01-23T13:12:02.689328465Z [inf]  .../node_modules/@sentry/cli postinstall: Done

2026-01-23T13:12:02.72195054Z [inf]  .../esbuild@0.27.2/node_modules/esbuild postinstall: Done

2026-01-23T13:12:03.044733277Z [inf]  
dependencies:
+ @radix-ui/react-accordion 1.2.12
+ @radix-ui/react-alert-dialog 1.1.15
+ @radix-ui/react-checkbox 1.3.3
+ @radix-ui/react-collapsible 1.1.12
+ @radix-ui/react-dialog 1.1.15
+ @radix-ui/react-dropdown-menu 2.1.16
+ @radix-ui/react-label 2.1.8
+ @radix-ui/react-progress 1.1.8
+ @radix-ui/react-radio-group 1.3.8
+ @radix-ui/react-select 2.2.6
+ @radix-ui/react-slider 1.3.6
+ @radix-ui/react-slot 1.2.4
+ @radix-ui/react-switch 1.2.6
+ @radix-ui/react-toast 1.2.15
+ @sentry/nextjs 10.36.0
+ @supabase/ssr 0.8.0
+ @supabase/supabase-js 2.90.1
+ @upstash/ratelimit 2.0.8
+ @upstash/redis 1.36.1
+ class-variance-authority 0.7.1
+ clsx 2.1.1
+ date-fns 4.1.0
+ lucide-react 0.469.0
+ next 14.2.35
+ next-themes 0.4.6
+ node-cron 4.2.1
+ posthog-js 1.328.0
+ react 18.3.1
+ react-dom 18.3.1
+ recharts 3.7.0
+ resend 6.7.0
+ sonner 2.0.7
+ stripe 20.2.0
+ tailwind-merge 2.6.0
+ tailwindcss-animate 1.0.7
+ zod 4.3.5

devDependencies:
+ @playwright/test 1.57.0
+ @types/node 22.19.7
+ @types/node-cron 3.0.11
+ @types/react 18.3.27
+ @types/react-dom 18.3.7
+ autoprefixer 10.4.23
+ eslint 8.57.1
+ eslint-config-next 14.2.35
+ eslint-config-prettier 9.1.2
+ postcss 8.5.6
+ prettier 3.8.0
+ prettier-plugin-tailwindcss 0.6.14
+ tailwindcss 3.4.19
+ tsx 4.21.0
+ typescript 5.9.3


2026-01-23T13:12:03.064396932Z [inf]  Done in 6.5s

2026-01-23T13:12:04.156538734Z [inf]  pnpm install --frozen-lockfile --prefer-offline
2026-01-23T13:12:04.157771447Z [inf]  copy / /app
2026-01-23T13:12:04.514806090Z [inf]  copy / /app
2026-01-23T13:12:04.516299473Z [inf]  pnpm run build
2026-01-23T13:12:06.005152846Z [inf]  
> modeloptix@0.1.0 build /app
> next build


2026-01-23T13:12:06.833923504Z [inf]  [@sentry/nextjs] DEPRECATION WARNING: disableLogger is deprecated and will be removed in a future version. Use webpack.treeshake.removeDebugLogging instead.

2026-01-23T13:12:06.834107398Z [inf]  [@sentry/nextjs] DEPRECATION WARNING: automaticVercelMonitors is deprecated and will be removed in a future version. Use webpack.automaticVercelMonitors instead.

2026-01-23T13:12:06.897893307Z [inf]    ▲ Next.js 14.2.35
  - Experiments (use with caution):
    · instrumentationHook

2026-01-23T13:12:06.897956886Z [inf]  

2026-01-23T13:12:06.9098989Z [inf]     Creating an optimized production build ...

2026-01-23T13:12:07.287735315Z [inf]  [@sentry/nextjs] It appears you've configured a `sentry.server.config.ts` file. Please ensure to put this file's content into the `register()` function of a Next.js instrumentation file instead. To ensure correct functionality of the SDK, `Sentry.init` must be called inside of an instrumentation file. Learn more about setting up an instrumentation file in Next.js: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation. You can safely delete the `sentry.server.config.ts` file afterward.

2026-01-23T13:12:07.434576521Z [inf]  [@sentry/nextjs] It appears you've configured a `sentry.edge.config.ts` file. Please ensure to put this file's content into the `register()` function of a Next.js instrumentation file instead. To ensure correct functionality of the SDK, `Sentry.init` must be called inside of an instrumentation file. Learn more about setting up an instrumentation file in Next.js: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation. You can safely delete the `sentry.edge.config.ts` file afterward.

2026-01-23T13:12:07.436470888Z [inf]  [@sentry/nextjs] DEPRECATION WARNING: It is recommended renaming your `sentry.client.config.ts` file, or moving its content to `instrumentation-client.ts`. When using Turbopack `sentry.client.config.ts` will no longer work. Read more about the `instrumentation-client.ts` file: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

2026-01-23T13:12:11.013653793Z [inf]  docker-image://ghcr.io/railwayapp/railpack-builder:latest
2026-01-23T13:12:11.013670703Z [inf]  docker-image://ghcr.io/railwayapp/railpack-builder:latest
2026-01-23T13:12:29.413076832Z [inf]  <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (200kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)

2026-01-23T13:12:29.442066892Z [inf]  <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (131kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)

2026-01-23T13:12:29.443326862Z [inf]  <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (135kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)

2026-01-23T13:12:29.443933959Z [inf]  <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (139kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)

2026-01-23T13:12:29.54767412Z [inf]  Failed to compile.

./src/lib/jobs/index.ts:30:1
Module not found: Can't resolve './generate-opportunities'
[0m [90m 28 |[39m [36mexport[39m type { [33mSyncBenchmarksResult[39m } [36mfrom[39m [32m'./sync-benchmarks'[39m[33m;[39m[0m
[0m [90m 29 |[39m[0m
[0m[31m[1m>[22m[39m[90m 30 |[39m [36mexport[39m { generateOpportunities } [36mfrom[39m [32m'./generate-opportunities'[39m[33m;[39m[0m
[0m [90m    |[39m [31m[1m^[22m[39m[0m
[0m [90m 31 |[39m [36mexport[39m type { [33mGenerateOpportunitiesResult[39m } [36mfrom[39m [32m'./generate-opportunities'[39m[33m;[39m[0m
[0m [90m 32 |[39m[0m
[0m [90m 33 |[39m [36mexport[39m { sendTrialReminders } [36mfrom[39m [32m'./trial-reminder'[39m[33m;[39m[0m

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./src/instrumentation.ts

2026-01-23T13:12:29.547693264Z [inf]  

2026-01-23T13:12:29.548231574Z [inf]  

2026-01-23T13:12:29.548245063Z [inf]  > Build failed because of webpack errors

2026-01-23T13:12:29.659164805Z [inf]   ELIFECYCLE  Command failed with exit code 1.

2026-01-23T13:12:29.818628005Z [err]  pnpm run build
2026-01-23T13:12:29.836897251Z [err]  ERROR: failed to build: failed to solve: process "pnpm run build" did not complete successfully: exit code: 1
