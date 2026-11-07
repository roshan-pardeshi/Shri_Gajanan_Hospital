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

// Fetch verified hospital context from MySQL database
async function getHospitalContext() {
  try {
    const [settingsRows, specialitiesRows, doctorsRows, schemesRows, labTestsRows] = await Promise.all([
      query<any[]>('SELECT * FROM hospital_settings LIMIT 1'),
      query<any[]>('SELECT name, description FROM specialities WHERE is_active = TRUE ORDER BY name ASC'),
      query<any[]>(`
        SELECT d.name, d.qualifications, d.experience_years, d.consultation_fee,
               d.availability_status, d.working_hours_start, d.working_hours_end,
               d.working_days, s.name as speciality
        FROM doctors d
        LEFT JOIN specialities s ON d.speciality_id = s.id
        WHERE d.is_active = TRUE
        ORDER BY d.name ASC
      `),
      query<any[]>('SELECT name, code, category, coverage_amount, hospital_acceptance_status FROM health_schemes WHERE is_published = TRUE'),
      query<any[]>('SELECT test_name, category, price, turnaround_time_hours, fasting_required FROM laboratory_tests WHERE is_active = TRUE AND is_published = TRUE LIMIT 25'),
    ]);

    const settings = settingsRows[0] || {
      hospital_name: 'SmartCare Hospital - Shri Gajanan Multispeciality',
      phone: '+91 22 2845 6789',
      emergency_helpline: '+91 22 2845 9999',
      email: 'contact@smartcarehospital.org',
      address: 'Plot No. 42, Station Road, Near Gajanan Maharaj Mandir, Borivali West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400092',
      operating_hours: '24 Hours Emergency & ICU | OPD Desk: Mon - Sat: 08:00 AM - 08:00 PM (Sunday: Emergency Only)',
    };

    return {
      settings,
      specialities: specialitiesRows || [],
      doctors: doctorsRows || [],
      schemes: schemesRows || [],
      labTests: labTestsRows || [],
    };
  } catch (err: any) {
    console.warn('[AI Context Fetch Error]:', err.message);
    return {
      settings: {
        hospital_name: 'SmartCare Hospital - Shri Gajanan Multispeciality Hospital & Research Center',
        phone: '+91 22 2845 6789',
        emergency_helpline: '+91 22 2845 9999',
        email: 'contact@smartcarehospital.org',
        address: 'Plot No. 42, Station Road, Near Gajanan Maharaj Mandir, Borivali West, Mumbai 400092',
        operating_hours: '24/7 Emergency & ICU | OPD: Mon - Sat: 08:00 AM - 08:00 PM',
      },
      specialities: [],
      doctors: [],
      schemes: [],
      labTests: [],
    };
  }
}

