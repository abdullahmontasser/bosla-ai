interface AuthCopy {
  brand: string
  panelKicker: string
  panelTitle: string
  panelBody: string
  panelPoints: string[]
  panelNote: string
  loginTitle: string
  loginLead: string
  signupTitle: string
  signupLead: string
  email: string
  emailPlaceholder: string
  password: string
  passwordPlaceholder: string
  name: string
  namePlaceholder: string
  signIn: string
  signingIn: string
  createAccount: string
  creatingAccount: string
  continueWith: string
  orEmail: string
  showPassword: string
  hidePassword: string
  noAccount: string
  createOne: string
  haveAccount: string
  signInInstead: string
  demoLabel: string
  demoHint: string
  demoAction: string
  forgot: string
  forgotHint: string
  forgotPasswordTitle: string
  forgotPasswordLead: string
  forgotPasswordSentTitle: string
  forgotPasswordSentLead: string
  backToLogin: string
  sendResetLink: string
  sending: string
  resetPasswordTitle: string
  resetPasswordLead: string
  newPassword: string
  confirmPassword: string
  resetPasswordAction: string
  resetSuccess: string
  verifyEmailTitle: string
  verifyEmailSuccess: string
  verifyEmailFailed: string
  goToWorkspace: string
  resendVerification: string
  terms: string
  passwordStrength: {
    label: string
    empty: string
    weak: string
    fair: string
    good: string
    strong: string
    reqMinLength: string
    reqUpperLower: string
    reqNumber: string
    reqSpecial: string
  }
  emailValidation: {
    valid: string
    invalid: string
    disposable: string
  }
  errors: {
    invalid_credentials: string
    invalid_input: string
    weak_password: string
    email_taken: string
    provider_disabled: string
    oauth: string
    oauth_not_linked: string
    access_denied: string
    configuration: string
    too_many_requests: string
    unknown: string
  }
  providerNames: Record<'github' | 'google' | 'linkedin', string>
}

const en: AuthCopy = {
  brand: 'Bosla',
  panelKicker: 'Career intelligence, without the noise',
  panelTitle: 'One workspace from job post to interview.',
  panelBody:
    'Tailor your resume to the role, see what is missing, track every application, and walk into the conversation prepared.',
  panelPoints: [
    'A resume shaped around the role, not a generic rewrite',
    'Clear ATS coverage before you apply',
    'Every application and next step in one place',
  ],
  panelNote: 'Bring your own AI provider. Your files stay yours.',
  loginTitle: 'Welcome back',
  loginLead: 'Sign in to open your workspace. We will take you back to the page you wanted.',
  signupTitle: 'Create your workspace',
  signupLead: 'Start with your real experience. Add the role. See exactly what changes.',
  email: 'Email',
  emailPlaceholder: 'you@example.com',
  password: 'Password',
  passwordPlaceholder: 'At least 8 characters',
  name: 'Full name',
  namePlaceholder: 'Your name',
  signIn: 'Sign in',
  signingIn: 'Signing in...',
  createAccount: 'Create account',
  creatingAccount: 'Creating account...',
  continueWith: 'Continue with',
  orEmail: 'or continue with email',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  noAccount: 'New to Bosla?',
  createOne: 'Create an account',
  haveAccount: 'Already have an account?',
  signInInstead: 'Sign in',
  demoLabel: 'Just looking around?',
  demoHint: 'Open the seeded demo workspace with one click.',
  demoAction: 'Use the demo account',
  forgot: 'Forgot your password?',
  forgotHint: 'Reset your password using your registered email address.',
  forgotPasswordTitle: 'Reset your password',
  forgotPasswordLead:
    'Enter your email address and we will send you a link to reset your password.',
  forgotPasswordSentTitle: 'Check your inbox',
  forgotPasswordSentLead:
    'If an account exists for that email, we have sent instructions to reset your password.',
  backToLogin: 'Back to sign in',
  sendResetLink: 'Send reset link',
  sending: 'Sending...',
  resetPasswordTitle: 'Set new password',
  resetPasswordLead: 'Choose a strong password with at least 8 characters.',
  newPassword: 'New password',
  confirmPassword: 'Confirm password',
  resetPasswordAction: 'Update password',
  resetSuccess: 'Your password has been reset successfully. You can now sign in.',
  verifyEmailTitle: 'Verify your email',
  verifyEmailSuccess: 'Your email address has been verified successfully.',
  verifyEmailFailed: 'Verification link has expired or is invalid.',
  goToWorkspace: 'Go to workspace',
  resendVerification: 'Resend verification email',
  terms:
    'By continuing you agree to use Bosla responsibly and to keep your account credentials private.',
  passwordStrength: {
    label: 'Password strength',
    empty: 'Enter a password',
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
    reqMinLength: 'At least 8 characters',
    reqUpperLower: 'Uppercase and lowercase letters',
    reqNumber: 'At least one number',
    reqSpecial: 'At least one special character (!@#$...)',
  },
  emailValidation: {
    valid: 'Valid email address',
    invalid: 'Enter a valid email address',
    disposable: 'Disposable emails are not permitted',
  },
  errors: {
    invalid_credentials: 'That email and password do not match. Check them and try again.',
    invalid_input: 'Check the highlighted fields and try again.',
    weak_password: 'Use at least 8 characters with uppercase, lowercase, numbers, and symbols.',
    email_taken: 'An account with this email already exists. Sign in instead.',
    provider_disabled: 'That sign in method is not configured on this server.',
    oauth: 'Sign in could not be completed. Try again or use your email and password.',
    oauth_not_linked:
      'This email already has an account. Sign in with your email and password instead.',
    access_denied: 'Sign in was cancelled before it finished.',
    configuration: 'This sign in method is not configured correctly. Try email and password.',
    too_many_requests: 'Too many attempts. Please wait a few minutes before trying again.',
    unknown: 'Something went wrong. Try again in a moment.',
  },
  providerNames: {
    github: 'GitHub',
    google: 'Google',
    linkedin: 'LinkedIn',
  },
}

