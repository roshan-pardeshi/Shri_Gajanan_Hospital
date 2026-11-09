import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// Basic in-memory rate limiting (max 20 requests/minute per client IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(ip: string, maxPerMin = 20): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (record.count >= maxPerMin) {
    return false;
  }
  record.count++;
  return true;
}

// Redact API key from any error message or string before logging
export function redactApiKey(str: string, key?: string): string {
  if (!str || typeof str !== 'string') return '';
  let result = str;
  const envKeys = [
    key,
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.OPENAI_API_KEY,
  ].filter((k): k is string => Boolean(k && typeof k === 'string' && k.length > 3));

  for (const k of envKeys) {
    result = result.split(k).join('[REDACTED]');
  }
  return result;
}

export interface HospitalContext {
  settings: any | null;
  specialities: any[];
  doctors: any[];
  schemes: any[];
  labTests: any[];
  labSettings: any | null;
  isAvailable: boolean;
}

// Fetch verified hospital context from database
export async function getHospitalContext(): Promise<HospitalContext> {
  try {
    const [settingsRows, specialitiesRows, doctorsRows, schemesRows, labTestsRows, labSettingsRows] = await Promise.all([
      query<any[]>('SELECT * FROM hospital_settings LIMIT 1').catch((err) => {
        console.warn('[AI Context Fetch Settings Error]:', err.message);
        return [];
      }),
      query<any[]>('SELECT name, description FROM specialities WHERE is_active = TRUE ORDER BY name ASC').catch((err) => {
        console.warn('[AI Context Fetch Specialities Error]:', err.message);
        return [];
      }),
      query<any[]>(`
        SELECT d.name, d.qualifications, d.experience_years, d.consultation_fee,
               d.availability_status, d.working_hours_start, d.working_hours_end,
               d.working_days, s.name as speciality
        FROM doctors d
        LEFT JOIN specialities s ON d.speciality_id = s.id
        WHERE d.is_active = TRUE
        ORDER BY d.name ASC
      `).catch((err) => {
        console.warn('[AI Context Fetch Doctors Error]:', err.message);
        return [];
      }),
      query<any[]>('SELECT name, code, category, coverage_amount, hospital_acceptance_status FROM health_schemes WHERE is_published = TRUE ORDER BY name ASC').catch((err) => {
        console.warn('[AI Context Fetch Schemes Error]:', err.message);
        return [];
      }),
      query<any[]>('SELECT name, category, indicative_price, turnaround_time, fasting_required FROM laboratory_tests WHERE is_available = TRUE AND is_published = TRUE ORDER BY display_order ASC, name ASC LIMIT 30').catch((err) => {
        console.warn('[AI Context Fetch LabTests Error]:', err.message);
        return [];
      }),
      query<any[]>('SELECT lab_name, location, operating_hours, contact_phone, general_description FROM laboratory_settings LIMIT 1').catch(() => []),
    ]);

    const settings = settingsRows && settingsRows.length > 0 ? settingsRows[0] : null;
    const labSettings = labSettingsRows && labSettingsRows.length > 0 ? labSettingsRows[0] : null;
    const hasData = Boolean(settings) || (specialitiesRows && specialitiesRows.length > 0) || (doctorsRows && doctorsRows.length > 0);

    return {
      settings,
      specialities: specialitiesRows || [],
      doctors: doctorsRows || [],
      schemes: schemesRows || [],
      labTests: labTestsRows || [],
      labSettings,
      isAvailable: hasData,
    };
  } catch (err: any) {
    console.warn('[AI Context Fetch Error]:', err.message);
    return {
      settings: null,
      specialities: [],
      doctors: [],
      schemes: [],
      labTests: [],
      labSettings: null,
      isAvailable: false,
    };
  }
}

