/**
 * Load .env with override so values in the file win over stale shell vars.
 * Must be required before any other local config modules.
 */
require('dotenv').config({ override: true });