const ar: AuthCopy = {
  brand: 'بوصلة',
  panelKicker: 'ذكاء مهني بلا ضجيج',
  panelTitle: 'مساحة واحدة من إعلان الوظيفة إلى المقابلة.',
  panelBody: 'وائم سيرتك مع الوظيفة، واعرف ما ينقصها، وتابِع كل طلب، وادخل المقابلة مستعداً.',
  panelPoints: [
    'سيرة مبنية على الدور لا إعادة كتابة عامة',
    'تغطية واضحة لمتطلبات ATS قبل التقديم',
    'كل طلب وخطوته التالية في مكان واحد',
  ],
  panelNote: 'استخدم مزوّد الذكاء الاصطناعي الخاص بك. ملفاتك تبقى لك.',
  loginTitle: 'أهلاً بعودتك',
  loginLead: 'سجّل الدخول لفتح مساحتك. سنعيدك إلى الصفحة التي أردتها.',
  signupTitle: 'أنشئ مساحتك',
  signupLead: 'ابدأ بخبرتك الحقيقية. أضف الوظيفة. شاهد ما يتغيّر بالضبط.',
  email: 'البريد الإلكتروني',
  emailPlaceholder: 'you@example.com',
  password: 'كلمة المرور',
  passwordPlaceholder: '٨ أحرف على الأقل',
  name: 'الاسم الكامل',
  namePlaceholder: 'اسمك',
  signIn: 'تسجيل الدخول',
  signingIn: 'جارٍ تسجيل الدخول...',
  createAccount: 'إنشاء حساب',
  creatingAccount: 'جارٍ إنشاء الحساب...',
  continueWith: 'المتابعة عبر',
  orEmail: 'أو تابع بالبريد الإلكتروني',
  showPassword: 'إظهار كلمة المرور',
  hidePassword: 'إخفاء كلمة المرور',
  noAccount: 'جديد على بوصلة؟',
  createOne: 'أنشئ حساباً',
  haveAccount: 'لديك حساب بالفعل؟',
  signInInstead: 'تسجيل الدخول',
  demoLabel: 'تتفحّص فقط؟',
  demoHint: 'افتح مساحة العرض التجريبية بنقرة واحدة.',
  demoAction: 'استخدم حساب العرض',
  forgot: 'نسيت كلمة المرور؟',
  forgotHint: 'استعد كلمة المرور عبر بريدك الإلكتروني المسجل.',
  forgotPasswordTitle: 'استعادة كلمة المرور',
  forgotPasswordLead: 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.',
  forgotPasswordSentTitle: 'تفقد صندوق الوارد',
  forgotPasswordSentLead: 'إذا كان هناك حساب مسجل بهذا البريد، فقد أرسلنا تعليمات الاستعادة.',
  backToLogin: 'العودة لتسجيل الدخول',
  sendResetLink: 'إرسال رابط الاستعادة',
  sending: 'جارٍ الإرسال...',
  resetPasswordTitle: 'تعيين كلمة مرور جديدة',
  resetPasswordLead: 'اختر كلمة مرور قوية مكونة من ٨ أحرف على الأقل.',
  newPassword: 'كلمة المرور الجديدة',
  confirmPassword: 'تأكيد كلمة المرور',
  resetPasswordAction: 'تحديث كلمة المرور',
  resetSuccess: 'تمت إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.',
  verifyEmailTitle: 'تأكيد البريد الإلكتروني',
  verifyEmailSuccess: 'تم تأكيد بريدك الإلكتروني بنجاح.',
  verifyEmailFailed: 'رابط التأكيد منتهي الصلاحية أو غير صالح.',
  goToWorkspace: 'الانتقال إلى مساحة العمل',
  resendVerification: 'إعادة إرسال بريد التأكيد',
  terms: 'بالمتابعة أنت توافق على استخدام بوصلة بمسؤولية والحفاظ على سرية بيانات حسابك.',
  passwordStrength: {
    label: 'قوة كلمة المرور',
    empty: 'أدخل كلمة المرور',
    weak: 'ضعيفة',
    fair: 'مقبولة',
    good: 'جيدة',
    strong: 'قوية جداً',
    reqMinLength: '٨ أحرف على الأقل',
    reqUpperLower: 'أحرف كبيرة وصغيرة',
    reqNumber: 'رقم واحد على الأقل',
    reqSpecial: 'رمز خاص واحد على الأقل (!@#$...)',
  },
  emailValidation: {
    valid: 'عنوان بريد إلكتروني صالح',
    invalid: 'أدخل بريداً إلكترونياً صالحاً',
    disposable: 'عناوين البريد المؤقت غير مقبولة',
  },
  errors: {
    invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير مطابقة. تحقق وحاول مرة أخرى.',
    invalid_input: 'تحقق من الحقول المحددة وحاول مرة أخرى.',
    weak_password: 'استخدم ٨ أحرف على الأقل تحتوي أحرفاً كبيرة وصغيرة وأرقاماً ورموزاً.',
    email_taken: 'يوجد حساب بهذا البريد بالفعل. سجّل الدخول بدلاً من ذلك.',
    provider_disabled: 'طريقة الدخول هذه غير مهيّأة على هذا الخادم.',
    oauth: 'لم يكتمل تسجيل الدخول. حاول مرة أخرى أو استخدم البريد وكلمة المرور.',
    oauth_not_linked: 'هذا البريد لديه حساب بالفعل. سجّل الدخول بالبريد وكلمة المرور بدلاً من ذلك.',
    access_denied: 'أُلغي تسجيل الدخول قبل اكتماله.',
    configuration: 'طريقة الدخول هذه غير مهيّأة بشكل صحيح. استخدم البريد وكلمة المرور.',
    too_many_requests: 'محاولات كثيرة جداً. يُرجى الانتظار بضع دقائق ثم المحاولة مجدداً.',
    unknown: 'حدث خطأ ما. حاول بعد قليل.',
  },
  providerNames: {
    github: 'GitHub',
    google: 'Google',
    linkedin: 'LinkedIn',
  },
}

export type { AuthCopy }
export function getAuthCopy(lang: string): AuthCopy {
  return lang === 'ar' ? ar : en
}
