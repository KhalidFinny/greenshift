import { createFactory } from "hono/factory";
import type { ApiEnv } from "../../env";

/**
 * Typed handler factory shared by every admin feature router.
 */
export const factory = createFactory<ApiEnv>();
