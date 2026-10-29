/**
 * Production email delivery client for transactional auth notifications.
 * Uses native fetch to call transactional email providers (Resend API) without
 * heavy runtime dependencies, and provides developer preview logging when keys are unset.
 */

export interface SendEmailPayload {
  to: string
  subject: string
  html: string
  text: string
}

export interface PasswordResetEmailOptions {
  to: string
  resetUrl: string
  lang?: string
}

export interface VerificationEmailOptions {
  to: string
  verifyUrl: string
  lang?: string
}

export function isEmailConfigured(env = process.env): boolean {
  return Boolean(env.RESEND_API_KEY)
}

/**
 * Dispatches an email using configured transactional delivery or dev fallback.
 */
export async function sendTransactionalEmail(
  payload: SendEmailPayload,
  env = process.env,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = env.RESEND_API_KEY
  const from = env.EMAIL_FROM || 'Bosla AI <noreply@careercraft.ai>'

  if (!apiKey) {
    if (env.NODE_ENV !== 'production') {
      console.info(
        `[Transactional Email Preview] To: ${payload.to} | Subject: "${payload.subject}"\n${payload.text}`,
      )
    }
    return { success: true, id: 'preview-simulated-id' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`[Email Delivery Failure] ${res.status}: ${errorText}`)
      return { success: false, error: `Delivery failed with status ${res.status}` }
    }

    const data = (await res.json()) as { id?: string }
    return { success: true, id: data.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network failure'
    console.error(`[Email Delivery Error] ${message}`)
    return { success: false, error: message }
  }
}

/**
 * Generates and sends a bilingual password reset email with 1 hour expiration disclaimer.
 */
export async function sendPasswordResetEmail(
  options: PasswordResetEmailOptions,
  env = process.env,
) {
  const isAr = options.lang === 'ar'
  const subject = isAr
    ? 'إعادة تعيين كلمة المرور الخاصة بك في منصة بوصلة'
    : 'Reset your Bosla AI account password'

  const html = isAr
    ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; direction: rtl; }
            .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
            .logo { font-size: 20px; font-weight: bold; color: #06291d; margin-bottom: 24px; }
            .button { display: inline-block; background-color: #06291d; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 24px 0; }
            .footer { font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">بوصلة AI</div>
            <h2>طلب إعادة تعيين كلمة المرور</h2>
            <p>مرحباً، تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة بوصلة.</p>
            <p>انقر على الزر أدناه لاختيار كلمة مرور جديدة:</p>
            <a href="${options.resetUrl}" class="button" target="_blank">إعادة تعيين كلمة المرور</a>
            <p>أو انسخ الرابط التالي وألصقه في متصفحك إذا لم يعمل الزر:</p>
            <p style="word-break: break-all; color: #2563eb; font-size: 13px;">${options.resetUrl}</p>
            <div class="footer">
              <p>هذا الرابط صالح لمدة ساعة واحدة فقط لضمان أمان حسابك.</p>
              <p>إذا لم تكن قد طلبت إعادة التعيين بنفسك، فيمكنك تجاهل هذه الرسالة بأمان وستظل كلمة مرورك الحالية دون أي تغيير.</p>
            </div>
          </div>
        </body>
      </html>
    `
    : `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
            .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
            .logo { font-size: 20px; font-weight: bold; color: #06291d; margin-bottom: 24px; }
            .button { display: inline-block; background-color: #06291d; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 24px 0; }
            .footer { font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Bosla AI</div>
            <h2>Password reset request</h2>
            <p>Hello, we received a request to reset the password for your Bosla AI workspace.</p>
            <p>Click the button below to choose a new secure password:</p>
            <a href="${options.resetUrl}" class="button" target="_blank">Reset your password</a>
            <p>Or paste this link into your browser if the button does not open:</p>
            <p style="word-break: break-all; color: #2563eb; font-size: 13px;">${options.resetUrl}</p>
            <div class="footer">
              <p>This secure link expires in 1 hour.</p>
              <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
          </div>
        </body>
      </html>
    `

  const text = isAr
    ? `إعادة تعيين كلمة المرور - بوصلة AI\n\nتلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.\n\nانقر على الرابط التالي أو الصقه في المتصفح:\n${options.resetUrl}\n\nصلاحية هذا الرابط تنتهي خلال ساعة واحدة. إذا لم تطلب ذلك، تجاهل هذه الرسالة.`
    : `Password Reset - Bosla AI\n\nWe received a request to reset your password.\n\nOpen the following link to choose a new password:\n${options.resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can safely ignore this message.`

  return sendTransactionalEmail(
    {
      to: options.to,
      subject,
      html,
      text,
    },
    env,
  )
}

/**
 * Generates and sends a bilingual email verification notification.
 */
export async function sendVerificationEmail(options: VerificationEmailOptions, env = process.env) {
  const isAr = options.lang === 'ar'
  const subject = isAr
    ? 'تأكيد عنوان البريد الإلكتروني لحساب بوصلة'
    : 'Verify your Bosla AI email address'

  const html = isAr
    ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; direction: rtl; }
            .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
            .logo { font-size: 20px; font-weight: bold; color: #06291d; margin-bottom: 24px; }
            .button { display: inline-block; background-color: #06291d; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 24px 0; }
            .footer { font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">بوصلة AI</div>
            <h2>تأكيد بريدك الإلكتروني</h2>
            <p>أهلاً بك في بوصلة. يرجى تأكيد بريدك الإلكتروني لتفعيل جميع خصائص مساحة العمل الخاصة بك.</p>
            <a href="${options.verifyUrl}" class="button" target="_blank">تأكيد البريد الإلكتروني</a>
            <p>رابط التأكيد:</p>
            <p style="word-break: break-all; color: #2563eb; font-size: 13px;">${options.verifyUrl}</p>
            <div class="footer">
              <p>هذا الرابط صالح لمدة 24 ساعة.</p>
            </div>
          </div>
        </body>
      </html>
    `
    : `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
            .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
            .logo { font-size: 20px; font-weight: bold; color: #06291d; margin-bottom: 24px; }
            .button { display: inline-block; background-color: #06291d; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 24px 0; }
            .footer { font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Bosla AI</div>
            <h2>Verify your email address</h2>
            <p>Welcome to Bosla AI. Please verify your email address to unlock your full career workspace.</p>
            <a href="${options.verifyUrl}" class="button" target="_blank">Verify email address</a>
            <p>Verification link:</p>
            <p style="word-break: break-all; color: #2563eb; font-size: 13px;">${options.verifyUrl}</p>
            <div class="footer">
              <p>This link is valid for 24 hours.</p>
            </div>
          </div>
        </body>
      </html>
    `

  const text = isAr
    ? `تأكيد البريد الإلكتروني - بوصلة AI\n\nيرجى تأكيد بريدك الإلكتروني من خلال الرابط التالي:\n${options.verifyUrl}\n\nصلاحية هذا الرابط 24 ساعة.`
    : `Verify your email address - Bosla AI\n\nPlease verify your email address by opening the following link:\n${options.verifyUrl}\n\nThis link is valid for 24 hours.`

  return sendTransactionalEmail(
    {
      to: options.to,
      subject,
      html,
      text,
    },
    env,
  )
}