// Fallback message generator using verified hospital records when AI API is unavailable
export function generateVerifiedFallback(userMsg: string, data: HospitalContext): string {
  const q = userMsg.toLowerCase().trim();
  const s = data.settings;
  const hospitalName = s?.hospital_name || 'Shri Gajanan Multispeciality Hospital';

  // 1. Critical Medical Emergency Safeguard
  if (/(chest pain|heart attack|cardiac|stroke|breath|severe bleeding|bleed|unconscious|faint|poison|burn|head injury|convulsion|seizure|emergency|trauma|accident)/i.test(q)) {
    if (s?.emergency_helpline) {
      return `🚨 MEDICAL EMERGENCY:\n\nIf you or someone nearby is experiencing a medical emergency, please immediately call our verified hospital emergency helpline at ${s.emergency_helpline} or proceed to the nearest emergency department without delay.\n\n⚠️ Medical Safety Notice: This AI assistant is strictly informational and cannot provide medical diagnoses, treatment plans, or prescriptions.`;
    }
    return `🚨 MEDICAL EMERGENCY:\n\nIf you or someone nearby is experiencing a medical emergency, please immediately contact your local emergency services (e.g. 112 / 108 in India) or proceed to the nearest hospital emergency department without delay.\n\n⚠️ Medical Safety Notice: This AI assistant is strictly informational and cannot provide medical diagnoses, treatment plans, or prescriptions.`;
  }

  // 2. If database context is completely unavailable
  if (!data.isAvailable && !s && data.doctors.length === 0 && data.specialities.length === 0) {
    return `Hospital records cannot currently be verified from our database. Please check back shortly or visit the hospital reception desk for verified assistance.`;
  }

  // 3. Doctors & Specialists
  if (/(doctor|specialist|physician|consultant|cardiologist|neurologist|orthopaedic|pediatrician|gynecologist|surgeon|oncologist|nephrologist)/i.test(q)) {
    if (data.doctors && data.doctors.length > 0) {
      const docList = data.doctors.slice(0, 6).map((d: any) => {
        const parts = [`• ${d.name}`];
        if (d.speciality) parts.push(`(${d.speciality})`);
        if (d.qualifications) parts.push(`- ${d.qualifications}`);
        if (d.experience_years) parts.push(`[${d.experience_years} yrs exp.]`);
        if (d.consultation_fee !== null && d.consultation_fee !== undefined) parts.push(`Fee: ₹${d.consultation_fee}`);
        return parts.join(' ');
      }).join('\n');

      return `👨‍⚕️ Specialist Doctors at ${hospitalName}:\n\n${docList}\n\nTo view all consultants or book an appointment, click "Book an Appointment" or check the Doctor Directory on the portal.`;
    }
    return `Doctor directory information cannot currently be verified from our hospital database records. Please check the Doctor Directory on the website or contact the hospital desk.`;
  }

  // 4. Operating Hours & Timings
  if (/(timing|hour|schedule|opd hours|open|close|sunday)/i.test(q)) {
    if (s?.operating_hours) {
      let reply = `🕒 Hospital Operating Hours:\n\n${s.operating_hours}`;
      if (s.emergency_helpline) {
        reply += `\n\nVerified Emergency Helpline: ${s.emergency_helpline}`;
      }
      return reply;
    }
    return `Hospital operating hours cannot currently be verified from our database records. Please contact the hospital administration directly.`;
  }

  // 5. Appointment Booking
  if (/(book|appointment|slot|consult|schedule appointment)/i.test(q)) {
    return `🗓️ How to Book an Appointment at ${hospitalName}:\n\n1. Click "Book an Appointment" on the website.\n2. Select your desired department and specialist doctor.\n3. Choose an available date and time slot.\n4. Enter patient details and confirm your consultation.\n\nYour appointment reference number will be generated immediately.`;
  }

  // 6. Diagnostic Laboratory
  if (/(lab|test|blood|diagnostic|pathology|cbc|lipid|urine|liver|kidney|thyroid|biochemistry)/i.test(q)) {
    if (data.labTests && data.labTests.length > 0) {
      const testList = data.labTests.slice(0, 6).map((t: any) => {
        const parts = [`• ${t.name}`];
        if (t.category) parts.push(`(${t.category})`);
        if (t.indicative_price !== null && t.indicative_price !== undefined) parts.push(`- ₹${t.indicative_price}`);
        if (t.turnaround_time) parts.push(`[Turnaround: ${t.turnaround_time}]`);
        if (t.fasting_required) parts.push(`(Fasting Required)`);
        return parts.join(' ');
      }).join('\n');

      let reply = `🔬 Diagnostic Laboratory Tests:\n\n${testList}\n\nPlease visit the Diagnostic Laboratory section on the website to view all available tests and sample collection details.`;
      if (data.labSettings?.contact_phone) {
        reply += `\n\nLab Contact: ${data.labSettings.contact_phone}`;
      }
      return reply;
    }
    return `Laboratory test details cannot currently be verified from our database records. Please visit the Diagnostic Laboratory section or contact the hospital desk.`;
  }

  // 7. Government Health Schemes
  if (/(scheme|ayushman|pmjay|mjpjay|cashless|insurance|yojana|cghs|esic|empanelled)/i.test(q)) {
    if (data.schemes && data.schemes.length > 0) {
      const schemeList = data.schemes.map((sc: any) => {
        const cov = sc.coverage_amount ? ` (Coverage: ${sc.coverage_amount})` : '';
        const status = sc.hospital_acceptance_status ? ` - ${sc.hospital_acceptance_status}` : '';
        return `• ${sc.name} [${sc.category}]${cov}${status}`;
      }).join('\n');

      return `🛡️ Health Schemes & Coverage:\n\n${schemeList}\n\nPlease visit the Health Schemes section on the website or contact the hospital billing desk for documentation and eligibility verification.`;
    }
    return `Information on empanelled health schemes cannot currently be verified from our hospital records. Please contact the hospital helpdesk for verified scheme details.`;
  }

  // 8. Hospital Location & Contact
  if (/(location|address|where|reach|contact|phone|email|pincode|city|state|map|direction)/i.test(q)) {
    const details: string[] = [];
    const addressParts = [s?.address, s?.city, s?.state, s?.pincode ? `- ${s.pincode}` : ''].filter(Boolean);
    if (addressParts.length > 0) {
      details.push(`• Address: ${addressParts.join(', ')}`);
    }
    if (s?.phone) {
      details.push(`• Phone: ${s.phone}`);
    }
    if (s?.emergency_helpline) {
      details.push(`• Emergency Helpline: ${s.emergency_helpline}`);
    }
    if (s?.email) {
      details.push(`• Email: ${s.email}`);
    }
    if (details.length > 0) {
      return `📍 ${hospitalName} Contact Details:\n\n${details.join('\n')}`;
    }
    return `Hospital address and contact details cannot currently be verified from our database records.`;
  }

  // 9. General Greeting & Assistance
  const contactLines: string[] = [];
  const addressParts = [s?.address, s?.city, s?.state, s?.pincode ? `- ${s.pincode}` : ''].filter(Boolean);
  if (addressParts.length > 0) {
    contactLines.push(`• 📍 Location: ${addressParts.join(', ')}`);
  }
  if (s?.emergency_helpline) {
    contactLines.push(`• 📞 Emergency: ${s.emergency_helpline}`);
  }
  if (s?.operating_hours) {
    contactLines.push(`• 🕒 Operating Hours: ${s.operating_hours}`);
  }

  let welcome = `Hello! 👋 Welcome to ${hospitalName}.\n\nI can assist you with verified information from our hospital database, including:\n• Specialist Doctors\n• Scheduling Appointments\n• Hospital Operating Hours\n• Diagnostic Laboratory Tests\n• Government Health Schemes\n• Hospital Location & Contact`;

  if (contactLines.length > 0) {
    welcome += `\n\nVerified Hospital Information:\n${contactLines.join('\n')}`;
  }

  return welcome;
}

