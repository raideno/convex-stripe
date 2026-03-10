import { httpRouter } from "convex/server";

import { auth } from "./auth";
import { stripe } from "./stripe";

const http = httpRouter();

auth.addHttpRoutes(http);
stripe.addHttpRoutes(http);

export default http;
