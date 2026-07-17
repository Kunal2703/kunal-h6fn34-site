// ALB liveness target. Kept trivial so it stays green even if the DB is briefly
// unreachable — the ALB should not cycle tasks on a transient DB blip.
export const GET = () => new Response("OK", { status: 200 });
