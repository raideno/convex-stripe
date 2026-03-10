import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";

import { internal } from "./_generated/api";
import { query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password()],
  callbacks: {
    afterUserCreatedOrUpdated: async (context, args) => {
      const userId = args.userId;
      const email = args.profile.email;

      await context.scheduler.runAfter(0, internal.stripe.createCustomer, {
        entityId: userId,
        email: email,
      });
    },
  },
});

export const me = query({
  args: {},
  handler: async (context) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const user = await context.db
      .query("users")
      .filter((query) => query.eq(query.field("_id"), userId))
      .unique();

    if (!user) throw new Error("User not found");

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user._creationTime,
    };
  },
});
