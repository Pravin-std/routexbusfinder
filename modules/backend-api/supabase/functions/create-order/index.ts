import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, currency } = await req.json();

    let RAZORPAY_KEY_ID = (Deno.env.get("RAZORPAY_KEY_ID") || "").replace(/['"]/g, "").trim();
    let RAZORPAY_KEY_SECRET = (Deno.env.get("RAZORPAY_KEY_SECRET") || "").replace(/['"]/g, "").trim();

    if (RAZORPAY_KEY_ID.length !== 24) RAZORPAY_KEY_ID = "rzp_test_T3XUzXPBSj8GPV";
    if (RAZORPAY_KEY_SECRET.length !== 24) RAZORPAY_KEY_SECRET = "QTRPsaRoBKOmnTmHKvM8E8FG";

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency || "INR",
        receipt: `receipt_${Date.now()}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const debugInfo = `KeyID starts with: ${RAZORPAY_KEY_ID.substring(0, 5)}, Secret length: ${RAZORPAY_KEY_SECRET.length}`;
      throw new Error((data.error?.description || "Failed to create order") + " | " + debugInfo);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
