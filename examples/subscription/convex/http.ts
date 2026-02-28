import { httpRouter } from "convex/server";

import { auth } from "./auth";
import { stripe } from "./stripe";

const http = httpRouter();

auth.addHttpRoutes(http);
stripe.addHttpRoutes(http);

// // https://amicable-marmot-910.convex.site/stripe/webhook
// http.route({
//   path: stripe.http.webhook.path,
//   method: stripe.http.webhook.method as RoutableMethod,
//   handler: httpAction(async (context, request) => {
//     return await stripe.http.webhook.handler(context, request);
//   }),
// });

// // https://amicable-marmot-910.convex.site/stripe/return/*
// http.route({
//   pathPrefix: stripe.http.redirect.pathPrefix,
//   method: stripe.http.redirect.method as RoutableMethod,
//   handler: httpAction(async (context, request) => {
//     return await stripe.http.redirect.handler(context, request);
//   }),
// });

export default http;