// Fallback message generator using verified hospital data when AI API key is not configured
function generateVerifiedFallback(userMsg: string, data: any): string {
  const q = userMsg.toLowerCase().trim();
  const s = data.settings;

  // 1. Doctors / Specialists
  if (q.includes('doctor') || q.includes('specialist') || q.includes('physician') || q.includes('cardiologist') || q.includes('neurologist')) {
    if (data.doctors.length > 0) {
      const docList = data.doctors.slice(0, 5).map((d: any) => 
        `• ${d.name} (${d.speciality || 'Specialist'}) - ${d.qualifications}, ${d.experience_years} yrs exp. Fee: ₹${d.consultation_fee}`
      ).join('\n');
      return `👨‍⚕️ Here are specialist doctors currently practicing at Shri Gajanan Hospital:\n\n${docList}\n\nTo view all consultants or schedule an OPD slot, click "Book an Appointment" or visit the Doctor Directory.`;
    }
    return `👨‍⚕️ We have specialists across Cardiology, Orthopaedics, Neurology, Gynaecology, Paediatrics, and General Medicine. You can view full profiles in our Doctor Directory or book an appointment on the portal.`;
  }

  // 2. Timings & Hours
  if (q.includes('timing') || q.includes('hour') || q.includes('opd') || q.includes('open') || q.includes('close')) {
    return `🕒 Hospital Operating Hours:\n\n• 24/7 Emergency Casualty & Trauma Care: Always Open (24 Hours)\n• OPD Consultation Desk: Monday to Saturday, 08:00 AM – 08:00 PM\n• Sunday: Emergency & Critical Care Only\n• Diagnostic Laboratory: 24/7 for Inpatient & Emergency; 07:00 AM – 09:00 PM for Outpatient\n\nEmergency Helpline: ${s.emergency_helpline || '+91 22 2845 9999'}`;
  }

  // 3. Appointment Booking
  if (q.includes('book') || q.includes('appointment') || q.includes('slot') || q.includes('consult')) {
    return `🗓️ How to Book an Appointment at Shri Gajanan Hospital:\n\n1. Click "Book an Appointment" right on the website.\n2. Select your Medical Department and Consultant Doctor.\n3. Choose your consultation date and preferred time slot.\n4. Enter patient contact details and confirm.\n\nYour appointment reference number is generated instantly with slot-conflict protection!`;
  }

  // 4. Laboratory Tests
  if (q.includes('lab') || q.includes('test') || q.includes('blood') || q.includes('diagnostic') || q.includes('pathology') || q.includes('cbc')) {
    if (data.labTests.length > 0) {
      const testList = data.labTests.slice(0, 5).map((t: any) => 
        `• ${t.test_name} (${t.category}) - ₹${t.price} (Turnaround: ${t.turnaround_time_hours} hrs)`
      ).join('\n');
      return `🔬 Diagnostic Laboratory Services:\n\nOur NABL-accredited diagnostic laboratory operates 24/7. Key tests include:\n\n${testList}\n\nBrowse our full Diagnostic Laboratory tab to view all tests, home sample collection, and reporting details.`;
    }
    return `🔬 Our hospital features a 24/7 advanced automated diagnostic lab offering Complete Blood Count, Lipid Profile, Liver & Kidney Function Tests, Thyroid Panels, and specialised pathology with quick digital turnaround.`;
  }

  // 5. Health Schemes (Ayushman Bharat, MJPJAY, etc.)
  if (q.includes('scheme') || q.includes('ayushman') || q.includes('pmjay') || q.includes('mjpjay') || q.includes('cashless') || q.includes('insurance') || q.includes('yojana')) {
    return `🛡️ Government Healthcare Schemes Accepted:\n\n• Ayushman Bharat PM-JAY: Up to ₹5,00,000 cashless cover per family per year for secondary and tertiary inpatient care.\n• Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY): Up to ₹5,00,000 cover for eligible Maharashtra ration card holders.\n• CGHS & ESIC: Empanelled for central government employees and insured workers.\n\nOur 24/7 Arogya Mitra helpdesk assists with on-the-spot document verification and cashless admissions!`;
  }

  // 6. Location / Address / Contact
  if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('reach') || q.includes('contact') || q.includes('phone') || q.includes('map')) {
    return `📍 Shri Gajanan Multispeciality Hospital Location & Contact:\n\n• Address: ${s.address || 'Plot No. 42, Station Road, Near Gajanan Maharaj Mandir, Borivali West'}, ${s.city || 'Mumbai'} ${s.pincode || '400092'}\n• 24/7 Emergency Line: ${s.emergency_helpline || '+91 22 2845 9999'}\n• OPD Desk: ${s.phone || '+91 22 2845 6789'}\n• Email: ${s.email || 'contact@smartcarehospital.org'}\n\nLocated within 5 minutes of Borivali Station with drive-in emergency ambulance casualty access.`;
  }

  // 7. General Welcome / Unconfigured Notice
  return `Hello! 👋 SmartCare AI Assistant is currently in hospital directory mode (AI API key not yet configured in server environment).\n\nHere is verified information for Shri Gajanan Hospital:\n• 📍 Location: ${s.address || 'Plot No. 42, Station Road, Borivali West, Mumbai'}\n• 📞 Emergency (24/7): ${s.emergency_helpline || '+91 22 2845 9999'}\n• 🕒 OPD Timings: Mon – Sat: 08:00 AM – 08:00 PM\n• 👨‍⚕️ 10+ Specialist Doctors across Cardiology, Neurology, Orthopaedics & more.\n\nFeel free to click any of the suggested topics below!`;
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

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    // Check if an AI API is configured
    if (!geminiKey && !openAiKey) {
      // Provide verified database-backed fallback response
      const fallbackReply = generateVerifiedFallback(trimmedMsg, contextData);
      return res.json({
        reply: fallbackReply,
        isFallback: true,
        configured: false,
      });
    }

    // Build verified hospital system prompt
    const specialitiesSummary = contextData.specialities.map((sp: any) => `• ${sp.name}: ${sp.description || ''}`).join('\n');
    const doctorsSummary = contextData.doctors.map((d: any) => 
      `• ${d.name} (${d.speciality || 'General'}): ${d.qualifications}, ${d.experience_years} years experience, Fee: ₹${d.consultation_fee}, Status: ${d.availability_status}, Hours: ${d.working_hours_start} - ${d.working_hours_end}`
    ).join('\n');
    const schemesSummary = contextData.schemes.map((sc: any) => 
      `• ${sc.name} (${sc.category}): Coverage ${sc.coverage_amount}, Hospital Status: ${sc.hospital_acceptance_status}`
    ).join('\n');
    const testsSummary = contextData.labTests.map((t: any) => 
      `• ${t.test_name} (${t.category}): ₹${t.price}, Turnaround: ${t.turnaround_time_hours}h`
    ).join('\n');

    const systemPrompt = `You are SmartCare AI, the friendly, professional, 24/7 AI Hospital Assistant for Shri Gajanan Multispeciality Hospital & Research Center.

=== VERIFIED HOSPITAL DATABASE INFORMATION ===
Hospital: ${s.hospital_name || 'Shri Gajanan Multispeciality Hospital'}
Tagline: ${s.tagline || 'Excellence in Healthcare, Compassion in Healing'}
Address: ${s.address || 'Plot No. 42, Station Road, Borivali West'}, ${s.city || 'Mumbai'}, ${s.state || 'Maharashtra'} - ${s.pincode || '400092'}
24/7 Emergency Line: ${s.emergency_helpline || '+91 22 2845 9999'}
OPD Helpdesk: ${s.phone || '+91 22 2845 6789'}
Email: ${s.email || 'contact@smartcarehospital.org'}
Operating Hours: ${s.operating_hours || '24/7 Emergency & ICU | OPD Desk: Mon - Sat: 08:00 AM - 08:00 PM'}

Medical Departments:
${specialitiesSummary || 'Cardiology, Orthopaedics, Neurology, Gynaecology, Paediatrics, Oncology, Nephrology, General Medicine.'}

Doctor Directory:
${doctorsSummary || 'Specialist consultants available across departments.'}

Government Health Schemes:
${schemesSummary || 'Ayushman Bharat PM-JAY (₹5 Lakh cover), Maharashtra MJPJAY (₹5 Lakh cover), CGHS, ESIC.'}

Diagnostic Laboratory:
${testsSummary || 'Full automated 24/7 pathology & diagnostic biochemistry.'}

=== CRITICAL MEDICAL SAFETY GUIDELINES ===
1. You are an AI informational assistant, NOT a medical doctor.
2. NEVER diagnose illnesses or conditions based on symptoms.
3. NEVER prescribe medications, drugs, or therapeutic dosages.
4. If a user describes severe emergency symptoms (chest pain, stroke, trauma, acute bleeding, severe breathing difficulty), immediately tell them to contact our 24/7 Emergency hotline at ${s.emergency_helpline || '+91 22 2845 9999'} or visit the hospital emergency department right now.
5. Always guide users to consult a specialist doctor for accurate medical evaluation.
6. When answering hospital queries, use only the verified facts above. Do NOT invent fictional doctors or timings.
7. Keep answers polite, warm, concise, and structured with bullet points.`;

    // 1. Google Gemini Provider
    if (geminiKey) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      
      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.sender === 'patient' || item.sender === 'user') {
            contents.push({ role: 'user', parts: [{ text: item.text }] });
          } else if (item.sender === 'ai' || item.sender === 'assistant' || item.sender === 'model') {
            contents.push({ role: 'model', parts: [{ text: item.text }] });
          }
        }
      }
      contents.push({ role: 'user', parts: [{ text: trimmedMsg }] });

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
          },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error('[Gemini API Error]:', geminiRes.status, errText);
        // Fallback to verified template answer if API returns error
        return res.json({
          reply: generateVerifiedFallback(trimmedMsg, contextData),
          isFallback: true,
          configured: true,
        });
      }

      const geminiData = await geminiRes.json();
      const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        return res.json({
          reply: generatedText.trim(),
          configured: true,
          provider: 'Gemini',
        });
      }
    }

    // 2. OpenAI Provider
    if (openAiKey) {
      const openAiUrl = 'https://api.openai.com/v1/chat/completions';
      const messages: any[] = [{ role: 'system', content: systemPrompt }];

      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.sender === 'patient' || item.sender === 'user') {
            messages.push({ role: 'user', content: item.text });
          } else if (item.sender === 'ai' || item.sender === 'assistant') {
            messages.push({ role: 'assistant', content: item.text });
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
          max_tokens: 600,
        }),
      });

      if (!openAiRes.ok) {
        const errText = await openAiRes.text();
        console.error('[OpenAI API Error]:', openAiRes.status, errText);
        return res.json({
          reply: generateVerifiedFallback(trimmedMsg, contextData),
          isFallback: true,
          configured: true,
        });
      }

      const openAiData = await openAiRes.json();
      const generatedText = openAiData.choices?.[0]?.message?.content;
      if (generatedText) {
        return res.json({
          reply: generatedText.trim(),
          configured: true,
          provider: 'OpenAI',
        });
      }
    }

    return res.json({
      reply: generateVerifiedFallback(trimmedMsg, contextData),
      isFallback: true,
      configured: false,
    });
  } catch (err: any) {
    console.error('[AI Chat Router Error]:', err);
    return res.status(500).json({
      error: 'An unexpected error occurred while processing your request.',
    });
  }
});

export default router;

