import "dotenv/config";
import { client } from "../lib/index.js";

(async () => {
  await client.listen(3003);
})();
