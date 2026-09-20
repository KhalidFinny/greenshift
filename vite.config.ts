import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// Workerd lazily boots the SSR isolate and evaluates the whole app graph on
// the first request (~5s). Fire one render at startup so the first real
// request hits a warm isolate instead of paying that cost.
function warmSsrOnBoot(): Plugin {
	return {
		name: "greenshift:warm-ssr",
		apply: "serve",
		configureServer(server) {
			server.httpServer?.once("listening", () => {
				const { port } = server.config.server;
				if (!port) return;
				const started = Date.now();
				const warm = (attempt: number) => {
					fetch(`http://localhost:${port}/`)
						.catch(() => {
							if (attempt < 3) setTimeout(() => warm(attempt + 1), 1000);
						})
						.finally(() => {
							if (attempt === 0) {
								console.log(`SSR warmed in ${Date.now() - started}ms`);
							}
						});
				};
				setTimeout(() => warm(0), 300);
			});
		},
	};
}

const config = defineConfig({
	resolve: { tsconfigPaths: true, dedupe: ["lucide-react"] },
	server: {
		// Vite binds `localhost`, which resolves to ::1 here, so a readiness probe
		// against 127.0.0.1 is refused while http://localhost:3000 answers fine.
		// Point probes at localhost (or pass --host 127.0.0.1) before reading a
		// start as a failure.
		//
		// Pre-transform the app graph at boot so the first page load doesn't
		// pay the on-demand compile waterfall (~6s on cold start). The SSR
		// render path imports the route graph via TanStack Start's generated
		// entry, so warm it for both environments.
		warmup: {
			clientFiles: ["src/router.tsx", "src/routes/__root.tsx"],
			ssrFiles: ["src/server.ts", "src/router.tsx", "src/routes/__root.tsx"],
		},
	},
	ssr: {
		// Pre-bundle heavy UI deps so workerd evaluates a few chunks instead of
		// hundreds of unminified modules on first render.
		optimizeDeps: {
			include: ["react-aria-components", "@hugeicons/react", "lucide-react"],
		},
	},
	plugins: [
		devtools(),
		// Workers AI has no local emulation, so the plugin proxies that binding to
		// Cloudflare by default, and starting the proxy is an OAuth round-trip:
		// when the browser prompt is not answered in time the whole dev server
		// exits. Dev therefore runs local, where the review reading falls back to
		// the composed one (apps/api/src/modules/business/review/analyst.ts), and
		// the proxy is opt-in for when the real model is wanted:
		//   CLOUDFLARE_VITE_REMOTE_BINDINGS=true bun run dev
		cloudflare({
			viteEnvironment: { name: "ssr" },
			remoteBindings: process.env.CLOUDFLARE_VITE_REMOTE_BINDINGS === "true",
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		warmSsrOnBoot(),
	],
});

export default config;
