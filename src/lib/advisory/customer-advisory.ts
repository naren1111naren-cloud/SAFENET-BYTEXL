import { ThreatItem, BrandProfile } from '@/types/brand';

export type AdvisoryLanguage = 'en' | 'hi' | 'ta';
export type AdvisoryFormat = 'social' | 'whatsapp_sms' | 'email_banner';

export interface CustomerAdvisory {
  language: AdvisoryLanguage;
  languageName: string;
  format: AdvisoryFormat;
  headline: string;
  content: string;
}

/**
 * Generates ready-to-post multi-lingual customer warnings in English, Hindi, and Tamil
 */
export function generateCustomerAdvisories(
  threat: ThreatItem,
  brand: BrandProfile,
  language: AdvisoryLanguage = 'en'
): Record<AdvisoryFormat, CustomerAdvisory> {
  const brandName = brand.name || 'Paytm';
  const officialDomain = brand.domain || 'paytm.com';
  const suspectAsset = threat.targetAsset;

  if (language === 'hi') {
    // Hindi (हिंदी)
    return {
      social: {
        language: 'hi',
        languageName: 'हिंदी (Hindi)',
        format: 'social',
        headline: `🚨 सतर्कता सूचना: ${brandName} के नाम पर फर्जी धोखाधड़ी से सावधान!`,
        content: `🚨 सतर्कता सूचना: ${brandName} के नाम पर फर्जी धोखाधड़ी से सावधान!

प्रिय ग्राहकों,
हमें जानकारी मिली है कि कुछ धोखेबाज "${suspectAsset}" का उपयोग करके ${brandName} के नाम पर फर्जी रिफंड, KYC अपडेट और UPI भुगतान की मांग कर रहे हैं।

⚠️ महत्वपूर्ण सुरक्षा नियम:
1. ${brandName} कभी भी रिफंड देने के लिए UPI PIN दर्ज करने या पैसे भेजने को नहीं कहता है।
2. किसी भी अनधिकृत लिंक या APK ऐप को डाउनलोड न करें।
3. केवल हमारी आधिकारिक वेबसाइट ${officialDomain} पर ही भरोसा करें।

धोखाधड़ी की सूचना तुरंत 1930 पर या cybercrime.gov.in पर दें।

#CyberSecurityAlert #${brandName}Safety #FakeAccountAlert #SafeBanking`,
      },
      whatsapp_sms: {
        language: 'hi',
        languageName: 'हिंदी (Hindi)',
        format: 'whatsapp_sms',
        headline: `[सुरक्षा चेतावनी] ${brandName} की ओर से जरूरी सूचना`,
        content: `*सुरक्षा चेतावनी: ${brandName} की ओर से जरूरी सूचना*

कृपया ध्यान दें: धोखेबाज "${suspectAsset}" के जरिए फर्जी रिफंड या 24 घंटे में खाता ब्लॉक करने की झूठी धमकी दे रहे हैं।

❌ रिफंड पाने के लिए कभी भी अपना UPI PIN न डालें।
❌ किसी अज्ञात व्यक्ति को OTP या पासवर्ड न बताएं।
✅ हमारी आधिकारिक वेबसाइट केवल *https://${officialDomain}* है।

सुरक्षित रहें, सतर्क रहें!
-${brandName} सुरक्षा टीम`,
      },
      email_banner: {
        language: 'hi',
        languageName: 'हिंदी (Hindi)',
        format: 'email_banner',
        headline: `आधिकारिक सुरक्षा परामर्श: ${brandName} के नाम पर धोखाधड़ी से बचाव`,
        content: `विषय: [सुरक्षा परामर्श] ${brandName} के नाम पर फर्जी मैसेज और वेबसाइट्स से सावधान

प्रिय ग्राहक,

${brandName} आपकी डिजिटल सुरक्षा को सर्वोच्च प्राथमिकता देता है। हमारे डिजिटल रिस्क मॉनिटरिंग सिस्टम ने एक संदिग्ध गतिविधि चिन्हित की है:
• संदिग्ध लिंक/हैंडल: ${suspectAsset}

धोखेबाज इस फर्जी माध्यम से ग्राहकों को तत्काल रिफंड का लालच देकर या खाता बंद करने का डर दिखाकर UPI भुगतान की मांग कर रहे हैं।

कृपया निम्नलिखित बातों का विशेष ध्यान रखें:
1. रिफंड प्राप्त करने के लिए कभी भी UPI PIN दर्ज करने की आवश्यकता नहीं होती है।
2. ${brandName} के कस्टमर केयर कभी भी व्हाट्सएप या टेलीग्राम पर व्यक्तिगत रूप से पैसे नहीं मांगते।
3. किसी भी सहायता के लिए केवल हमारे आधिकारिक पोर्टल https://${officialDomain} या ऐप का ही उपयोग करें।

यदि आपको कोई संदिग्ध संदेश प्राप्त हुआ है, तो कृपया तुरंत cybercrime.gov.in पर रिपोर्ट करें।

सधन्यवाद,
${brandName} साइबर सुरक्षा एवं ग्राहक सुरक्षा विभाग`,
      },
    };
  }

  if (language === 'ta') {
    // Tamil (தமிழ்)
    return {
      social: {
        language: 'ta',
        languageName: 'தமிழ் (Tamil)',
        format: 'social',
        headline: `🚨 எச்சரிக்கை: ${brandName} பெயரில் நடக்கும் போலி மோசடிகளில் இருந்து உங்களைப் பாதுகாத்துக் கொள்ளுங்கள்!`,
        content: `🚨 எச்சரிக்கை: ${brandName} பெயரில் நடக்கும் போலி மோசடிகளில் இருந்து உங்களைப் பாதுகாத்துக் கொள்ளுங்கள்!

அன்பார்ந்த வாடிக்கையாளர்களே,
"${suspectAsset}" என்ற போலி தளம்/கணக்கு மூலம் ${brandName} பெயரில் போலியான ரீஃபண்ட், KYC புதுப்பிப்பு மற்றும் UPI பணம் கேட்கும் மோசடிகள் நடப்பது கண்டறியப்பட்டுள்ளது.

⚠️ முக்கிய பாதுகாப்பு வழிமுறைகள்:
1. ரீஃபண்ட் பெற ${brandName} ஒருபோதும் உங்கள் UPI PIN-ஐ உள்ளிடவோ அல்லது பணம் அனுப்பவோ கேட்காது.
2. தெரியாத நபர்கள் பகிரும் லிங்க் அல்லது APK செயலிகளை பதிவிறக்கம் செய்யாதீர்கள்.
3. எங்களின் அதிகாரப்பூர்வ இணையதளமான ${officialDomain} மட்டுமே நம்பகமானது.

சைபர் மோசடிகளை உடனே 1930 அல்லது cybercrime.gov.in-ல் புகாரளிக்கவும்.

#CyberSecurityAlert #${brandName}Tamil #FakeAccountAlert #SafeBanking`,
      },
      whatsapp_sms: {
        language: 'ta',
        languageName: 'தமிழ் (Tamil)',
        format: 'whatsapp_sms',
        headline: `[பாதுகாப்பு எச்சரிக்கை] ${brandName} வழங்கும் முக்கிய தகவல்`,
        content: `*பாதுகாப்பு எச்சரிக்கை: ${brandName} வழங்கும் முக்கிய தகவல்*

கவனத்திற்கு: "${suspectAsset}" என்ற போலி கணக்கு மூலம் 24 மணி நேரத்தில் கணக்கு முடக்கப்படும் என அச்சுறுத்தி போலி ரீஃபண்ட் மோசடிகள் நடைபெறுகின்றன.

❌ ரீஃபண்ட் பெற ஒருபோதும் உங்கள் UPI PIN-ஐ உள்ளிடாதீர்கள்.
❌ உங்கள் OTP அல்லது கடவுச்சொல்லை யாரிடமும் பகிராதீர்கள்.
✅ எங்களின் அதிகாரப்பூர்வ தளம் *https://${officialDomain}* மட்டுமே.

பாதுகாப்பாக இருங்கள், விழிப்புடன் இருங்கள்!
-${brandName} பாதுகாப்பு குழு`,
      },
      email_banner: {
        language: 'ta',
        languageName: 'தமிழ் (Tamil)',
        format: 'email_banner',
        headline: `அதிகாரப்பூர்வ பாதுகாப்பு ஆலோசனை: ${brandName} வாடிக்கையாளர் பாதுகாப்பு`,
        content: `பொருள்: [பாதுகாப்பு ஆலோசனை] ${brandName} பெயரில் பரவும் போலி செய்திகள் குறித்து எச்சரிக்கை

அன்பார்ந்த வாடிக்கையாளரே,

${brandName} உங்கள் பாதுகாப்பை உறுதி செய்வதில் எப்போதும் முன்னுரிமை அளிக்கிறது. எங்களின் பாதுகாப்பு கண்காணிப்பு அமைப்பு ஒரு போலி அச்சுறுத்தலைக் கண்டறிந்துள்ளது:
• சந்தேகத்திற்கிடமான தளம்/கணக்கு: ${suspectAsset}

மோசடி செய்பவர்கள் இந்த போலி கணக்கு மூலம் உடனடி ரீஃபண்ட் வழங்குவதாகக் கூறி UPI பணப் பரிவர்த்தனை செய்ய வாடிக்கையாளர்களை ஏமாற்ற முயற்சிக்கின்றனர்.

நினைவில் கொள்க:
1. பணம் பெறுவதற்கு (ரீஃபண்ட்) UPI PIN தேவையில்லை.
2. ${brandName} அதிகாரிகள் ஒருபோதும் Telegram அல்லது WhatsApp மூலம் தனிப்பட்ட முறையில் பணம் கேட்க மாட்டார்கள்.
3. அனைத்து சேவைகளுக்கும் https://${officialDomain} என்ற அதிகாரப்பூர்வ தளத்தை மட்டுமே பயன்படுத்தவும்.

சந்தேகத்திற்கிடமான நடவடிக்கைகளை cybercrime.gov.in தளத்தில் உடனே புகாரளிக்கவும்.

நன்றியுடன்,
${brandName} சைபர் பாதுகாப்பு துறை`,
      },
    };
  }

  // English (Default)
  return {
    social: {
      language: 'en',
      languageName: 'English',
      format: 'social',
      headline: `🚨 SECURITY ADVISORY: Fake ${brandName} Impersonation & Refund Scam Alert!`,
      content: `🚨 SECURITY ADVISORY: Fake ${brandName} Impersonation & Refund Scam Alert!

Dear Customers,
We have detected a fraudulent asset "${suspectAsset}" attempting to impersonate ${brandName} by offering fake refunds, urgent KYC updates, and requesting unauthorized UPI payments.

⚠️ ESSENTIAL SAFETY RULES:
1. ${brandName} NEVER asks you to enter your UPI PIN or transfer money to receive a refund.
2. NEVER install unverified APK apps, AnyDesk, or click suspicious links sent via SMS/DM.
3. Always verify and interact solely through our official domain: ${officialDomain}.

Report suspected fraud immediately at cybercrime.gov.in or national helpline 1930.

#CyberSecurity #${brandName}Safety #PhishingAlert #ScamAwareness #StaySafeOnline`,
    },
    whatsapp_sms: {
      language: 'en',
      languageName: 'English',
      format: 'whatsapp_sms',
      headline: `[SECURITY ALERT] Important Customer Advisory from ${brandName}`,
      content: `*SECURITY ALERT: Official Advisory from ${brandName}*

Warning: Fraudulent actors using "${suspectAsset}" are sending fake refund notifications and threatening 24-hour account suspension.

❌ NEVER enter your UPI PIN to receive money or refunds.
❌ NEVER share your OTP, passwords, or install remote screen apps.
✅ Our ONLY official website is *https://${officialDomain}*.

Stay vigilant and report suspicious messages.
-${brandName} Security Operations`,
    },
    email_banner: {
      language: 'en',
      languageName: 'English',
      format: 'email_banner',
      headline: `Official Customer Advisory: Protecting Yourself Against Brand Impersonation Scams`,
      content: `Subject: [Urgent Advisory] Beware of Fake ${brandName} Refund & Support Scams

Dear Valued Customer,

Your digital safety and financial security are our top priorities. SAFENET digital risk monitoring has identified an active impersonation campaign targeting ${brandName} users:
• Identified Malicious Asset: ${suspectAsset}

FRAUD OPERATING METHOD:
Attackers are attempting to lure users with fake refund notifications or intimidating threats of imminent account suspension, urging victims to make upfront payments or enter their UPI PINs on unauthorized portals.

PLEASE KEEP THESE CRITICAL SAFEGUARDS IN MIND:
1. Receiving Money / Refunds NEVER Requires Entering a UPI PIN: A PIN is exclusively used for sending funds.
2. Official Support Channels: ${brandName} will never direct you to personal Telegram bots, unofficial WhatsApp numbers, or private DMs.
3. Access Only Verified Portals: Always verify the URL is https://${officialDomain} before logging in.

If you have encountered this fraudulent communication, report it to our security team at abuse-desk@${officialDomain} or file a complaint on cybercrime.gov.in.

Stay Safe,
${brandName} Information Security & Customer Protection Cell`,
    },
  };
}