// POST /api/chat - Process AI Chat conversation
router.post('/', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before sending another message.',
      });
    }

    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const trimmedMsg = message.trim();
    const contextData = await getHospitalContext();
    const s = contextData.settings;
    const hospitalName = s?.hospital_name || 'Shri Gajanan Multispeciality Hospital';

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const openAiKey = process.env.OPENAI_API_KEY;

    // Build verified hospital system prompt using actual database records
    const specialitiesSummary = contextData.specialities.length > 0
      ? contextData.specialities.map((sp: any) => `• ${sp.name}${sp.description ? `: ${sp.description}` : ''}`).join('\n')
      : 'None verified in database records at this time.';

    const doctorsSummary = contextData.doctors.length > 0
      ? contextData.doctors.map((d: any) => {
          const parts = [`• ${d.name}`];
          if (d.speciality) parts.push(`(${d.speciality})`);
          if (d.qualifications) parts.push(`Qualifications: ${d.qualifications}`);
          if (d.experience_years) parts.push(`Experience: ${d.experience_years} years`);
          if (d.consultation_fee !== null && d.consultation_fee !== undefined) parts.push(`Consultation Fee: ₹${d.consultation_fee}`);
          if (d.availability_status) parts.push(`Status: ${d.availability_status}`);
          if (d.working_hours_start && d.working_hours_end) parts.push(`Hours: ${d.working_hours_start} - ${d.working_hours_end}`);
          return parts.join(' | ');
        }).join('\n')
      : 'None verified in database records at this time.';

    const schemesSummary = contextData.schemes.length > 0
      ? contextData.schemes.map((sc: any) => `• ${sc.name} (${sc.category})${sc.coverage_amount ? `: Coverage ${sc.coverage_amount}` : ''} | Status: ${sc.hospital_acceptance_status || 'Empanelled'}`).join('\n')
      : 'None verified in database records at this time.';

    const labTestsSummary = contextData.labTests.length > 0
      ? contextData.labTests.map((t: any) => `• ${t.name} (${t.category})${t.indicative_price !== null && t.indicative_price !== undefined ? `: ₹${t.indicative_price}` : ''}${t.turnaround_time ? ` | Turnaround: ${t.turnaround_time}` : ''}${t.fasting_required ? ' | Fasting Required' : ''}`).join('\n')
      : 'None verified in database records at this time.';

    const labGeneral = contextData.labSettings
      ? `Laboratory General Information: ${contextData.labSettings.lab_name || ''} | Hours: ${contextData.labSettings.operating_hours || 'Not specified'} | Contact: ${contextData.labSettings.contact_phone || 'Not specified'} | Walk-ins: ${contextData.labSettings.accepts_walkins ? 'Accepted' : 'Appointment required'}`
      : '';

    const addressParts = [s?.address, s?.city, s?.state, s?.pincode ? `- ${s.pincode}` : ''].filter(Boolean);
    const verifiedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided in database';
    const verifiedEmergency = s?.emergency_helpline || null;
    const verifiedPhone = s?.phone || 'Not provided in database';
    const verifiedEmail = s?.email || 'Not provided in database';
    const verifiedHours = s?.operating_hours || 'Not provided in database';

    const emergencyDirective = verifiedEmergency
      ? `Direct the user immediately to call the verified hospital emergency helpline at ${verifiedEmergency} or proceed directly to the hospital emergency department.`
      : `Advise the user immediately to contact local emergency services (such as 112 / 108 in India) or proceed directly to the nearest hospital emergency room.`;

    const systemPrompt = `You are SmartCare AI, the friendly, professional, 24/7 AI Hospital Assistant for ${hospitalName}.

=== VERIFIED HOSPITAL DATABASE INFORMATION ===
Hospital: ${hospitalName}
Tagline: ${s?.tagline || ''}
Address: ${verifiedAddress}
24/7 Emergency Line: ${verifiedEmergency || 'Not configured in hospital database'}
OPD Desk / Phone: ${verifiedPhone}
Email: ${verifiedEmail}
Operating Hours: ${verifiedHours}

Medical Departments:
${specialitiesSummary}

Doctor Directory:
${doctorsSummary}

Government Health Schemes:
${schemesSummary}

Diagnostic Laboratory:
${labTestsSummary}
${labGeneral ? `\n${labGeneral}` : ''}

=== CRITICAL MEDICAL SAFETY GUIDELINES ===
1. You are an AI informational assistant, NOT a medical doctor.
2. NEVER diagnose illnesses, diseases, or medical conditions based on symptoms.
3. NEVER prescribe medications, drugs, home remedies, or therapeutic dosages.
4. EMERGENCY SITUATIONS: If a user describes severe emergency symptoms (such as acute chest pain, heart attack symptoms, stroke signs, difficulty breathing, severe bleeding, head trauma, poisoning, or loss of consciousness):
   - ${emergencyDirective}
   - Emphasize that urgent medical attention is required without delay.
5. Always guide users to consult a qualified doctor for medical evaluation and diagnosis.
6. HOSPITAL INFORMATION ACCURACY & RESTRICTIONS:
   - Rely ONLY on the verified facts above.
   - If any information (such as a specific doctor, price, timing, test, health scheme, accreditation like NABL/NABH, or facility) is not explicitly listed in the verified facts above, you MUST state that the information cannot currently be verified from official hospital records.
   - NEVER invent or assume doctors, phone numbers, addresses, timings, prices, accreditations, or facilities.
   - Do NOT claim NABL accreditation, 24/7 laboratory operations, or specific government schemes unless explicitly confirmed in the verified information above.
7. Keep answers polite, warm, concise, and structured with bullet points.`;

    // 1. Primary: Google Gemini Provider
    if (geminiKey) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`;

      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (!item || typeof item.text !== 'string' || !item.text.trim()) continue;
          const role = (item.sender === 'ai' || item.sender === 'assistant' || item.sender === 'model') ? 'model' : 'user';
          if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts[0].text += `\n${item.text.trim()}`;
          } else {
            contents.push({ role, parts: [{ text: item.text.trim() }] });
          }
        }
      }
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += `\n${trimmedMsg}`;
      } else {
        contents.push({ role: 'user', parts: [{ text: trimmedMsg }] });
      }

      try {
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 800,
            },
          }),
        });

        if (!geminiRes.ok) {
          let errText = '';
          try {
            errText = await geminiRes.text();
          } catch {}
          console.error(`[Gemini API Error] (${geminiRes.status}):`, redactApiKey(errText, geminiKey));

          return res.json({
            reply: generateVerifiedFallback(trimmedMsg, contextData),
            isFallback: true,
            configured: true,
          });
        }

        const geminiData: any = await geminiRes.json();

        // Check for error block in payload
        if (geminiData.error) {
          console.error('[Gemini API Error Payload]:', redactApiKey(geminiData.error.message || JSON.stringify(geminiData.error), geminiKey));
          return res.json({
            reply: generateVerifiedFallback(trimmedMsg, contextData),
            isFallback: true,
            configured: true,
          });
        }

        // Check for safety blocking
        if (geminiData.promptFeedback?.blockReason) {
          console.warn('[Gemini Response]: Prompt blocked by safety policy:', geminiData.promptFeedback.blockReason);
          return res.json({
            reply: generateVerifiedFallback(trimmedMsg, contextData),
            isFallback: true,
            configured: true,
          });
        }

        // Check candidates
        const candidate = geminiData.candidates?.[0];
        if (!candidate) {
          console.warn('[Gemini Response]: No candidates returned in response.');
          return res.json({
            reply: generateVerifiedFallback(trimmedMsg, contextData),
            isFallback: true,
            configured: true,
          });
        }

        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          console.warn('[Gemini Response]: Candidate finishReason is', candidate.finishReason);
        }

        const generatedText = candidate.content?.parts?.[0]?.text;
        if (generatedText && typeof generatedText === 'string' && generatedText.trim()) {
          return res.json({
            reply: generatedText.trim(),
            configured: true,
            provider: 'Gemini',
          });
        }

        console.warn('[Gemini Response]: Candidate text was empty or missing.');
        return res.json({
          reply: generateVerifiedFallback(trimmedMsg, contextData),
          isFallback: true,
          configured: true,
        });
      } catch (geminiFetchErr: any) {
        console.error('[Gemini Request Failed]:', redactApiKey(geminiFetchErr?.message || 'Network error', geminiKey));
        return res.json({
          reply: generateVerifiedFallback(trimmedMsg, contextData),
          isFallback: true,
          configured: true,
        });
      }
    }

    // 2. Secondary: OpenAI Provider (if configured)
    if (openAiKey) {
      try {
        const openAiUrl = 'https://api.openai.com/v1/chat/completions';
        const messages: any[] = [{ role: 'system', content: systemPrompt }];

        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            if (!item || typeof item.text !== 'string' || !item.text.trim()) continue;
            if (item.sender === 'patient' || item.sender === 'user') {
              messages.push({ role: 'user', content: item.text.trim() });
            } else if (item.sender === 'ai' || item.sender === 'assistant' || item.sender === 'model') {
              messages.push({ role: 'assistant', content: item.text.trim() });
            }
          }
        }
        messages.push({ role: 'user', content: trimmedMsg });

        const openAiRes = await fetch(openAiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.3,
            max_tokens: 800,
          }),
        });

        if (!openAiRes.ok) {
          let errText = '';
          try {
            errText = await openAiRes.text();
          } catch {}
          console.error(`[OpenAI API Error] (${openAiRes.status}):`, redactApiKey(errText, openAiKey));
          return res.json({
            reply: generateVerifiedFallback(trimmedMsg, contextData),
            isFallback: true,
            configured: true,
          });
        }

        const openAiData: any = await openAiRes.json();
        if (openAiData.error) {
          console.error('[OpenAI API Error Payload]:', redactApiKey(openAiData.error.message || JSON.stringify(openAiData.error), openAiKey));
          return res.json({
            reply: generateVerifiedFallback(trimmedMsg, contextData),
            isFallback: true,
            configured: true,
          });
        }

        const generatedText = openAiData.choices?.[0]?.message?.content;
        if (generatedText && typeof generatedText === 'string' && generatedText.trim()) {
          return res.json({
            reply: generatedText.trim(),
            configured: true,
            provider: 'OpenAI',
          });
        }
      } catch (openAiErr: any) {
        console.error('[OpenAI Request Failed]:', redactApiKey(openAiErr?.message || 'Network error', openAiKey));
        return res.json({
          reply: generateVerifiedFallback(trimmedMsg, contextData),
          isFallback: true,
          configured: true,
        });
      }
    }

    // 3. Fallback when AI APIs are not configured
    return res.json({
      reply: generateVerifiedFallback(trimmedMsg, contextData),
      isFallback: true,
      configured: false,
    });
  } catch (err: any) {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    console.error('[AI Chat Router Error]:', redactApiKey(err?.message || 'Unexpected error', geminiKey));
    return res.status(500).json({
      error: 'An unexpected error occurred while processing your request.',
    });
  }
});

export default router;
