import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Basic email validation
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Insert into Supabase
    const { error } = await supabase
      .from("waitlist_signups")
      .insert([{ email: normalizedEmail }]);

    if (error) {
      // Handle duplicate email
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You're already on the waitlist!" },
          { status: 409 }
        );
      }
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    // Send confirmation email
    try {
      await resend.emails.send({
        from: "ModelOptix <onboarding@resend.dev>",
        to: normalizedEmail,
        subject: "You're on the ModelOptix waitlist",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1A2B4C; font-size: 24px; margin-bottom: 24px;">You're on the list.</h1>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
              Thanks for joining the ModelOptix waitlist. We're building the independent AI model advisor that helps you stop overpaying for AI.
            </p>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
              No investors. No partners. No hidden agenda. Just honest recommendations for your LLM stack.
            </p>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              We'll be in touch when we're ready to show you what we've built.
            </p>
            <p style="color: #6B7280; font-size: 14px;">
              — The ModelOptix Team
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
            <p style="color: #9CA3AF; font-size: 12px;">
              ModelOptix · Independent truth in AI
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // Log but don't fail the signup if email fails
      console.error("Email send error:", emailError);
    }

    return NextResponse.json(
      { message: "Successfully joined the waitlist!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
