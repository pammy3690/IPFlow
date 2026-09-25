import { createClient } from "npm:@supabase/supabase-js@2";

const iso = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Saved = subscribed. Nothing saved means nothing to do.
  const { data: subs, error: subsError } = await supabase
    .from("saved_patents")
    .select("user_id, patent_id");
  if (subsError) return new Response(subsError.message, { status: 500 });
  if (!subs?.length) return new Response(JSON.stringify({ sent: 0, reason: "no saved patents" }));

  const today = new Date();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() + 1);

  const patentIds = [...new Set(subs.map((s) => s.patent_id))];
  const { data: renewals, error: renError } = await supabase
    .from("patent_renewals_next_12_months")
    .select("patent_id, due_date")
    .in("patent_id", patentIds)
    .is("fee_paid_date", null)
    .gte("due_date", iso(today))
    .lte("due_date", iso(cutoff));
  if (renError) return new Response(renError.message, { status: 500 });
  if (!renewals?.length) return new Response(JSON.stringify({ sent: 0 }));

  const { data: patents } = await supabase
    .from("patents")
    .select("patent_id, title")
    .in("patent_id", [...new Set(renewals.map((r) => r.patent_id))]);
  const titles = new Map(patents?.map((p) => [p.patent_id, p.title]));

  const { data: sentRows } = await supabase
    .from("patent_reminders_sent")
    .select("user_id, patent_id, due_date");
  const sentKeys = new Set(
    sentRows?.map((r) => `${r.user_id}|${r.patent_id}|${r.due_date}`),
  );

  const userCache = new Map<string, { email?: string; name?: string } | null>();
  async function getUser(id: string) {
    if (userCache.has(id)) return userCache.get(id)!;
    const { data } = await supabase.auth.admin.getUserById(id);
    const u = data?.user;
    const val = u?.email && u.email_confirmed_at
      ? { email: u.email, name: u.user_metadata?.name as string | undefined }
      : null;
    userCache.set(id, val);
    return val;
  }

  let sent = 0;
  for (const sub of subs) {
    for (const ren of renewals.filter((r) => r.patent_id === sub.patent_id)) {
      const key = `${sub.user_id}|${ren.patent_id}|${ren.due_date}`;
      if (sentKeys.has(key)) continue;

      const user = await getUser(sub.user_id);
      if (!user) continue;

      const title = titles.get(ren.patent_id) ?? `Patent ${ren.patent_id}`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "IPFlow <onboarding@resend.dev>",
          to: user.email,
          subject: `Patent ${ren.patent_id}: renewal due ${ren.due_date}`,
          html: `<p>Hi${user.name ? ` ${user.name}` : ""},</p> <br></br>
                 <p><strong>${title}</strong> has a renewal fee due on ${ren.due_date}.</p> <br></br>
                 <p>You're getting this because you saved this patent. Unsave it in your dashboard to stop reminders.</p> <br></br>
                 <p> Warm regards, </p>
                 <p> IPFlow </p>`,
        }),
      });

      if (res.ok) {
        await supabase.from("patent_reminders_sent").insert({
          user_id: sub.user_id,
          patent_id: ren.patent_id,
          due_date: ren.due_date,
        });
        sent++;
      } else {
        console.error("Email failed:", res.status, await res.text());
      }
    }
  }

  return new Response(JSON.stringify({ sent }));
});
